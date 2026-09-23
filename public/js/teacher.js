/**
 * 교사용 전체 학습 화면.
 *
 * 화면 하나에 컷 하나. 발문·영상·학생 응답·퀴즈·접속 QR까지 전부 컷으로 흐른다.
 * (예전에는 오른쪽 도구창에 있어서 교사가 수업 중에 따로 찾아 눌러야 했다)
 *
 * 흐름:  학년 고르기 → 9장면 → 학생 활동 안내(QR)
 */

import { SECTIONS, BANDS, BAND_ORDER, resolveSection, totalMinutes, beatsFor } from './data/lesson.js';
import { defaultVideo, formatDuration, embedUrl, watchUrl } from './data/videos.js';
import { quizFor, titleFor } from './data/quiz.js';
import { assetsFor, heroFor } from './shared/assets.js';
import { renderStage, preload } from './shared/stage.js';
import { hasServer, qrDataUrl } from './shared/offline.js';
import { mountBgm, holdBgm } from './shared/bgm.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 퀴즈 보기 색 — 학생 기기의 버튼 색과 같아야 한다 */
const CHOICE = [
  { color: '#e4703a', mark: '▲' },
  { color: '#3f7fd4', mark: '●' },
  { color: '#d9a53f', mark: '■' },
  { color: '#4a9b78', mark: '◆' },
];

const state = {
  picked: false,     // 학년을 골랐는가
  index: 0,          // 몇 번째 장면 (SECTIONS.length = 학생 활동 안내)
  beat: 0,
  band: 'mid',
  startedAt: Date.now(),
};

let snap = null;      // 서버에서 받은 교실 상태
let connect = null;   // QR·코드
let quizStarting = false; // 시작 직후 대기실 갱신이 첫 문제를 덮어쓰지 않도록

/* 이 화면이 연 방의 열쇠. 새로고침해도 같은 방으로 돌아오도록 저장해 둔다.
   로그인이 없는 앱이라, 이 열쇠가 곧 "이 방은 내 방"이라는 증표다. */
const KEY_SAVE = 'chuseok.teacherKey';
let roomKey = null;
try { roomKey = localStorage.getItem(KEY_SAVE); } catch { /* 사생활 보호 창 */ }

const LAST = SECTIONS.length;              // 학생 활동 안내 단계
const isLast = () => state.index >= LAST;
const section = () => SECTIONS[state.index] ?? null;

/* ═══════════════ 컷 만들기 ═══════════════ */

function currentBeats() {
  if (isLast()) return [{ kind: 'connect', art: assetsFor('ui').find((a) => a.id === 'student-welcome') }];

  const s = section();
  const art = [...assetsFor(s.id)].sort((a, b) => (a.role === 'hero' ? -1 : b.role === 'hero' ? 1 : 0));
  const beats = beatsFor(s, state.band, art, { video: defaultVideo(s.id, state.band) });

  /* 학생 응답이 모이는 장면은 그 응답 자체가 한 컷이 된다 */
  const spare = () => art[(beats.length + 1) % art.length];
  if (s.id === 'wish') beats.push({ kind: 'wall', art: spare() });
  if (s.id === 'today') beats.push({ kind: 'opinions', art: spare() });

  /* 마무리 장면은 라이브 퀴즈 — 문제마다 한 컷, 끝에 순위 */
  if (s.id === 'wrap') {
    const qs = quizFor(state.band);
    /* 문제를 바로 열지 않는다. 먼저 다 모였는지 이름으로 확인한다. */
    beats.push({ kind: 'lobby', total: qs.length, art: spare() });
    qs.forEach((q, i) => beats.push({ kind: 'quiz', q, qIndex: i, total: qs.length, art: spare() }));
    beats.push({ kind: 'rank', art: spare() });
  }

  return beats;
}

/* ═══════════════ 그리기 ═══════════════ */

function paint() {
  if (!state.picked) return paintPick();

  $('pick').hidden = true;
  $('scene').hidden = false;
  $('bar').hidden = false;

  const list = currentBeats();
  state.beat = Math.max(0, Math.min(list.length - 1, state.beat));
  const cut = list[state.beat];

  /* 영상이 나올 땐 음악을 쉰다. 유튜브 소리 위에 겹치면 둘 다 안 들린다. */
  holdBgm(cut?.kind === 'video');

  /* 곧 넘길 컷의 그림만 미리 */
  queueMicrotask(lookahead);

  /* 대기실·문제·시상식을 모두 벗어나면 라이브를 닫는다.
     안 닫으면 학생 기기가 퀴즈 화면에 갇혀서 다음으로 못 넘어간다. */
  const LIVE_CUTS = ['lobby', 'quiz', 'rank'];
  if (snap?.live?.on && !LIVE_CUTS.includes(cut?.kind)) live('close');

  /* 컷에 들어서면 그 단계를 학생 화면에도 알린다 */
  if (cut?.kind === 'lobby' && !quizStarting && snap?.live?.phase !== 'lobby') live('lobby', { total: cut.total });
  if (cut?.kind === 'rank' && snap?.live?.phase !== 'final') live('final');

  if (cut?.art) renderStage($('scene'), cut.art.id, { motion: cut.art.motion, layers: cut.art.layers });

  const s = section();
  $('sceneNo').textContent = isLast() ? `마무리 · ${LAST + 1} / ${LAST + 1}` : `장면 ${state.index + 1} / ${LAST + 1}`;
  $('sceneSub').textContent = isLast() ? '학생 활동' : s.subtitle;
  $('sceneMin').textContent = isLast() ? '15분' : `${s.minutes[state.band]}분`;
  $('sceneMin').hidden = false;

  const kw = isLast() ? '' : resolveSection(s, state.band).body.keyword ?? '';
  $('keyword').textContent = kw;
  $('keyword').hidden = !kw;

  paintCut(cut);
  paintDots(list);
  paintSteps();
  paintSide();
}

function paintPick() {
  $('pickCards').innerHTML = pickCardsHtml();
  $('bandCards').innerHTML = pickCardsHtml();
}

function pickCardsHtml() {
  return BAND_ORDER.map((id) => {
    const b = BANDS[id];
    return `<button class="gradecard" data-band="${id}" aria-pressed="${id === state.band}">
      <span class="gradecard__emoji">${b.emoji}</span>
      <b>${b.label}</b>
      <span class="gradecard__sub">${esc(b.blurb)}</span>
      <span class="gradecard__meta">${totalMinutes(id)}분 · ${b.quizStyle}</span>
    </button>`;
  }).join('');
}

function paintCut(cut) {
  const host = $('sceneMain');
  if (!cut) { host.innerHTML = ''; return; }

  host.className = 'scene__main';
  const wide = () => host.classList.add('scene__main--wide');

/* 달 하늘·대기실·시상식은 무대를 통째로 쓴다 — 폭을 제한하면 줄이 쌓여 잘린다 */
  const full = () => host.classList.add('scene__main--full');

  switch (cut.kind) {
    case 'line': {
      const s = resolveSection(section(), state.band);
      host.innerHTML = `
        ${cut.showTitle ? `
          <h1 class="scene__title"><span class="ico">${s.icon}</span><span>${esc(s.title)}</span></h1>
          <p class="scene__headline">${esc(s.body.headline)}</p>` : ''}
        <p class="cut__text">${esc(cut.text)}</p>`;
      break;
    }

    case 'facts':
      wide();
      host.innerHTML = `
        <p class="cut__lead">이 말들을 알아둬요</p>
        <div class="facts">${cut.facts.map((f, i) =>
          `<div class="fact" style="animation-delay:${0.08 * i + 0.05}s">
             <b>${esc(f.term ?? `${f.emoji ?? ''} ${f.name}`)}</b><span>${esc(f.gloss)}</span>
           </div>`).join('')}</div>`;
      break;

    case 'video':
      wide();
      host.innerHTML = `
        <p class="cut__lead">🎬 같이 봅시다</p>
        <div class="cut__video">
          <iframe src="${embedUrl(cut.video)}" title="${esc(cut.video.title)}"
                  allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
                  allowfullscreen loading="lazy"
                  referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <div class="cut__videometa">
          <b>${esc(cut.video.title)}</b>
          <span>${esc(cut.video.channel)} · ${formatDuration(cut.video.seconds)}</span>
          <a href="${watchUrl(cut.video)}" target="_blank" rel="noopener">유튜브에서 열기 ↗</a>
        </div>`;
      break;

    case 'ask':
      wide();
      host.innerHTML = `
        <p class="cut__lead">💬 같이 생각해 봐요</p>
        ${cut.ask.map((q, i) =>
          `<p class="cut__ask" style="animation-delay:${0.12 * i + 0.05}s">${esc(q)}</p>`).join('')}
        ${section().teacherCaution
          ? `<div class="cut__caution">⚠ ${esc(section().teacherCaution)}</div>` : ''}`;
      break;

    case 'wall': {
      full();
      const w = snap?.wishes ?? [];
      /* 소원 하나에 달 하나. 너무 많으면 글씨가 작아져 못 읽으므로 최근 것부터 띄운다. */
      const moons = [...w].reverse().slice(0, MOON_MAX);

      host.innerHTML = `
        <p class="cut__lead">🌙 우리 반 소원 <span class="cut__count">${w.length}개</span></p>
        <div class="wishwrap">
          <div class="wishsky" data-many="${moons.length > 8 ? 'yes' : 'no'}">
            ${moons.length
              ? moons.map((x, i) => `
                  <div class="moonwish ${x.forWhom === 'us' ? 'is-us' : ''}"
                       style="--i:${i}; --drift:${(6 + (i % 5) * 1.3).toFixed(1)}s">
                    <span class="moonwish__text">${esc(x.text)}</span>
                    <span class="moonwish__name">${esc(x.name)}</span>
                  </div>`).join('')
              : '<p class="cut__wait">학생이 소원을 보내면 달이 하나씩 떠오릅니다</p>'}
          </div>

          <div class="joinbox">
            <p class="joinbox__lead">여기로 들어와<br>소원을 적어요</p>
            <div class="joinbox__qr">${connect?.qr
              ? `<img src="${connect.qr}" alt="소원 적기 접속 QR 코드">`
              : '<span>주소를 부르는 중…</span>'}</div>
            ${connect?.standalone ? '' : `<p class="joinbox__code">${connect?.code ?? '------'}</p>`}
            <p class="joinbox__note">보내면 내 달이 떠올라요</p>
          </div>
        </div>`;
      break;
    }

    case 'opinions': {
      wide();
      const o = snap?.opinions ?? [];
      host.innerHTML = `
        <p class="cut__lead">💭 모인 생각 <span class="cut__count">${o.length}개</span></p>
        <div class="wallgrid">${o.length
          ? [...o].reverse().slice(0, 12).map((x) =>
              `<div class="wallcard">${esc(x.text)}<em>${esc(x.name)}</em></div>`).join('')
          : '<p class="cut__wait">학생들이 생각을 보내면 여기에 뜹니다</p>'}</div>`;
      break;
    }

    case 'quiz':
      wide();
      host.innerHTML = quizHtml(cut);
      break;

    case 'lobby': {
      full();
      const here = (snap?.students ?? []).filter((x) => x.online);
      host.innerHTML = `
        <p class="cut__lead">🙋 다 모였나요? <span class="cut__count">${here.length}명</span></p>
        <div class="wishwrap">
          <div class="lobby">
            <div class="lobby__names">${here.length
              ? here.map((x, i) => `<span class="lobby__name" style="--i:${i}">${esc(x.name)}</span>`).join('')
              : '<p class="cut__wait">QR을 찍고 들어오면 이름이 하나씩 나타납니다</p>'}</div>
            <button class="btn btn--primary btn--lg" id="quizGo" ${here.length ? '' : 'disabled'}>
              퀴즈 시작 ▶
            </button>
            <p class="lobby__note">문제는 모두 ${cut.total}개입니다</p>
          </div>

          <div class="joinbox">
            <p class="joinbox__lead">여기로 들어와<br>퀴즈에 참여해요</p>
            <div class="joinbox__qr">${connect?.qr
              ? `<img src="${connect.qr}" alt="퀴즈 접속 QR 코드">`
              : '<span>주소를 부르는 중…</span>'}</div>
            ${connect?.standalone ? '' : `<p class="joinbox__code">${connect?.code ?? '------'}</p>`}
            <p class="joinbox__note">들어오면 이름이 왼쪽에 떠요</p>
          </div>
        </div>`;

      /* 대기실에서 바로 첫 문제로 — 넘기고 또 여는 두 번 수고를 없앤다.
         점수를 비우는 것은 여기, 시작을 누르는 순간뿐이다. */
      host.querySelector('#quizGo').onclick = async () => {
        const button = host.querySelector('#quizGo');
        button.disabled = true;
        quizStarting = true;
        try {
          if (!(await live('reset', {}, { repaint: false }))) {
            button.disabled = false;
            return;
          }
          step(1);
          const first = currentBeats()[state.beat];
          if (first?.kind === 'quiz') await openQuizCut(first);
        } finally {
          quizStarting = false;
        }
      };
      break;
    }

    case 'rank': {
      full();
      const board = snap?.leaderboard ?? [];
      const podium = board.slice(0, 3);
      const rest = board.slice(3);
      host.innerHTML = `
        <p class="cut__lead">🏆 오늘의 추석왕</p>
        ${podium.length ? `
          <div class="podium">
            ${podium.map((r, i) => {
              const t = titleFor(i + 1);
              return `<div class="podium__s podium__s--${i + 1}">
                <span class="podium__icon">${t.icon}</span>
                <b class="podium__name">${esc(r.name)}</b>
                <span class="podium__title">${t.title}</span>
                <span class="podium__score">${r.score.toLocaleString('ko-KR')}점</span>
                <i class="podium__step">${i + 1}</i>
              </div>`;
            }).join('')}
          </div>` : ''}
        ${rest.length ? `
          <div class="rank">${rest.map((r, i) =>
            `<div class="rank__row">
               <span class="rank__no">${i + 4}</span>
               <span class="rank__name">${esc(r.name)}</span>
               <span class="rank__score">${r.score.toLocaleString('ko-KR')}</span>
             </div>`).join('')}</div>` : ''}
        ${board.length ? '' : '<p class="cut__wait">퀴즈를 풀면 순위가 나옵니다</p>'}
        <button class="btn btn--sm btn--ghost" id="rankReset">퀴즈 점수 초기화</button>`;
      host.querySelector('#rankReset').onclick = () => live('reset');
      break;
    }

    case 'connect':
      wide();
      host.innerHTML = `
        <p class="cut__lead">🙋 이제 각자 해봅시다</p>
        <div class="connectcut">
          <div class="connectcut__qr">${connect?.qr
            ? `<img src="${connect.qr}" alt="학생 접속 QR 코드">`
            : `<span>${connect ? '위 주소를 직접 열어 주세요' : '주소를 부르는 중…'}</span>`}</div>
          <div class="connectcut__info">
            ${connect?.standalone
              ? '<p class="connectcut__code connectcut__code--url">혼자 해보기</p>'
              : `<p class="connectcut__code">${connect?.code ?? '------'}</p>`}
            <p class="connectcut__url">${esc(connect?.url ?? '')}</p>
            <ul class="connectcut__steps">
              <li>QR을 찍거나 위 주소로 들어와요</li>
              ${connect?.standalone ? '<li><b>혼자 해보기</b>를 누르고 학년을 골라요</li>' : ''}
              <li>송편 빚기, 차례상, 강강술래, 소원 적기를 해요</li>
              <li>마치면 <b>엽서로 저장</b>을 눌러요</li>
              <li>저장한 그림을 <b>패들릿</b>에 올려요</li>
            </ul>
          </div>
        </div>`;
      break;

    default:
      host.innerHTML = '';
  }
}

/** 한 화면에 띄울 달의 최대 수 — 이보다 많으면 글씨가 작아져 못 읽는다 */
const MOON_MAX = 14;

/* ═══════════════ 라이브 퀴즈 ═══════════════ */

function quizHtml(cut) {
  const L = snap?.live ?? {};
  const mine = L.on && L.questionId === cut.q.id;
  const revealed = mine && L.revealed;
  const opts = cut.q.type === 'ox' ? ['⭕ 맞아요', '❌ 아니에요'] : cut.q.options;
  const answerIdx = cut.q.type === 'ox' ? (cut.q.answer ? 0 : 1) : cut.q.answer;
  const counts = mine ? (L.counts ?? {}) : {};
  const most = Math.max(1, ...Object.values(counts));

  return `
    <div class="quiz">
      <div class="quiz__head">
        <span>문제 ${cut.qIndex + 1} / ${cut.total}</span>
        ${mine && !revealed
          ? `<span class="quiz__timer"><i id="quizBar" style="width:${(L.remainMs / L.limitMs) * 100}%"></i></span>
             <span class="quiz__count">${L.answered ?? 0}명 응답</span>`
          : revealed
            ? `<span class="quiz__count">${L.correct ?? 0} / ${L.answered ?? 0} 정답</span>`
            : '<span class="quiz__count">아직 안 열림</span>'}
      </div>

      <p class="quiz__q">${esc(cut.q.q)}</p>

      <div class="quiz__opts">
        ${opts.map((o, i) => {
          const n = counts[i] ?? 0;
          const right = revealed && i === answerIdx;
          return `<div class="quiz__opt ${revealed ? (right ? 'right' : 'dim') : ''}"
                       style="--c:${CHOICE[i].color}">
            <span class="quiz__mark">${CHOICE[i].mark}</span>
            <span class="quiz__label">${esc(o)}</span>
            ${revealed ? `<span class="quiz__n">${n}</span>
              <i class="quiz__bar" style="width:${(n / most) * 100}%"></i>` : ''}
          </div>`;
        }).join('')}
      </div>

      ${revealed ? `<div class="quiz__why">${esc(cut.q.why)}</div>` : ''}

      <div class="quiz__ctrl">
        ${!mine
          ? '<button class="btn btn--primary btn--lg" data-live="open">문제 열기 ▶</button>'
          : !revealed
            ? '<button class="btn btn--gold btn--lg" data-live="reveal">정답 공개</button>'
            : '<button class="btn btn--primary btn--lg" data-live="next">다음 문제 ▶</button>'}
      </div>
    </div>`;
}

function openQuizCut(cut) {
  const opts = cut.q.type === 'ox' ? 2 : cut.q.options.length;
  return live('open', { index: cut.qIndex, questionId: cut.q.id, choiceCount: opts, limitMs: 20000, total: cut.total });
}

async function live(action, extra = {}, { repaint = true } = {}) {
  try {
    if (!roomKey) return false;
    const res = await fetch('/api/teacher/live', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: roomKey, action, ...extra }),
    });
    if (!res.ok) return false;
    snap = await res.json();
    if (repaint) paint();
    return true;
  } catch { /* 서버가 잠깐 끊겨도 화면은 유지 */ }
  return false;
}

/* 남은 시간 막대를 부드럽게 줄인다 */
setInterval(() => {
  const bar = $('quizBar');
  const L = snap?.live;
  if (!bar || !L?.on || L.revealed) return;
  const left = Math.max(0, L.limitMs - (Date.now() - L.openedAt));
  bar.style.width = `${(left / L.limitMs) * 100}%`;
  if (left <= 0) live('reveal');
}, 200);

/* ═══════════════ 아래 바 ═══════════════ */

function paintDots(list) {
  $('beatDots').innerHTML = list.length < 2 ? '' : list
    .map((b, i) => `<button data-beat="${i}" aria-current="${i === state.beat}"
        class="${b.kind === 'quiz' ? 'is-quiz' : ''}" title="${b.kind}"></button>`).join('');
}

function paintSteps() {
  const all = [...SECTIONS.map((s) => ({ icon: s.icon, label: s.subtitle })),
               { icon: '🙋', label: '학생 활동' }];
  /* 그림 없이 글자만. 멀리서 보고 누르는 단추라 이름이 커야 한다. */
  $('steps').innerHTML = all.map((s, i) =>
    `<button class="step ${i < state.index ? 'done' : ''}" data-go="${i}"
             aria-current="${i === state.index}" title="${esc(s.label)}">
       <span>${esc(s.label)}</span>
     </button>`).join('');
}

function paintSide() {
  const b = BANDS[state.band];
  $('bandChip').textContent = `${b.emoji} ${b.label}`;
  const online = (snap?.students ?? []).filter((s) => s.online).length;
  $('liveChip').textContent = `🙋 ${online}명`;

  const sec = Math.floor((Date.now() - state.startedAt) / 1000);
  $('elapsed').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const done = SECTIONS.slice(0, Math.min(state.index + 1, LAST))
    .reduce((n, s) => n + s.minutes[state.band], 0);
  $('planned').textContent = `예정 ${done} / ${totalMinutes(state.band)}분`;
}

/* ═══════════════ 이동 ═══════════════ */

function goto(i, beat = 0) {
  state.index = Math.max(0, Math.min(LAST, i));
  state.beat = beat === 'last' ? 999 : beat;
  paint();
  pushState();

}

/**
 * 곧 볼 그림만 미리 받는다 — 지금 컷 다음 두 장, 장면 끝이면 다음 장면 첫 장.
 *
 * 예전에는 장면에 들어서면 다음 장면 그림을 통째로(대개 7~10장, 4~6MB) 받았고,
 * 화면을 열자마자 첫 장면 그림 7장(3.9MB)을 받았다. 교실 와이파이를 학생 서른 대가
 * 나눠 쓰면 이 짐이 모두의 발목을 잡는다. 두 컷 앞이면 넘길 때 흰 화면이 번쩍이지 않는다.
 */
const preloaded = new Set();
function lookahead() {
  const list = currentBeats();
  const ids = [];
  for (let i = state.beat + 1; i <= state.beat + 2 && i < list.length; i += 1) {
    if (list[i]?.art?.id) ids.push(list[i].art.id);
  }
  if (state.beat + 2 >= list.length) {
    const next = SECTIONS[state.index + 1];
    const hero = next && heroFor(next.id);
    if (hero) ids.push(hero.id);
  }
  const fresh = ids.filter((id) => !preloaded.has(id));
  fresh.forEach((id) => preloaded.add(id));
  if (fresh.length) preload(fresh);
}

function step(dir) {
  const count = currentBeats().length;
  const next = state.beat + dir;
  if (next >= 0 && next < count) {
    const previousCut = currentBeats()[state.beat];
    const advanceLiveQuiz = dir > 0 && previousCut?.kind === 'quiz'
      && snap?.live?.questionId === previousCut.q.id && snap.live.revealed;
    state.beat = next;
    paint();
    /* 컷만 넘겨도 서버에 알려야 한다. 활동을 여는 컷이 있어서,
       여기서 안 보내면 학생 화면에 소원 칸이 안 뜬다. */
    pushState();
    const nextCut = currentBeats()[state.beat];
    if (advanceLiveQuiz && nextCut?.kind === 'quiz') openQuizCut(nextCut);
    return;
  }
  if (dir > 0 && state.index < LAST) return goto(state.index + 1);
  if (dir < 0 && state.index > 0) return goto(state.index - 1, 'last');
}

/* ═══════════════ 서버 ═══════════════ */

/**
 * 내 방을 마련한다.
 * 전에 쓰던 열쇠가 아직 살아 있으면 그 방을 그대로 쓰고(새로고침),
 * 아니면 새로 연다. 방마다 입장 코드가 달라서 옆 반과 섞이지 않는다.
 */
async function ensureRoom() {
  if (!(await hasServer())) return false;

  if (roomKey) {
    try {
      const res = await fetch(`/api/teacher/state?key=${encodeURIComponent(roomKey)}`);
      if (res.ok) { snap = await res.json(); return true; }
    } catch { /* 아래에서 새로 연다 */ }
  }

  return openNewRoom();
}

/**
 * 방을 하나 새로 연다.
 * 한 번 실패했다고 포기하지 않는다 — 여기서 포기하면 서버가 있는데도
 * 입장 코드 없이 수업을 시작하게 된다.
 */
async function openNewRoom() {
  for (const wait of [0, 800, 2000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      const res = await fetch('/api/teacher/open', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ band: state.band }),
      });
      if (!res.ok) continue;
      ({ key: roomKey } = await res.json());
      try { localStorage.setItem(KEY_SAVE, roomKey); } catch { /* 사생활 보호 창 */ }
      return true;
    } catch { /* 다시 */ }
  }
  return false;
}

/**
 * 방이 사라졌을 때 되살린다.
 *
 * 방은 서버 메모리에만 있어서, 서버가 잠들었다 깨거나 다시 배포되면 통째로 없어진다.
 * 그때 이 화면이 가만히 있으면 칠판에 적힌 코드는 죽은 코드가 되고,
 * 학생은 "입장 코드가 맞지 않아요"만 본다. 실제로 그 일이 있었다.
 * 그래서 410을 받으면 곧바로 새 방을 열고 코드와 QR을 다시 받아 화면에 띄운다.
 */
let recovering = null;
async function recoverRoom() {
  recovering ??= (async () => {
    roomKey = null;
    const ok = await openNewRoom();
    if (ok) {
      await loadConnect();
      await pushState();
      listen();
      paint();
      showNotice('수업방이 다시 열렸어요 — 새 코드를 알려주세요');
    }
    recovering = null;
    return ok;
  })();
  return recovering;
}

/** 화면 위쪽에 잠깐 뜨는 알림 */
function showNotice(text) {
  let box = document.getElementById('notice');
  if (!box) {
    box = document.createElement('div');
    box.id = 'notice';
    box.className = 'notice';
    document.body.append(box);
  }
  box.textContent = text;
  box.classList.add('is-on');
  clearTimeout(showNotice.t);
  showNotice.t = setTimeout(() => box.classList.remove('is-on'), 9000);
}

async function pushState() {
  if (!roomKey) return;                // 방이 없으면(정적 호스팅) 보낼 곳도 없다
  try {
    /* 아래 fetch의 응답을 보고 410이면 방을 되살린다 */
    const res = await fetch('/api/teacher/state', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        key: roomKey,
        band: state.band,
        sectionId: isLast() ? 'student' : section().id,
        /* 마지막 단계는 물론이고, 소원 달 컷에서도 학생 칸을 연다.
           그 화면의 QR로 들어온 아이가 바로 소원을 적을 수 있어야 한다. */
        activityOpen: isLast() || currentBeats()[state.beat]?.kind === 'wall',
        studentsFollow: true,
      }),
    });
    if (res.status === 410) await recoverRoom();
  } catch { /* 무시 */ }
}

async function pull() {
  if (!roomKey) return;
  try {
    const res = await fetch(`/api/teacher/state?key=${encodeURIComponent(roomKey ?? '')}`);
    if (res.ok) { snap = await res.json(); if (state.picked) paint(); return; }
    if (res.status === 410) await recoverRoom();   // 서버가 다시 켜져 방이 없어졌다
  } catch { /* 잠깐 끊긴 것뿐일 수 있다 */ }
}

async function loadConnect() {
  if (await hasServer()) {
    try {
      connect = await (await fetch(`/api/connect?key=${encodeURIComponent(roomKey ?? '')}`)).json();
      if (state.picked && isLast()) paint();
      return;
    } catch { /* 아래 정적 안내로 내려간다 */ }
  }

  /* 교실 서버가 없는 곳(정적 호스팅)에 올라간 경우.
     입장 코드는 만들 수 없으니 학생 화면 주소를 그대로 안내한다. */
  const url = new URL('student.html', location.href).href;
  connect = { standalone: true, url, qr: await qrDataUrl(url) };
  if (state.picked && isLast()) paint();
}

let es = null;
async function listen() {
  /* 서버가 없는데 EventSource를 열면 몇 초마다 다시 붙으려 한다.
     화면에는 아무 영향이 없지만 콘솔이 오류로 뒤덮인다. */
  if (!(await hasServer())) return;
  es?.close();
  es = new EventSource(`/api/events?key=${encodeURIComponent(roomKey ?? '')}`);
  es.addEventListener('update', () => pull());
  /* 연결이 끊기면 서버가 다시 켜졌다는 뜻일 수 있다. 한 번 물어본다. */
  es.onerror = () => { setTimeout(pull, 1500); };
}

/* ═══════════════ 이벤트 ═══════════════ */

function chooseBand(id) {
  state.band = id;
  state.beat = 0;
  if (!state.picked) { state.picked = true; state.startedAt = Date.now(); }
  $('bandSheet').hidden = true;
  paintPick();
  paint();
  pushState();
}

document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-band]');
  if (card) return chooseBand(card.dataset.band);

  const dot = e.target.closest('[data-beat]');
  if (dot) { state.beat = Number(dot.dataset.beat); return paint(); }
    pushState();

  const go = e.target.closest('[data-go]');
  if (go) return goto(Number(go.dataset.go));

  const lv = e.target.closest('[data-live]');
  if (lv) {
    const cut = currentBeats()[state.beat];
    if (lv.dataset.live === 'open') {
      return openQuizCut(cut);
    }
    if (lv.dataset.live === 'reveal') return live('reveal');
    if (lv.dataset.live === 'next') return step(1);
  }
});

$('bandChip').onclick = () => { $('bandSheet').hidden = false; };
$('bandClose').onclick = () => { $('bandSheet').hidden = true; };
$('liveChip').onclick = () => goto(LAST);
$('prevBtn').onclick = () => step(-1);
$('nextBtn').onclick = () => step(1);

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  if (!state.picked) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); step(1); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
  if (e.key === 'ArrowDown') { e.preventDefault(); goto(state.index + 1); }
  if (e.key === 'ArrowUp') { e.preventDefault(); goto(state.index - 1); }
  if (e.key === 'Escape') $('bandSheet').hidden = true;
});

/* ═══════════════ 시작 ═══════════════ */

renderStage($('pick'), 'landing-hero', { motion: 'kenburns-in', layers: ['moonlight', 'fireflies'] });
paintPick();

/* 배경음악 — 학년 고르기 화면과 아래 막대에 단추 하나씩. 소리는 하나다.
   학년을 고르는 첫 클릭에 맞춰 시작한다(브라우저 자동재생 정책). */
mountBgm($('pick').querySelector('.pick__body'));
mountBgm(document.querySelector('.bar__side'), { before: document.querySelector('.bar__side .clock') });
/* 방을 먼저 열어야 코드·QR·명단이 내 반 것으로 나온다 */
ensureRoom().then(() => {
  listen();
  loadConnect();
  pull();
});
setInterval(() => { if (state.picked) paintSide(); }, 1000);
setTimeout(() => $('hintFs')?.remove(), 9000);
/* 학년을 고르기 전에는 첫 컷 한 장만 — 나머지는 넘기면서 받는다 */
{ const h = heroFor('opening'); if (h) { preloaded.add(h.id); preload([h.id]); } }
