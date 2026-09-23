/**
 * 학생 활동들.
 * 각 활동은 render(host, ctx)를 내보낸다.
 *   ctx = { band, api, section, esc, name }
 * 활동은 "맞히기"가 아니라 "해보고 까닭을 알기"가 목적이라,
 * 틀려도 막지 않고 왜 그런지를 보여준 뒤 넘어간다.
 */

import { POSTCARD, WORD_CARDS, SONGPYEON, GANGGANG, DISCUSS, WISH } from './data/activities.js';
import { ROWS, ALL_SLOTS, LESSON as CHARYE_LESSON } from './data/charye-table.js';
import { REFLECTION } from './data/quiz.js';
import { attachSaveButton } from './shared/card.js';

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

/* ═══════════════ 어휘 카드 짝맞추기 ═══════════════ */

/**
 * 뒤집어서 기억하는 짝맞추기.
 * 처음에는 카드가 다 보여서 그냥 이어주기였는데, 그러면 외울 일이 없다.
 * 엎어 두고 두 장씩 뒤집어야 낱말과 뜻이 머리에 남는다.
 */
function wordCards(host, ctx) {
  const pairs = (WORD_CARDS[ctx.band] ?? WORD_CARDS.mid).slice(0, ctx.band === 'low' ? 4 : 6);
  const deck = shuffle([
    ...pairs.map((p, i) => ({ kind: 'term', text: p.term, pair: i })),
    ...pairs.map((p, i) => ({ kind: 'gloss', text: p.gloss, pair: i })),
  ]);

  let open = [];        // 지금 뒤집힌 카드
  let matched = 0;
  let tries = 0;
  let locked = false;   // 두 장이 안 맞아 되집히는 동안 잠근다
  let startedAt = null;

  host.innerHTML = `
    <div class="act">
      <div class="act__head">
        <h2>🃏 어휘 카드 짝맞추기</h2>
        <p>카드를 두 장씩 뒤집어요.<br>낱말과 뜻이 맞으면 그대로 남습니다.</p>
      </div>

      <div class="mem__bar">
        <span>맞춘 짝 <b id="memDone">0</b> / ${pairs.length}</span>
        <span>뒤집은 횟수 <b id="memTry">0</b></span>
      </div>

      <div class="mem" id="memGrid"></div>
      <div id="memResult"></div>
    </div>`;

  const grid = host.querySelector('#memGrid');
  grid.style.setProperty('--cols', pairs.length <= 4 ? 4 : 4);

  grid.innerHTML = deck.map((c, i) => `
    <button class="mem__card" data-i="${i}" data-pair="${c.pair}" aria-label="카드 ${i + 1}">
      <span class="mem__inner">
        <span class="mem__back"><i>🌕</i></span>
        <span class="mem__face mem__face--${c.kind}">${ctx.esc(c.text)}</span>
      </span>
    </button>`).join('');

  const cards = [...grid.children];

  grid.onclick = (e) => {
    const btn = e.target.closest('.mem__card');
    if (!btn || locked) return;
    if (btn.classList.contains('open') || btn.classList.contains('done')) return;

    startedAt ??= Date.now();
    btn.classList.add('open');
    open.push(btn);
    if (open.length < 2) return;

    tries += 1;
    host.querySelector('#memTry').textContent = tries;

    const [a, b] = open;
    if (a.dataset.pair === b.dataset.pair) {
      /* 맞았다 — 그대로 둔다 */
      open = [];
      setTimeout(() => {
        a.classList.add('done');
        b.classList.add('done');
        matched += 1;
        host.querySelector('#memDone').textContent = matched;
        if (matched === pairs.length) finish();
      }, 260);
      return;
    }

    /* 틀렸다 — 잠깐 보여주고 되집는다 */
    locked = true;
    a.classList.add('wrong');
    b.classList.add('wrong');
    setTimeout(() => {
      for (const c of open) c.classList.remove('open', 'wrong');
      open = [];
      locked = false;
    }, 850);
  };

  function finish() {
    const sec = Math.round((Date.now() - startedAt) / 1000);
    const best = pairs.length;                    // 한 번도 안 틀렸을 때
    const score = Math.max(10, Math.round((best / tries) * 100));

    host.querySelector('#memResult').innerHTML = `
      <div class="act__done">
        <div class="big">🎉</div>
        <h3>모두 맞췄어요!</h3>
        <p style="color:var(--moon-dim);font-size:14.5px;margin-top:8px">
          ${pairs.length}쌍을 ${tries}번 만에 · ${sec}초
        </p>
      </div>

      <div class="ct__why">
        ${pairs.map((p) => `
          <div class="ct__whyrow">
            <div><b>${ctx.esc(p.term)}</b><span>${ctx.esc(p.gloss)}</span></div>
          </div>`).join('')}
      </div>

      <button class="btn btn--sm btn--ghost" id="memAgain" style="margin-top:12px">다시 해보기</button>`;

    host.querySelector('#memAgain').onclick = () => wordCards(host, ctx);
    ctx.api.score('word-cards', score, { tries, sec });

    attachSaveButton(host.querySelector('#memResult'), () => ({
      kind: '어휘카드', name: ctx.name,
      heading: '어휘 카드를 모두 맞췄어요',
      subheading: `${pairs.length}쌍을 ${tries}번 만에 · ${sec}초`,
      emoji: '🃏',
      lines: pairs.map((p) => `▸ ${p.term} — ${p.gloss}`),
    }));
  }
}

/* ═══════════════ 송편 빚기 ═══════════════ */

/**
 * 고르기만 하던 것을 직접 만드는 과정으로 바꿨다.
 *   ① 반죽 색 고르기  ② 손으로 치대기  ③ 소 끌어다 넣기
 *   ④ 쓸어서 반달로 빚기  ⑤ 솔잎 깔고 찌기
 * 각 단계가 끝날 때마다 왜 그렇게 하는지 한 줄씩 알려준다.
 */
function songpyeon(host, ctx) {
  const KNEADS = 12;       // 이만큼 치대야 반죽이 매끈해진다
  const FOLD = 150;        // 이만큼 쓸어야 반달이 된다

  const chosen = {};
  let stage = 0;           // 0 색 · 1 치대기 · 2 소 · 3 빚기 · 4 찌기 · 5 완성
  let kneads = 0;
  let folded = 0;

  const DOUGH = SONGPYEON.steps.find((s) => s.id === 'dough').options;
  const FILL = SONGPYEON.steps.find((s) => s.id === 'filling').options;

  host.innerHTML = `
    <div class="act">
      <div class="act__head">
        <h2>🥟 송편 빚기</h2>
        <p id="spHint">먼저 반죽을 골라요</p>
      </div>
      <div class="progress" id="spBar"></div>

      <div class="sp__stage" id="spStage">
        <img class="sp__img" id="spImg" src="assets/items/songpyeon-white.png" alt="반죽">
        <span class="sp__fill" id="spFill"></span>
        <div class="sp__steam" id="spSteam"></div>
        <div class="sp__hintring" id="spRing"></div>
      </div>

      <div id="spPanel"></div>
      <div id="spWhy"></div>
    </div>`;

  const img = host.querySelector('#spImg');
  const fillEl = host.querySelector('#spFill');
  const stageEl = host.querySelector('#spStage');
  const panel = host.querySelector('#spPanel');
  const hint = host.querySelector('#spHint');
  const why = host.querySelector('#spWhy');
  const ring = host.querySelector('#spRing');

  /* ── 소리 ── */
  let ac = null;
  function blip(hz, dur = 0.09, gain = 0.1) {
    try {
      ac ??= new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(hz, t);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch { /* 소리가 막힌 기기 */ }
  }

  function bar() {
    host.querySelector('#spBar').innerHTML =
      Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < stage ? 'ok' : i === stage ? 'on' : ''}"></i>`).join('');
  }

  function say(text, ok = true) {
    why.innerHTML = `<div class="why ${ok ? '' : 'no'}">${ctx.esc(text)}</div>`;
  }

  function picture() {
    const shape = chosen.shape;
    if (shape === 'full') return 'songpyeon-full';
    if (shape === 'star') return 'songpyeon-star';
    return `songpyeon-${chosen.dough?.id ?? 'white'}`;
  }

  /* ─────────── ① 반죽 색 ─────────── */
  function pickDough() {
    stage = 0; bar();
    hint.textContent = '반죽을 골라요. 무엇을 넣느냐에 따라 색이 달라져요.';
    stageEl.className = 'sp__stage';
    panel.innerHTML = `
      <div class="sp__opts">
        ${DOUGH.map((o) => `
          <button class="sp__opt sp__opt--pic" data-id="${o.id}">
            <img src="assets/items/songpyeon-${o.id}.png" alt="">
            <b>${ctx.esc(o.label)}</b>
          </button>`).join('')}
      </div>`;

    panel.onclick = (e) => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      chosen.dough = DOUGH.find((o) => o.id === btn.dataset.id);
      img.src = `assets/items/songpyeon-${chosen.dough.id}.png`;
      blip(520);
      say(chosen.dough.note);
      setTimeout(knead, 900);
    };
  }

  /* ─────────── ② 치대기 ─────────── */
  function knead() {
    stage = 1; bar();
    kneads = 0;
    hint.textContent = '반죽을 꾹꾹 눌러 치대요. 매끈해질 때까지!';
    why.innerHTML = '';
    stageEl.className = 'sp__stage sp__stage--knead';
    panel.innerHTML = `
      <button class="sp__big" id="spKnead">🤲 눌러서 치대기</button>
      <p class="sp__count"><b id="spKneadN">0</b> / ${KNEADS}번</p>`;

    const btn = host.querySelector('#spKnead');
    const n = host.querySelector('#spKneadN');

    const press = () => {
      kneads += 1;
      n.textContent = kneads;
      blip(140 + kneads * 12, 0.07, 0.14);

      /* 치댈수록 매끈하고 밝아진다 */
      const p = kneads / KNEADS;
      img.style.filter = `drop-shadow(0 8px 18px rgba(0,0,0,.45)) brightness(${1 + p * 0.18}) saturate(${1 - p * 0.15})`;
      stageEl.classList.add('press');
      setTimeout(() => stageEl.classList.remove('press'), 90);

      if (kneads >= KNEADS) {
        btn.disabled = true;
        say('잘 치댄 반죽은 쫄깃해요. 옛날에는 온 가족이 둘러앉아 함께 치댔습니다.');
        setTimeout(pickFill, 1100);
      }
    };
    btn.onclick = press;
  }

  /* ─────────── ③ 소 넣기 (끌어다 놓기) ─────────── */
  function pickFill() {
    stage = 2; bar();
    hint.textContent = '소를 끌어서 반죽 위에 올려요.';
    why.innerHTML = '';
    stageEl.className = 'sp__stage sp__stage--open';
    panel.innerHTML = `
      <div class="sp__tray">
        ${FILL.map((o) => `
          <button class="sp__pill" data-id="${o.id}">
            <em>${o.emoji}</em><b>${ctx.esc(o.label)}</b>
          </button>`).join('')}
      </div>`;

    let drag = null, ghost = null;

    const onDown = (e) => {
      const b = e.target.closest('.sp__pill');
      if (!b) return;
      e.preventDefault();
      drag = FILL.find((o) => o.id === b.dataset.id);
      ghost = document.createElement('span');
      ghost.className = 'sp__ghost';
      ghost.textContent = drag.emoji;
      document.body.appendChild(ghost);
      move(e);
    };
    const move = (e) => {
      if (!ghost) return;
      ghost.style.left = `${e.clientX}px`;
      ghost.style.top = `${e.clientY}px`;
      const r = stageEl.getBoundingClientRect();
      const over = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      stageEl.classList.toggle('over', over);
    };
    const onUp = (e) => {
      if (!drag) return;
      const r = stageEl.getBoundingClientRect();
      const over = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      ghost?.remove(); ghost = null;
      stageEl.classList.remove('over');

      if (over) {
        chosen.filling = drag;
        fillEl.textContent = drag.emoji;
        fillEl.classList.add('drop');
        blip(660, 0.12, 0.13);
        say(drag.note);
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerup', onUp);
        setTimeout(shape, 1200);
      }
      drag = null;
    };

    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', onUp);
  }

  /* ─────────── ④ 쓸어서 빚기 ─────────── */
  function shape() {
    stage = 3; bar();
    folded = 0;
    hint.textContent = '반죽을 손가락으로 쓸어서 오므려요.';
    why.innerHTML = '';
    stageEl.className = 'sp__stage sp__stage--fold';
    ring.style.display = 'block';
    panel.innerHTML = `
      <p class="sp__count">떡 위를 <b>좌우로 쓸어요</b></p>
      <div class="sp__meter"><i id="spFold"></i></div>
      <button class="btn btn--sm btn--ghost" id="spOther">다른 모양으로 빚어볼래요</button>`;

    const meter = host.querySelector('#spFold');
    let lastX = null;

    const onMove = (e) => {
      const r = stageEl.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        lastX = null; return;
      }
      if (lastX !== null) {
        folded += Math.abs(e.clientX - lastX);
        meter.style.width = `${Math.min(100, (folded / FOLD) * 100)}%`;
        img.style.transform = `scaleY(${1 - Math.min(0.14, folded / FOLD * 0.14)})`;
        if (folded % 40 < 8) blip(300 + Math.random() * 80, 0.05, 0.07);
      }
      lastX = e.clientX;

      if (folded >= FOLD) {
        stageEl.removeEventListener('pointermove', onMove);
        chosen.shape = 'half';
        img.style.transform = '';
        blip(780, 0.16, 0.15);
        say('반달 모양이 되었어요. 보름달은 이미 다 찬 달이지만, 반달은 앞으로 더 커질 달이에요.');
        ring.style.display = 'none';
        setTimeout(steam, 1500);
      }
    };
    stageEl.addEventListener('pointermove', onMove);

    host.querySelector('#spOther').onclick = () => {
      stageEl.removeEventListener('pointermove', onMove);
      ring.style.display = 'none';
      panel.innerHTML = `
        <div class="sp__opts">
          <button class="sp__opt sp__opt--pic" data-s="full">
            <img src="assets/items/songpyeon-full.png" alt=""><b>보름달</b></button>
          <button class="sp__opt sp__opt--pic" data-s="star">
            <img src="assets/items/songpyeon-star.png" alt=""><b>별</b></button>
        </div>`;
      panel.onclick = (e) => {
        const b = e.target.closest('[data-s]');
        if (!b) return;
        chosen.shape = b.dataset.s;
        img.src = `assets/items/${picture()}.png`;
        blip(430);
        say(b.dataset.s === 'full'
          ? '보름달은 이미 다 찬 달이라, 전통 송편은 반달로 빚어요.'
          : '재미있지만 전통 모양은 반달이에요.', false);
        setTimeout(steam, 1500);
      };
    };
  }

  /* ─────────── ⑤ 찌기 ─────────── */
  function steam() {
    stage = 4; bar();
    hint.textContent = '찜기에 무엇을 깔까요?';
    why.innerHTML = '';
    stageEl.className = 'sp__stage';
    img.src = `assets/items/${picture()}.png`;

    const opts = SONGPYEON.steps.find((s) => s.id === 'steam').options;
    panel.innerHTML = `
      <div class="sp__opts">
        ${opts.map((o) => `
          <button class="sp__opt" data-id="${o.id}"><em>${o.emoji}</em><b>${ctx.esc(o.label)}</b></button>`).join('')}
      </div>`;

    panel.onclick = (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      chosen.steam = opts.find((o) => o.id === b.dataset.id);
      say(chosen.steam.note, !!chosen.steam.correct);
      panel.innerHTML = '';
      hint.textContent = '쪄지는 중…';

      /* 김이 오른다 */
      stageEl.classList.add('sp__stage--steaming');
      host.querySelector('#spSteam').innerHTML =
        Array.from({ length: 7 }, (_, i) =>
          `<span style="--x:${-30 + i * 10}px;--d:${i * 0.28}s"></span>`).join('');
      blip(220, 0.4, 0.09);

      setTimeout(done, 2400);
    };
  }

  /* ─────────── 완성 ─────────── */
  function done() {
    stage = 5; bar();
    const right = (chosen.shape === 'half' ? 1 : 0) + (chosen.steam?.correct ? 1 : 0);

    host.querySelector('.act').innerHTML = `
      <div class="act__head"><h2>🥟 송편이 완성됐어요</h2></div>

      <div class="sp__stage sp__stage--big">
        <img class="sp__img" src="assets/items/${picture()}.png" alt="완성된 송편">
        <span class="sp__fill">${chosen.filling?.emoji ?? ''}</span>
      </div>

      <div class="act__done">
        <p style="font-size:16px;line-height:1.85;color:#f2ecdc">
          ${ctx.esc(chosen.dough?.label ?? '')} 반죽을 ${KNEADS}번 치대고<br>
          ${ctx.esc(chosen.filling?.label ?? '')} 소를 넣어
          ${chosen.shape === 'half' ? '반달' : chosen.shape === 'full' ? '보름달' : '별'} 모양으로 빚어<br>
          ${ctx.esc(chosen.steam?.label ?? '')}에 쪘어요.
        </p>
        <div class="why" style="text-align:left;margin-top:20px">
          전통 송편은 <b>반달 모양</b>으로 빚어 <b>솔잎</b>을 깔고 찝니다.
          솔잎 향이 배고 떡끼리 달라붙지 않아요.
          "송편을 예쁘게 빚으면 예쁜 아기를 낳는다"는 재미있는 말도 전해집니다.
        </div>
        <button class="btn btn--sm btn--ghost" id="spAgain" style="margin-top:12px">다시 빚어보기</button>
      </div>`;

    host.querySelector('#spAgain').onclick = () => songpyeon(host, ctx);
    ctx.api.score('songpyeon', right * 50, chosen);

    /* 송편은 그림으로 저장하지 않는다 — 선생님 요청. 빚는 재미까지만. */
  }

  pickDough();
}

/* ═══════════════ 차례상 차리기 ═══════════════ */

/**
 * 다섯 줄 열두 자리를 모두 놓는다.
 * 줄마다 규칙이 하나씩 적혀 있고(반서갱동·어동육서·탕·좌포우혜·조율이시),
 * 그 규칙을 보고 어디에 놓을지 스스로 정한다.
 *
 * 끌어다 놓기와 "눌러서 고르고 자리 누르기"를 모두 지원한다.
 * 상이 길어서 쟁반이 화면 밖으로 나가는 일이 있기 때문이다.
 */
function charye(host, ctx) {
  const placed = new Map();          // 자리 열쇠 → 놓인 음식
  const pool = shuffle([...ALL_SLOTS]);
  let picked = null;
  let checked = false;

  host.innerHTML = `
    <div class="act act--wide">
      <div class="act__head">
        <h2>🕯️ 차례상 차리기</h2>
        <p>줄마다 규칙이 있어요. 규칙에 맞게 열네 가지를 놓아 봅시다.</p>
      </div>

      <!-- 줄마다 규칙 — 상 위가 아니라 밖에 둔다 -->
      <div class="ct__legend">
        ${ROWS.map((row) => `
          <span class="ct__rule">
            <b>${row.no}열 ${ctx.esc(row.rule)}</b>
            <i>${ctx.esc(row.hint)}</i>
          </span>`).join('')}
      </div>

      <div class="ct">
        <div class="ct__room">
          <div class="ct__stand">
            <div class="ct__surface">
              ${ROWS.map((row) => `
                <div class="ct__row">
                  <span class="ct__rownum">${row.no}</span>
                  <div class="ct__spots">
                    ${row.dishes.map((_, i) => `
                      <div class="ct__slot" data-key="${row.no}-${i}">
                        <span class="ct__mark"></span>
                      </div>`).join('')}
                  </div>
                </div>`).join('')}
            </div>
            <div class="ct__edge"></div>
            <div class="ct__legs"><i></i><i></i></div>
          </div>
          <div class="ct__dirs">
            <span>서쪽<small>(왼쪽)</small></span>
            <span>동쪽<small>(오른쪽)</small></span>
          </div>
        </div>

        <p class="act__step">
          아래에서 골라 상 위에 놓아요
          <small>끌어다 놓거나, 눌러서 고른 뒤 자리를 눌러도 됩니다</small>
        </p>
        <div class="ct__tray" id="ctTray"></div>
      </div>

      <div id="ctResult"></div>
    </div>`;

  const surface = host.querySelector('.ct__surface');
  const tray = host.querySelector('#ctTray');
  const slots = [...host.querySelectorAll('.ct__slot')];

  /* ── 그리기 ── */
  function draw() {
    for (const slot of slots) {
      const it = placed.get(slot.dataset.key);
      slot.classList.toggle('has', !!it);
      slot.classList.toggle('picked-target', !!picked && !it);
      slot.innerHTML = it
        ? `<img src="assets/items/${it.id}.png" alt="${ctx.esc(it.name)}" draggable="false">
           <b>${ctx.esc(it.name)}</b>`
        : '<span class="ct__mark"></span>';
    }

    const used = new Set([...placed.values()].map((x) => x.key));
    tray.innerHTML = pool.map((it) => `
      <button class="ct__item ${used.has(it.key) ? 'used' : ''} ${picked === it ? 'picked' : ''}"
              data-key="${it.key}" ${used.has(it.key) ? 'disabled' : ''}>
        <img src="assets/items/${it.id}.png" alt="" draggable="false">
        <b>${ctx.esc(it.name)}</b>
      </button>`).join('');
  }

  const byKey = (k) => pool.find((x) => x.key === k);

  function put(item, slotKey) {
    if (!item) return;
    /* 이미 다른 자리에 있으면 옮긴다 */
    for (const [k, v] of placed) if (v === item) placed.delete(k);
    const bumped = placed.get(slotKey);
    placed.set(slotKey, item);
    if (bumped) placed.delete(slotKey === bumped.key ? slotKey : null);
    picked = null;
    host.querySelector('#ctResult').innerHTML = '';
    checked = false;
    for (const sl of slots) sl.classList.remove('ok', 'no');
    draw();
    if (placed.size === ALL_SLOTS.length) check();
  }

  /* ── 눌러서 고르기 ── */
  tray.onclick = (e) => {
    const btn = e.target.closest('[data-key]');
    if (!btn || btn.disabled) return;
    const it = byKey(btn.dataset.key);
    picked = picked === it ? null : it;
    draw();
  };

  surface.onclick = (e) => {
    const slot = e.target.closest('[data-key]');
    if (!slot) return;
    if (picked) return put(picked, slot.dataset.key);
    if (placed.has(slot.dataset.key)) {     // 놓은 것을 도로 내린다
      placed.delete(slot.dataset.key);
      host.querySelector('#ctResult').innerHTML = '';
      for (const sl of slots) sl.classList.remove('ok', 'no');
      draw();
    }
  };

  /* ── 끌어다 놓기 ── */
  let dragging = null;
  let ghost = null;

  host.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.ct__item:not(.used)');
    if (!btn) return;
    e.preventDefault();
    dragging = byKey(btn.dataset.key);
    ghost = btn.querySelector('img').cloneNode();
    ghost.className = 'ct__ghost';
    document.body.appendChild(ghost);
    moveGhost(e);
  });

  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    moveGhost(e);
    const over = slotUnder(e);
    for (const sl of slots) sl.classList.toggle('over', sl === over);
  });

  host.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    const over = slotUnder(e);
    ghost?.remove();
    ghost = null;
    for (const sl of slots) sl.classList.remove('over');
    if (over) put(dragging, over.dataset.key);
    dragging = null;
  });

  function moveGhost(e) {
    if (!ghost) return;
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
  }

  function slotUnder(e) {
    for (const sl of slots) {
      const r = sl.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return sl;
    }
    return null;
  }

  /* ── 채점 ── */
  function check() {
    if (checked) return;
    checked = true;

    let right = 0;
    for (const slot of slots) {
      const it = placed.get(slot.dataset.key);
      const ok = it && it.key === slot.dataset.key;
      slot.classList.add(ok ? 'ok' : 'no');
      if (ok) right += 1;
    }
    const perfect = right === ALL_SLOTS.length;

    host.querySelector('#ctResult').innerHTML = `
      <div class="why ${perfect ? '' : 'no'}">
        <b>${perfect ? '완벽해요!' : `${right} / ${ALL_SLOTS.length} 자리 정답`}</b>
        ${perfect ? ' 다섯 줄을 모두 바르게 차렸습니다.' : ' 빨간 자리를 다시 놓아 보세요.'}
      </div>

      <div class="ct__why">
        ${ALL_SLOTS.map((f) => `
          <div class="ct__whyrow">
            <img src="assets/items/${f.id}.png" alt="">
            <div><b>${f.row}열 · ${ctx.esc(f.name)}</b><span>${ctx.esc(f.why)}</span></div>
          </div>`).join('')}
      </div>

      <div class="why no" style="margin-top:14px">${ctx.esc(CHARYE_LESSON.caution)}</div>
      <button class="btn btn--sm btn--ghost" id="ctAgain" style="margin-top:12px">다시 해보기</button>`;

    host.querySelector('#ctAgain').onclick = () => charye(host, ctx);
    ctx.api.score('charye', Math.round((right / ALL_SLOTS.length) * 100), {
      placed: [...placed.entries()].map(([k, v]) => `${k}:${v.key}`),
    });

    attachSaveButton(host.querySelector('#ctResult'), () => ({
      kind: '차례상', name: ctx.name,
      heading: perfect ? '차례상을 바르게 차렸어요' : '차례상 차리기',
      subheading: `${ALL_SLOTS.length}자리 가운데 ${right}자리 정답`,
      big: `${right}/${ALL_SLOTS.length}`,
      chips: ROWS.map((r) => `${r.no}열 ${r.rule}`),
      note: '반서갱동 · 어동육서 · 좌포우혜 · 조율이시. '
          + '다만 문헌마다 다르고 집안마다 달라서, 이것만이 정답인 것은 아니에요.',
    }));
  }

  draw();
}

/* ═══════════════ 강강술래 리듬 ═══════════════ */

/**
 * 리듬 액션. 북이 울릴 때 맞춰 누르면 원이 한 칸 돈다.
 * 빗나가면 원은 제자리 — 그래서 "우리가 돌리고 있다"가 눈에 보인다.
 * 사람들은 실제로 그린 그림(assets/items/dancer-*.png)이다.
 */
function ganggangsullae(host, ctx) {
  const WEAR = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const DANCERS = 10;   // 원 둘레에 겹치지 않게 들어가는 최대치
  const STEP = 360 / DANCERS;

  let phase = 'idle';          // idle → playing → between → done
  let round = 0, beat = 0;
  let hits = 0, misses = 0, combo = 0, bestCombo = 0;
  let turned = 0;              // 원이 몇 칸 돌았나 = 성공 횟수
  let timer = null, gap = null;
  let expected = 0, counted = false;

  host.innerHTML = `
    <div class="act">
      <div class="act__head">
        <h2>💃 강강술래</h2>
        <p id="ggHint">북이 울릴 때 맞춰 누르면 원이 돕니다</p>
      </div>

      <div class="gg" id="ggStage">
        <div class="gg__ring" id="ggRing"></div>
        <!-- 다음 박에 맞춰 오므라드는 원. 달 테두리에 닿는 순간이 누를 때다. -->
        <span class="gg__timing" id="ggTiming"></span>
        <button class="gg__moon" id="ggMoon">
          <span id="ggMoonText">누르면 시작</span>
        </button>
        <div class="gg__combo" id="ggCombo"></div>
      </div>

      <div class="gg__call" id="ggCall"></div>

      <!-- 진짜 노래는 국립국악원 영상으로 듣는다.
           음원을 저장소에 넣지 않는 것은 저작권 때문이다. -->
      <a class="gg__song" href="https://www.youtube.com/watch?v=zjg757sy8k8"
         target="_blank" rel="noopener">🎵 국립국악원 강강술래 노래 들어보기</a>
      <div class="progress" id="ggBar"></div>
      <div id="ggWhy"></div>
    </div>`;

  const ring = host.querySelector('#ggRing');
  const stage = host.querySelector('#ggStage');
  const moon = host.querySelector('#ggMoon');
  const moonText = host.querySelector('#ggMoonText');
  const comboEl = host.querySelector('#ggCombo');
  const timingEl = host.querySelector('#ggTiming');

  ring.innerHTML = Array.from({ length: DANCERS }, (_, i) =>
    `<span class="gg__dancer" style="--a:${STEP * i}deg">
       <img src="assets/items/dancer-${WEAR[i % WEAR.length]}.png" alt="" draggable="false">
     </span>`).join('');
  const dancers = [...ring.querySelectorAll('.gg__dancer')];

  /* ── 소리 — 파일 없이 만든다 ── */
  let ac = null;
  function sound(kind) {
    try {
      ac ??= new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();

      if (kind === 'down') {            // 첫 박 — 북을 세게 (네 박마다)
        o.type = 'sine';
        o.frequency.setValueAtTime(230, t);
        o.frequency.exponentialRampToValueAtTime(52, t + 0.16);
        g.gain.setValueAtTime(0.42, t);
      } else if (kind === 'beat') {     // 북 — 낮고 둔탁하게
        o.type = 'sine';
        o.frequency.setValueAtTime(190, t);
        o.frequency.exponentialRampToValueAtTime(58, t + 0.12);
        g.gain.setValueAtTime(0.3, t);
      } else if (kind === 'hit') {      // 맞았을 때 — 맑게
        o.type = 'triangle';
        o.frequency.setValueAtTime(880, t);
        o.frequency.exponentialRampToValueAtTime(440, t + 0.1);
        g.gain.setValueAtTime(0.14, t);
      } else {                          // 빗나갔을 때 — 짧고 탁하게
        o.type = 'square';
        o.frequency.setValueAtTime(120, t);
        g.gain.setValueAtTime(0.08, t);
      }
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.22);
    } catch { /* 소리를 막아둔 기기도 있다 */ }
  }

  /* ── 원을 한 칸 돌린다 (성공했을 때만) ── */
  function turnRing() {
    turned += 1;
    ring.style.transform = `rotate(${STEP * turned}deg)`;
    /* 그림은 똑바로 서 있어야 하므로 각자 반대로 되돌린다 */
    dancers.forEach((d) => {
      d.style.setProperty('--back', `${-STEP * turned}deg`);
    });
  }

  /* ── 누를 때 ── */
  moon.onclick = () => {
    if (phase === 'idle') return start();
    if (phase !== 'playing') return;

    moon.classList.add('tap');
    setTimeout(() => moon.classList.remove('tap'), 110);

    if (counted) return;                       // 한 박에 한 번만
    const off = Math.abs(Date.now() - expected);

    if (off > GANGGANG.tolerance) {            // 빗나감 — 원이 안 돈다
      counted = true;
      misses += 1;
      combo = 0;
      comboEl.textContent = '';
      sound('miss');
      stage.classList.add('miss');
      setTimeout(() => stage.classList.remove('miss'), 280);
      return;
    }

    counted = true;
    hits += 1;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    sound('hit');
    turnRing();

    /* 정확할수록 더 환하게 */
    const tight = off < GANGGANG.tolerance * 0.4;
    stage.classList.add(tight ? 'perfect' : 'good');
    setTimeout(() => stage.classList.remove(tight ? 'perfect' : 'good'), 260);

    comboEl.textContent = tight && combo >= 2 ? `딱 맞았어요 · ${combo}연속`
      : combo >= 2 ? `${combo}연속!` : '좋아요';
    comboEl.classList.remove('pop');
    void comboEl.offsetWidth;
    comboEl.classList.add('pop');
  };

  /* ── 한 장단 ── */
  function start() {
    const r = GANGGANG.rounds[round];
    if (!r) return finish();

    phase = 'playing';
    beat = 0;
    const interval = 60000 / r.bpm;

    host.querySelector('#ggHint').textContent =
      `${r.name} · 오므라드는 원이 달에 닿을 때 누르세요`;
    host.querySelector('#ggCall').innerHTML =
      `<span class="gg__lead">${ctx.esc(r.call)}</span>
       <span class="gg__resp">${ctx.esc(r.response)}</span>`;

    ring.style.setProperty('--spin', `${Math.min(280, interval * 0.55)}ms`);

    clearInterval(timer);

    /* 셈여림 넷을 먼저 준다 — 언제 눌러야 하는지 몸에 익히고 시작하게.
       이 동안은 점수를 세지 않는다. */
    let countIn = 4;
    const tick = () => {
      if (countIn > 0) {
        aimAt(Date.now() + interval);     // 다음 박을 향해 원이 오므라든다
        sound('beat');
        moonText.textContent = String(countIn);
        moon.classList.add('pulse', 'count');
        if (countIn === 1) setTimeout(() => moon.classList.remove('count'), interval);
        moon.classList.add('pulse');
        setTimeout(() => moon.classList.remove('pulse'), Math.min(260, interval * 0.6));
        countIn -= 1;
        if (countIn === 0) expected = Date.now() + interval;   // 첫 진짜 박
        return;
      }

      if (beat >= r.beats) return nextRound();

      /* 지난 박을 그냥 넘겼으면 놓친 것으로 친다 */
      if (beat > 0 && !counted) { misses += 1; combo = 0; comboEl.textContent = ''; }

      beat += 1;
      counted = false;
      /* 지금이 이번 박이고, 원은 다음 박을 향해 다시 오므라든다 */
      expected = Date.now();
      aimAt(Date.now() + interval);

      sound(beat % 4 === 1 ? 'down' : 'beat');    // 네 박마다 첫 박을 세게
      moon.classList.add('pulse');
      moonText.textContent = beat % 2 ? '강강' : '술래';
      setTimeout(() => moon.classList.remove('pulse'), Math.min(280, interval * 0.7));

      host.querySelector('#ggBar').innerHTML =
        Array.from({ length: r.beats }, (_, i) => `<i class="${i < beat ? 'ok' : ''}"></i>`).join('');
    };

    tick();
    timer = setInterval(tick, interval);
  }

  /**
   * 다음 박을 향해 원을 오므린다.
   *
   * 예전에는 달이 번쩍이는 것만으로 알려 줬는데, 번쩍인 뒤에 누르면 이미 늦다.
   * 눈에 보이는 것이 "이미 지난 박"이라 언제 눌러야 할지 알 수가 없었다.
   * 이제는 원이 줄어드는 것을 보고 달 테두리에 닿는 순간을 겨냥하면 된다.
   */
  function aimAt(at) {
    const ms = at - Date.now();
    if (ms <= 0) return;
    timingEl.style.animation = 'none';
    void timingEl.offsetWidth;                    // 애니메이션을 처음부터 다시
    timingEl.style.animation = `gg-aim ${ms}ms linear`;
  }

  function nextRound() {
    clearInterval(timer);
    timer = null;
    round += 1;
    if (round >= GANGGANG.rounds.length) return finish();

    phase = 'between';
    moonText.textContent = '다음 장단';
    comboEl.textContent = '';
    clearTimeout(gap);
    gap = setTimeout(start, 1200);
  }

  function finish() {
    phase = 'done';
    clearInterval(timer);
    const total = GANGGANG.rounds.reduce((n, r) => n + r.beats, 0);
    const pct = Math.round((hits / total) * 100);
    const turns = (turned / DANCERS).toFixed(1);

    moonText.textContent = `${pct}%`;
    comboEl.textContent = '';
    host.querySelector('#ggHint').textContent = '수고했어요!';

    host.querySelector('#ggWhy').innerHTML = `
      <div class="why">
        <b>${hits} / ${total}박</b>을 맞춰 원을 <b>${turns}바퀴</b> 돌렸어요.
        최고 ${bestCombo}연속!
        <div style="margin-top:10px;font-size:13.5px">
          강강술래는 진양조에서 시작해 중모리, 자진모리로 장단이 빨라집니다.
          느리게 시작해 점점 몰아가며 흥을 끌어올리는 것이 우리 음악의 방식이에요.
          한 사람이 앞소리를 메기면 나머지가 "강강술래" 하고 받습니다.
        </div>
      </div>
      <button class="btn btn--sm btn--ghost" id="ggAgain" style="margin-top:12px">다시 해보기</button>`;

    host.querySelector('#ggAgain').onclick = () => ganggangsullae(host, ctx);
    ctx.api.score('ganggangsullae', pct, { hits, misses, total, bestCombo, turns });

    attachSaveButton(host.querySelector('#ggWhy'), () => ({
      kind: '강강술래', name: ctx.name,
      heading: '강강술래 장단 맞추기',
      subheading: `${total}박 가운데 ${hits}박 · 원을 ${turns}바퀴`,
      big: `${pct}%`,
      chips: [`최고 ${bestCombo}연속`, ...GANGGANG.rounds.map((r) => `${r.name} ${r.bpm}`)],
      note: '진양조에서 시작해 중모리, 자진모리로 장단이 빨라집니다. '
          + '느리게 시작해 점점 몰아가며 흥을 끌어올리는 것이 우리 음악의 방식이에요.',
    }));
  }
}

/* ═══════════════ 소원 적기 ═══════════════ */

function moonWish(host, ctx) {
  host.innerHTML = `
    <div class="act">
      <div class="act__head">
        <h2>🌙 보름달에 소원을</h2>
        <p>둘 중 하나만 적어도 좋아요.</p>
      </div>
      ${WISH.prompts.map((p) => `
        <div style="margin-bottom:20px">
          <label style="display:block;font-size:15px;color:var(--moon-glow);margin-bottom:8px">
            ${p.emoji} ${ctx.esc(p.label)}
          </label>
          <textarea class="textbox" data-for="${p.id}" maxlength="60"
                    placeholder="${ctx.esc(p.placeholder)}" style="min-height:76px"></textarea>
        </div>`).join('')}
      <button class="btn btn--primary btn--lg" id="wishSend" style="width:100%">소원 보내기</button>
      <h3 style="font-size:15px;color:var(--moon-glow);margin:28px 0 10px">우리 반 소원</h3>
      <div class="wall" id="wall"><div class="empty" style="color:var(--moon-dim);font-size:13.5px">아직 소원이 없어요.</div></div>
    </div>`;

  /** 저장 카드에 담을 내 소원 — 보낸 뒤에도 남겨둔다 */
  const mine = { me: '', us: '' };

  host.querySelector('#wishSend').onclick = async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    let sent = 0;

    for (const ta of host.querySelectorAll('[data-for]')) {
      const text = ta.value.trim();
      if (!text) continue;
      await ctx.api.wish(text, ta.dataset.for);
      mine[ta.dataset.for] = text;
      ta.value = '';
      sent += 1;
    }

    btn.textContent = sent ? '보냈어요 ✓' : '소원을 적어 주세요';
    setTimeout(() => { btn.disabled = false; btn.textContent = '소원 보내기'; }, 2200);

    if (sent && !host.querySelector('.save-card')) {
      attachSaveButton(host.querySelector('.act'), () => ({
        style: 'postcard',                     /* 보름달 엽서로 뽑는다 */
        kind: '소원엽서', name: ctx.name, lead: '보름달에 빈 소원',
        notes: WISH.prompts.map((p) => ({ label: p.label, text: mine[p.id] })),
        note: '보름달 아래에서 빈 소원은 이루어진다고 했어요.',
      }), '엽서로 저장하기');
    }
  };

  /* 소원 벽은 바깥에서 갱신해 준다 */
  host.dataset.wall = 'wishes';
}

/* ═══════════════ 생각 모으기 ═══════════════ */

function discuss(host, ctx) {
  const d = DISCUSS[ctx.band] ?? DISCUSS.mid;

  host.innerHTML = `
    <div class="act">
      <div class="act__head">
        <h2>💬 생각 모으기</h2>
        <p>${ctx.esc(d.prompt)}</p>
      </div>
      <textarea class="textbox" id="opText" maxlength="200" placeholder="${ctx.esc(d.placeholder)}"></textarea>
      <div style="text-align:right;font-size:12px;color:var(--moon-dim);margin:6px 2px">
        <span id="opCount">0</span> / 200자
      </div>
      <button class="btn btn--primary btn--lg" id="opSend" style="width:100%;margin-top:8px">생각 보내기</button>
      <div id="opDone"></div>
    </div>`;

  const ta = host.querySelector('#opText');
  ta.oninput = () => { host.querySelector('#opCount').textContent = ta.value.length; };

  host.querySelector('#opSend').onclick = async (e) => {
    const text = ta.value.trim();
    if (!text) return;
    e.currentTarget.disabled = true;
    await ctx.api.opinion(text);
    host.querySelector('#opDone').innerHTML =
      '<div class="why" style="margin-top:16px">보냈어요! 선생님 화면에 올라갔습니다.</div>';
    ta.value = '';
    host.querySelector('#opCount').textContent = '0';
    setTimeout(() => { e.target.disabled = false; }, 1500);
  };
}

/* ═══════════════ 생각쓰기 ═══════════════ */

/**
 * 퀴즈는 교사가 진행하는 라이브 한 가지로 통일했다.
 * 혼자 푸는 확인 퀴즈는 빼고, 수업을 자기 말로 정리하는 부분만 남긴다.
 */
function reflect(host, ctx) {
  const r = REFLECTION[ctx.band] ?? REFLECTION.mid;

  host.innerHTML = `
    <div class="act">
      <div class="act__head">
        <h2>✍️ 생각 쓰기</h2>
        <p>오늘 배운 것을 내 말로 적어 봅시다.</p>
      </div>

      <div style="margin-bottom:16px">
        <label class="act__step">${ctx.esc(r.learned)}</label>
        <textarea class="textbox" id="rLearned" maxlength="300" style="min-height:96px"></textarea>
      </div>

      ${r.thought ? `
      <div style="margin-bottom:16px">
        <label class="act__step">${ctx.esc(r.thought)}</label>
        <textarea class="textbox" id="rThought" maxlength="300" style="min-height:96px"></textarea>
      </div>` : ''}

      <button class="btn btn--primary btn--lg" id="rSend" style="width:100%">제출하기</button>
      <div id="rDone"></div>
    </div>`;

  host.querySelector('#rSend').onclick = async (e) => {
    const learned = host.querySelector('#rLearned')?.value.trim() ?? '';
    const thought = host.querySelector('#rThought')?.value.trim() ?? '';
    if (!learned && !thought) return;

    e.currentTarget.disabled = true;
    await ctx.api.reflection(learned, thought);

    host.querySelector('#rDone').innerHTML = `
      <div class="act__done">
        <div class="big">🌕</div>
        <h3>잘 정리했어요</h3>
        <p style="color:var(--moon-dim);font-size:14.5px;margin-top:8px;line-height:1.7">
          올해 추석에는 오늘 배운 것을<br>가족에게 한 가지 알려줘 볼까요?
        </p>
      </div>`;

    attachSaveButton(host.querySelector('#rDone'), () => ({
      style: 'postcard',                       /* 소원과 같은 엽서 모양으로 */
      kind: '배움엽서', name: ctx.name, lead: '오늘 배운 추석',
      notes: [
        { label: r.learned, text: learned },
        { label: r.thought ?? '', text: thought },
      ],
      note: '오늘 배운 것을 가족에게 한 가지 알려줘 보세요.',
    }), '엽서로 저장하기');

    setTimeout(() => { e.target.disabled = false; }, 1500);
  };
}

/* ═══════════════ 추석 엽서 쓰기 ═══════════════ */

/**
 * 수업을 닫는 활동. 받을 사람을 먼저 고르고, 인사말을 고르고, 하고 싶은 말을 적는다.
 *
 * 소원 적기는 "내가 바라는 것"이라 혼자 쓰면 되지만,
 * 엽서는 "누구에게" 쓰는지가 정해져야 무슨 말을 쓸지 떠오른다.
 * 그래서 받을 사람을 고르는 단계를 앞에 두었다.
 */
function postcard(host, ctx) {
  let to = null;
  let greeting = POSTCARD.greetings[0];

  host.innerHTML = `
    <div class="act">
      <div class="act__head">
        <h2>💌 추석 엽서 쓰기</h2>
        <p>누구에게 보낼지 먼저 골라요.</p>
      </div>

      <div class="pc__who" id="pcWho">
        ${POSTCARD.toWhom.map((w) => `
          <button class="pc__whocard" data-who="${w.id}">
            <span class="pc__whoicon">${w.icon}</span>
            <b>${ctx.esc(w.label)}</b>
          </button>`).join('')}
      </div>

      <div id="pcWrite" hidden>
        <p class="act__step" id="pcHint"></p>

        <label class="pc__label">인사말 고르기</label>
        <div class="pc__greets" id="pcGreets">
          ${POSTCARD.greetings.map((g, i) => `
            <button class="pc__greet ${i === 0 ? 'on' : ''}" data-g="${i}">${ctx.esc(g)}</button>`).join('')}
        </div>

        <label class="pc__label" for="pcText">하고 싶은 말</label>
        <textarea class="textbox" id="pcText" maxlength="${POSTCARD.maxLen}"
                  placeholder="마음을 담아 적어 보세요"></textarea>
        <div class="pc__count"><span id="pcNum">0</span> / ${POSTCARD.maxLen}자</div>

        <button class="btn btn--primary btn--lg" id="pcDone" style="width:100%;margin-top:8px">
          엽서 완성하기
        </button>
      </div>

      <div id="pcResult"></div>
    </div>`;

  const $$ = (id) => host.querySelector(id);

  /* ── 받을 사람 고르기 ── */
  $$('#pcWho').onclick = (e) => {
    const btn = e.target.closest('[data-who]');
    if (!btn) return;
    to = POSTCARD.toWhom.find((w) => w.id === btn.dataset.who);
    for (const b of host.querySelectorAll('.pc__whocard')) b.classList.toggle('on', b === btn);
    $$('#pcWrite').hidden = false;
    $$('#pcHint').textContent = to.hint;
    $$('#pcText').focus();
  };

  /* ── 인사말 고르기 ── */
  $$('#pcGreets').onclick = (e) => {
    const btn = e.target.closest('[data-g]');
    if (!btn) return;
    greeting = POSTCARD.greetings[Number(btn.dataset.g)];
    for (const b of host.querySelectorAll('.pc__greet')) b.classList.toggle('on', b === btn);
  };

  const ta = $$('#pcText');
  ta.oninput = () => { $$('#pcNum').textContent = ta.value.length; };

  /* ── 완성 ── */
  $$('#pcDone').onclick = async () => {
    const text = ta.value.trim();
    if (!text) { ta.focus(); return; }

    /* 엽서도 생각쓰기와 같은 자리에 모은다 — 선생님이 한 곳에서 본다 */
    await ctx.api.reflection(`${to.label} — ${greeting}`, text);

    $$('#pcResult').innerHTML = `
      <div class="act__done">
        <div class="big">💌</div>
        <h3>엽서를 다 썼어요</h3>
        <p style="color:var(--moon-dim);font-size:14.5px;margin-top:8px;line-height:1.7">
          아래에서 엽서로 저장한 뒤<br>패들릿에 올리거나 직접 전해 주세요.
        </p>
      </div>`;
    $$('#pcDone').disabled = true;

    if (!host.querySelector('.save-card')) {
      attachSaveButton(host.querySelector('#pcResult'), () => ({
        style: 'postcard',
        kind: '추석엽서', name: ctx.name,
        lead: to.label,
        notes: [
          { label: greeting, text },
        ],
        note: '더도 말고 덜도 말고 한가위만 같아라.',
      }), '엽서로 저장하기');
    }
  };
}

/* ═══════════════ 내보내기 ═══════════════ */

export const ACTIVITIES = {
  'word-cards': wordCards,
  postcard,
  songpyeon,
  charye,
  ganggangsullae,
  'moon-wish': moonWish,
  discuss,
  reflect,
};
