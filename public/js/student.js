/**
 * 학생용 개별 학습 화면.
 * 교사 화면이 정한 장면·학년·활동 열림 상태를 따라간다.
 * 서버가 잠깐 끊겨도 마지막 화면은 그대로 남는다.
 */

import { SECTIONS, SECTION_BY_ID, BANDS, BAND_ORDER, resolveSection } from './data/lesson.js';
import { assetsFor, heroFor } from './shared/assets.js';
import { renderStage } from './shared/stage.js';
import { ACTIVITIES } from './activities.js';
import { quizFor, titleFor } from './data/quiz.js';
import { hasServer } from './shared/offline.js';
import { artUrl } from './shared/asset-url.js';

/** 퀴즈 보기 색·기호 — 교사 화면과 반드시 같아야 한다 */
const CHOICE = [
  { color: '#e4703a', mark: '▲' },
  { color: '#3f7fd4', mark: '●' },
  { color: '#d9a53f', mark: '■' },
  { color: '#4a9b78', mark: '◆' },
];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SAVE_KEY = 'chuseok.student';

/* 연결은 하나만 — 입장을 거듭해도 늘어나지 않게 여기서 들고 있는다 */
let es = null;
let pollTimer = null;
let joining = false;

const me = {
  id: null,
  name: null,
};

let last = null;         // 마지막으로 받은 상태
let renderedKey = null;  // 같은 화면을 반복해서 다시 그리지 않으려고

/* 혼자 학습 — 서버 없이 도는 모드.
   결석한 학생 보충이나 가정 학습에 쓴다. 응답은 어디로도 보내지 않는다. */
const solo = {
  on: false,
  index: 0,
  band: 'mid',
  activityOpen: false,
};

/* ═══════════════ 서버 호출 ═══════════════ */

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ studentId: me.id, ...body }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? '보내지 못했어요.');
  return res.json();
}

const api = {
  wish:   (text, forWhom) => post('/api/student/wish', { text, forWhom }),
  opinion: (text) => post('/api/student/opinion', { text }),
  quiz:   (questionId, choice, correct) => post('/api/student/quiz', { questionId, choice, correct }),
  reflection: (learned, thought) => post('/api/student/reflection', { learned, thought }),
  score:  (activity, score, detail) => post('/api/student/score', { activity, score, detail }),
};

/* ═══════════════ 입장 ═══════════════ */

function setupEnter() {
  renderStage($('enter'), 'student-welcome', { motion: 'float', layers: ['moonlight'], scrim: 'soft' });

  /* QR로 들어오면 코드가 주소에 들어 있다 */
  const fromUrl = new URLSearchParams(location.search).get('code');
  if (fromUrl) $('codeInput').value = fromUrl.replace(/\D/g, '').slice(0, 6);

  /* 새로고침해도 다시 이름을 묻지 않게 */
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (saved?.name) $('nameInput').value = saved.name;
  } catch { /* 저장소가 막힌 환경도 있다 */ }

  $('codeInput').oninput = (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  };

  /* 교실 서버 없이 열린 경우(정적 호스팅). 넣을 코드가 아예 없으므로
     입장 칸을 감추고 혼자 학습을 앞으로 내놓는다. */
  hasServer().then((up) => {
    if (up) return;
    $('joinForm').hidden = true;
    const lead = document.querySelector('.enter__sub');
    if (lead) lead.innerHTML = '보름달 아래에서 한 시간,<br>추석을 알아봅시다.';
    const door = document.querySelector('.solo-door');
    if (door) {
      door.classList.add('solo-door--only');
      door.querySelector('span').textContent = '선생님이 수업을 열지 않았어요. 혼자서도 다 해볼 수 있어요.';
      door.querySelector('#soloBtn').textContent = '혼자 해보기 →';
    }
  });

  $('joinForm').onsubmit = async (e) => {
    e.preventDefault();
    /* 이미 들어와 있으면 또 들어가지 않는다.
       두 번 들어가면 아이디가 바뀌고 연결이 하나 더 생긴다. 몇 번 쌓이면
       브라우저 연결 한도(6개)가 차서 그 뒤 모든 요청이 영원히 기다린다. */
    if (!$('main').hidden || joining) return;
    joining = true;
    const btn = $('joinBtn');
    btn.disabled = true;
    btn.textContent = '들어가는 중…';
    $('err').hidden = true;

    try {
      const res = await fetch('/api/student/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: $('codeInput').value, name: $('nameInput').value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '들어가지 못했어요.');

      me.id = data.student.id;
      me.name = data.student.name;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ name: me.name })); } catch { /* 무시 */ }

      $('enter').hidden = true;
      $('main').hidden = false;
      $('meName').textContent = me.name;

      apply(data.view);
      listen();
      pollTimer ??= setInterval(poll, 6000);     // 한 번만 건다
    } catch (err) {
      $('err').textContent = err.message;
      $('err').hidden = false;
    } finally {
      joining = false;
      btn.disabled = false;
      btn.textContent = '들어가기';
    }
  };
}

/* ═══════════════ 상태 받기 ═══════════════ */

async function poll() {
  try {
    const res = await fetch(`/api/student/state?studentId=${encodeURIComponent(me.id)}`);
    if (res.status === 410) return rejoin();
    if (res.ok) apply(await res.json());
    setConn(true);
  } catch {
    setConn(false);
  }
}

function listen() {
  /* 내가 들어간 방의 소식만 받는다. 전 연결은 반드시 닫는다 — 안 닫으면 쌓인다. */
  es?.close();
  es = new EventSource(`/api/events?studentId=${encodeURIComponent(me.id)}`);
  es.addEventListener('update', () => poll());
  es.onopen = () => setConn(true);
  es.onerror = () => setConn(false);
}

function setConn(ok) {
  $('conn').classList.toggle('off', !ok);
  $('conn').title = ok ? '연결됨' : '연결이 끊겼어요';
}

function rejoin() {
  /* 방이 사라졌으면 붙잡고 있던 연결과 확인을 놓는다.
     안 놓으면 옛 아이디로 3초마다 다시 붙으려 하고 6초마다 물어본다 — 서버가
     다시 켜질 때마다 서른 대가 헛요청을 끝없이 보내 그 서버를 또 느리게 한다. */
  es?.close(); es = null;
  clearInterval(pollTimer); pollTimer = null;
  $('main').hidden = true;
  $('enter').hidden = false;
  $('err').textContent = '수업방이 다시 열렸어요. 새 코드를 넣어 주세요.';
  $('err').hidden = false;
}

/* ═══════════════ 화면 그리기 ═══════════════ */

function apply(view) {
  last = view;

  /* 라이브 퀴즈가 열려 있으면 무조건 그 화면이 먼저다 */
  if (view.live?.on) {
    const key = `live|${view.live.phase}|${view.live.questionId}|${view.live.revealed}|${view.live.answered}`;
    if (key !== renderedKey) { renderedKey = key; renderLive(view); }
    return;
  }

  $('nowLabel').textContent = SECTION_BY_ID[view.sectionId]?.title ?? '수업 중';

  /* 수업이 끝나고 활동 시간이 되면 활동 고르는 화면 */
  if (view.sectionId === 'student' || (view.activityOpen && !SECTION_BY_ID[view.sectionId])) {
    /* 활동을 하고 있는 중이면 건드리지 않는다 */
    if (renderedKey !== 'menu' && !String(renderedKey).startsWith('act:')) renderMenu(view);
    return;
  }

  /* 소원 벽만 바뀐 경우엔 그 부분만 갱신한다 */
  const key = `${view.sectionId}|${view.band}|${view.activityOpen}`;
  if (key === renderedKey) {
    if (view.activityOpen && SECTION_BY_ID[view.sectionId]?.activity === 'moon-wish') updateWall(view);
    return;
  }
  renderedKey = key;

  const section = SECTION_BY_ID[view.sectionId];
  if (!section) return;

  if (view.activityOpen && section.activity && ACTIVITIES[section.activity]) {
    renderActivity(section, view);
  } else {
    renderReading(section, view);
  }
}

/* ═══════════════ 라이브 퀴즈 ═══════════════ */

function renderLive(view) {
  const L = view.live;

  /* ── 대기실 — 다 모일 때까지 ── */
  if (L.phase === 'lobby') {
    $('nowLabel').textContent = '퀴즈 준비';
    $('content').innerHTML = `
      <div class="live live--lobby">
        <div class="live__big">🙋</div>
        <h2>${esc(me.name)}</h2>
        <p>선생님 화면에 내 이름이 보이면 준비 끝이에요.</p>
        <p class="live__hint">모두 모이면 문제 ${L.total ?? 10}개를 함께 풉니다.</p>
      </div>`;
    return;
  }

  /* ── 시상식 — 마지막 문제까지 끝난 뒤 ── */
  if (L.phase === 'final') {
    $('nowLabel').textContent = '퀴즈 끝';
    const place = L.rank?.place ?? null;
    const t = titleFor(place);
    $('content').innerHTML = `
      <div class="live live--final">
        <div class="live__big">${t ? t.icon : '🌙'}</div>
        ${t
          ? `<h2>${t.title}</h2><p class="live__crown">${esc(me.name)} · ${t.why}</p>`
          : `<h2>수고했어요</h2><p>${esc(me.name)} 친구, 끝까지 잘 풀었어요.</p>`}
        <div class="live__score">
          <span>내 점수</span>
          <b>${(L.myScore ?? 0).toLocaleString('ko-KR')}</b>
          ${L.rank ? `<span>${L.rank.place}등 / ${L.rank.of}명</span>` : ''}
        </div>
        ${L.podium?.length ? `
          <div class="live__podium">
            ${L.podium.map((r, i) => {
              const pt = titleFor(i + 1);
              return `<div><span>${pt.icon}</span><b>${esc(r.name)}</b><i>${pt.title}</i></div>`;
            }).join('')}
          </div>` : ''}
      </div>`;
    return;
  }

  const q = quizFor(view.band).find((x) => x.id === L.questionId);
  if (!q) return;

  const opts = q.type === 'ox' ? ['⭕ 맞아요', '❌ 아니에요'] : q.options;
  const answerIdx = q.type === 'ox' ? (q.answer ? 0 : 1) : q.answer;

  $('nowLabel').textContent = L.total ? `퀴즈 ${(L.index ?? 0) + 1} / ${L.total}` : '퀴즈';

  /* 정답 공개 뒤 */
  if (L.revealed) {
    const ok = L.myCorrect;
    $('content').innerHTML = `
      <div class="live live--${ok ? 'ok' : L.answered ? 'no' : 'skip'}">
        <div class="live__big">${ok ? '🎉' : L.answered ? '😅' : '⏰'}</div>
        <h2>${ok ? '정답이에요!' : L.answered ? '아쉬워요' : '시간이 지났어요'}</h2>
        <p class="live__answer">정답 — ${esc(opts[answerIdx])}</p>
        <p class="live__why">${esc(q.why)}</p>
        <div class="live__score">
          <span>내 점수</span>
          <b>${(L.myScore ?? 0).toLocaleString('ko-KR')}</b>
          ${L.rank ? `<span>${L.rank.place}등 / ${L.rank.of}명</span>` : ''}
        </div>
      </div>`;
    return;
  }

  /* 이미 답을 보냈으면 기다리는 화면 */
  if (L.answered) {
    $('content').innerHTML = `
      <div class="live live--wait">
        <div class="live__pick" style="--c:${CHOICE[L.myChoice]?.color ?? '#888'}">
          ${CHOICE[L.myChoice]?.mark ?? ''}
        </div>
        <h2>답을 보냈어요</h2>
        <p>친구들을 기다리는 중…</p>
      </div>`;
    return;
  }

  /* 고르는 화면 — 글은 최소로, 버튼은 크게 */
  $('content').innerHTML = `
    <div class="live live--pick">
      <p class="live__q">${esc(q.q)}</p>
      <div class="live__timer"><i id="liveBar"></i></div>
      <div class="live__opts">
        ${opts.map((o, i) => `
          <button class="live__opt" data-choice="${i}" style="--c:${CHOICE[i].color}">
            <span class="live__mark">${CHOICE[i].mark}</span>
            <span>${esc(o)}</span>
          </button>`).join('')}
      </div>
    </div>`;

  /* 남은 시간 막대 */
  const bar = $('liveBar');
  const tick = () => {
    if (!bar.isConnected) return;
    const leftMs = Math.max(0, L.remainMs - (Date.now() - tickStart));
    bar.style.width = `${(leftMs / L.limitMs) * 100}%`;
    if (leftMs > 0) requestAnimationFrame(tick);
  };
  const tickStart = Date.now();
  tick();

  $('content').querySelector('.live__opts').onclick = async (e) => {
    const btn = e.target.closest('[data-choice]');
    if (!btn) return;
    const pick = Number(btn.dataset.choice);

    for (const b of $('content').querySelectorAll('.live__opt')) {
      b.disabled = true;
      if (b !== btn) b.style.opacity = '.3';
    }
    btn.classList.add('live__opt--sent');

    try {
      await api.quiz(q.id, pick, pick === answerIdx);
      poll();
    } catch (err) {
      btn.classList.remove('live__opt--sent');
      for (const b of $('content').querySelectorAll('.live__opt')) { b.disabled = false; b.style.opacity = ''; }
    }
  };
}

/* ═══════════════ 활동 고르기 ═══════════════ */

const MENU = [
  { id: 'songpyeon', icon: '🥟', label: '송편 빚기' },
  { id: 'charye', icon: '🕯️', label: '차례상 차리기' },
  { id: 'ganggangsullae', icon: '💃', label: '강강술래 장단' },
  { id: 'word-cards', icon: '🃏', label: '어휘 카드' },
  { id: 'moon-wish', icon: '🌙', label: '소원 적기' },
  { id: 'discuss', icon: '💭', label: '오늘의 추석' },
  { id: 'reflect', icon: '✍️', label: '배움 정리' },
  { id: 'postcard', icon: '💌', label: '추석 엽서 쓰기' },
];

function renderMenu(view) {
  /* 여기서 직접 표시해야 한다. 예전에는 apply()만 설정해서,
     뒤로가기로 메뉴에 온 뒤 다음 서버 갱신이 열어둔 활동을 덮어썼다. */
  renderedKey = 'menu';
  $('nowLabel').textContent = '활동 고르기';
  $('content').innerHTML = `
    <div class="menu">
      <div class="menu__head">
        <h2>무엇을 해볼까요?</h2>
        <p>마치면 <b>그림으로 저장</b>을 눌러 패들릿에 올려요.</p>
      </div>
      <div class="menu__grid">
        ${MENU.map((m) => `
          <button class="menucard" data-act="${m.id}">
            <span class="menucard__icon">${m.icon}</span>
            <b>${m.label}</b>
          </button>`).join('')}
      </div>
    </div>`;

  $('content').querySelector('.menu__grid').onclick = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    openActivity(b.dataset.act, view);
  };
}

function openActivity(id, view) {
  renderedKey = `act:${id}`;      // 서버 갱신이 이 화면을 덮어쓰지 않게
  const fake = SECTIONS.find((s) => s.activity === id) ?? SECTIONS[0];
  $('content').innerHTML = `
    <button class="backbtn" id="backBtn">◀ 다른 활동 고르기</button>
    <div id="actHost"></div>`;
  $('backBtn').onclick = () => { renderedKey = null; renderMenu(last ?? view); };
  ACTIVITIES[id]($('actHost'), { band: view.band, api, section: fake, esc, name: me.name });
  if (id === 'moon-wish') updateWall(last ?? view);
}

function renderReading(section, view) {
  const s = resolveSection(section, view.band);
  const hero = heroFor(section.id);
  const extras = assetsFor(section.id).filter((a) => a.id !== hero?.id).slice(0, 3);

  $('content').innerHTML = `
    <section class="hero stage" id="hero">
      <div class="stage__body hero__body">
        <div class="hero__tag">
          <span class="pill">${s.subtitle}</span>
          ${s.body.keyword ? `<span class="pill pill--gold">${esc(s.body.keyword)}</span>` : ''}
        </div>
        <h1 class="hero__title">${s.icon} ${esc(s.title)}</h1>
        <p class="hero__headline">${esc(s.body.headline)}</p>
      </div>
    </section>

    <div class="read">
      ${s.body.lines.map((l) => `<p>${esc(l)}</p>`).join('')}

      ${(s.body.facts ?? s.body.items ?? []).length ? `
        <div class="read__facts">
          ${(s.body.facts ?? s.body.items).map((f) => `
            <div class="read__fact">
              <b>${esc(f.term ?? `${f.emoji ?? ''} ${f.name}`)}</b>
              <span>${esc(f.gloss)}</span>
            </div>`).join('')}
        </div>` : ''}

      ${extras.length ? `
        <div class="gallery">
          ${extras.map((a) => `
            <figure>
              <img src="${artUrl(`assets/img/${a.id}.jpg`)}" alt="${esc(a.scene)}" loading="lazy">
              <figcaption>${esc(a.scene)}</figcaption>
            </figure>`).join('')}
        </div>` : ''}

      ${section.activity ? `
        <div class="wait" style="padding:32px 0 0">
          <p style="font-size:14px">
            이 장면에는 <b style="color:var(--moon-glow)">활동</b>이 있어요.<br>
            선생님이 열어 주면 바로 시작됩니다.
          </p>
        </div>` : ''}
    </div>`;

  if (hero) renderStage($('hero'), hero.id, { motion: hero.motion, layers: hero.layers, scrim: 'soft' });
}

function renderActivity(section, view) {
  $('content').innerHTML = '<div id="actHost"></div>';
  const host = $('actHost');
  ACTIVITIES[section.activity](host, { band: view.band, api, section, esc, name: me.name });

  if (section.activity === 'moon-wish') updateWall(view);
}

function updateWall(view) {
  const wall = document.getElementById('wall');
  if (!wall) return;
  wall.innerHTML = view.wishTexts?.length
    ? [...view.wishTexts].reverse().map((w) =>
        `<div class="wall__item">${w.forWhom === 'us' ? '🤝' : '🙋'} ${esc(w.text)}</div>`).join('')
    : '<div style="color:var(--moon-dim);font-size:13.5px">아직 소원이 없어요.</div>';
}

/* ═══════════════ 혼자 학습 ═══════════════ */

/** 서버 대신 쓰는 껍데기 — 보낼 곳이 없으니 아무것도 하지 않는다 */
const soloApi = Object.fromEntries(
  Object.keys(api).map((k) => [k, async () => ({ ok: true, solo: true })]),
);

function startSolo() {
  solo.on = true;
  me.name = ($('nameInput').value || '').trim().slice(0, 12) || '나';

  $('enter').hidden = true;
  $('main').hidden = false;
  $('meName').textContent = me.name;
  $('conn').style.display = 'none';
  $('soloNav').hidden = false;
  $('soloFoot').hidden = false;

  $('soloNav').innerHTML = BAND_ORDER
    .map((b) => `<button data-band="${b}" aria-pressed="${b === solo.band}">${BANDS[b].emoji} ${BANDS[b].label}</button>`)
    .join('');

  $('soloNav').onclick = (e) => {
    const b = e.target.closest('[data-band]');
    if (!b) return;
    solo.band = b.dataset.band;
    for (const x of $('soloNav').children) x.setAttribute('aria-pressed', String(x === b));
    soloPaint();
  };

  $('soloPrev').onclick = () => soloGo(-1);
  $('soloNext').onclick = () => soloGo(1);

  soloPaint();
}

/**
 * 활동이 있는 장면은 읽기 → 활동 → 다음 장면 순으로 넘어간다.
 * 혼자 하는 것이니 활동을 건너뛸 수도 있어야 한다.
 */
function soloGo(dir) {
  const section = SECTIONS[solo.index];
  const hasAct = !!(section.activity && ACTIVITIES[section.activity]);

  if (dir > 0 && hasAct && !solo.activityOpen) {
    solo.activityOpen = true;
  } else {
    solo.activityOpen = false;
    solo.index = Math.max(0, Math.min(SECTIONS.length - 1, solo.index + dir));
  }
  renderedKey = null;
  soloPaint();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function soloPaint() {
  const section = SECTIONS[solo.index];
  const hasAct = !!(section.activity && ACTIVITIES[section.activity]);

  $('nowLabel').textContent = section.title;
  $('soloPos').textContent = `${solo.index + 1} / ${SECTIONS.length}`;
  $('soloPrev').disabled = solo.index === 0 && !solo.activityOpen;
  $('soloNext').disabled = solo.index === SECTIONS.length - 1 && (!hasAct || solo.activityOpen);
  $('soloNext').textContent = hasAct && !solo.activityOpen ? '활동 하기 ▶' : '다음 ▶';

  const fake = { band: solo.band, sectionId: section.id, activityOpen: solo.activityOpen, wishTexts: [] };

  if (solo.activityOpen && hasAct) {
    $('content').innerHTML = '<div id="actHost"></div>';
    ACTIVITIES[section.activity]($('actHost'), {
      band: solo.band, api: soloApi, section, esc, name: me.name,
    });
  } else {
    renderReading(section, fake);
  }
}

/* ═══════════════ 시작 ═══════════════ */

setupEnter();
$('soloBtn').onclick = startSolo;
