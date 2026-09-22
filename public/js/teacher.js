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
import { quizFor } from './data/quiz.js';
import { assetsFor } from './shared/assets.js';
import { renderStage, preload } from './shared/stage.js';
import { hasServer, qrDataUrl } from './shared/offline.js';

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

  /* 퀴즈 컷을 벗어나면 라이브를 닫는다.
     안 닫으면 학생 기기가 정답 화면에 갇혀서 다음으로 못 넘어간다. */
  if (snap?.live?.on && cut?.kind !== 'quiz') live('close');

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
      wide();
      const w = snap?.wishes ?? [];
      host.innerHTML = `
        <p class="cut__lead">🌙 우리 반 소원 <span class="cut__count">${w.length}개</span></p>
        <div class="wallgrid">${w.length
          ? [...w].reverse().slice(0, 18).map((x) =>
              `<div class="wallcard">${x.forWhom === 'us' ? '🤝' : '🙋'} ${esc(x.text)}
                 <em>${esc(x.name)}</em></div>`).join('')
          : '<p class="cut__wait">학생들이 소원을 보내면 여기에 뜹니다</p>'}</div>`;
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

    case 'rank': {
      wide();
      const board = snap?.leaderboard ?? [];
      host.innerHTML = `
        <p class="cut__lead">🏆 잘했어요!</p>
        <div class="rank">${board.length
          ? board.map((r, i) =>
              `<div class="rank__row ${i < 3 ? 'top' : ''}">
                 <span class="rank__no">${i + 1}</span>
                 <span class="rank__name">${esc(r.name)}</span>
                 <span class="rank__score">${r.score.toLocaleString('ko-KR')}</span>
               </div>`).join('')
          : '<p class="cut__wait">퀴즈를 풀면 순위가 나옵니다</p>'}</div>
        <button class="btn btn--sm btn--ghost" id="rankReset">퀴즈 점수 초기화</button>`;
      host.querySelector('#rankReset').onclick = () => live('reset');
      break;
    }

    case 'connect':
      wide();
      host.innerHTML = `
        <p class="cut__lead">🙋 이제 각자 해봅시다</p>
        <div class="connectcut">
          <div class="connectcut__qr">${connect
            ? `<img src="${connect.qr}" alt="학생 접속 QR 코드">`
            : '<span>주소를 부르는 중…</span>'}</div>
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

async function live(action, extra = {}) {
  try {
    if (!(await hasServer())) return;
    const res = await fetch('/api/teacher/live', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) { snap = await res.json(); paint(); }
  } catch { /* 서버가 잠깐 끊겨도 화면은 유지 */ }
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
  $('steps').innerHTML = all.map((s, i) =>
    `<button class="step ${i < state.index ? 'done' : ''}" data-go="${i}"
             aria-current="${i === state.index}" title="${esc(s.label)}">
       <em>${s.icon}</em><small>${esc(s.label)}</small>
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

  const next = SECTIONS[state.index + 1];
  if (next) preload(assetsFor(next.id).map((a) => a.id));
}

function step(dir) {
  const count = currentBeats().length;
  const next = state.beat + dir;
  if (next >= 0 && next < count) { state.beat = next; paint(); return; }
  if (dir > 0 && state.index < LAST) return goto(state.index + 1);
  if (dir < 0 && state.index > 0) return goto(state.index - 1, 'last');
}

/* ═══════════════ 서버 ═══════════════ */

async function pushState() {
  if (!(await hasServer())) return;    // 정적 호스팅이면 보낼 곳이 없다
  try {
    await fetch('/api/teacher/state', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        band: state.band,
        sectionId: isLast() ? 'student' : section().id,
        activityOpen: isLast(),          // 마지막 단계에서 학생 활동이 열린다
        studentsFollow: true,
      }),
    });
  } catch { /* 무시 */ }
}

async function pull() {
  if (!(await hasServer())) return;
  try {
    const res = await fetch('/api/teacher/state');
    if (res.ok) { snap = await res.json(); if (state.picked) paint(); }
  } catch { /* 무시 */ }
}

async function loadConnect() {
  if (await hasServer()) {
    try {
      connect = await (await fetch('/api/connect')).json();
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

async function listen() {
  /* 서버가 없는데 EventSource를 열면 몇 초마다 다시 붙으려 한다.
     화면에는 아무 영향이 없지만 콘솔이 오류로 뒤덮인다. */
  if (!(await hasServer())) return;
  const es = new EventSource('/api/events');
  es.addEventListener('update', () => pull());
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

  const go = e.target.closest('[data-go]');
  if (go) return goto(Number(go.dataset.go));

  const lv = e.target.closest('[data-live]');
  if (lv) {
    const cut = currentBeats()[state.beat];
    if (lv.dataset.live === 'open') {
      const opts = cut.q.type === 'ox' ? 2 : cut.q.options.length;
      return live('open', { index: cut.qIndex, questionId: cut.q.id, choiceCount: opts, limitMs: 20000 });
    }
    if (lv.dataset.live === 'reveal') return live('reveal');
    if (lv.dataset.live === 'next') { live('close'); return step(1); }
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
listen();
loadConnect();
pull();
setInterval(() => { if (state.picked) paintSide(); }, 1000);
setTimeout(() => $('hintFs')?.remove(), 9000);
preload(assetsFor('opening').map((a) => a.id));
