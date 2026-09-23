/**
 * 오프닝 — 우리나라의 즐거운 명절.
 *
 * 작은 칸은 눌러서 뒤집어 보고, 큰 칸(추석)을 누르면 수업이 시작된다.
 * 한 번에 한 칸만 열어 둔다. 프로젝터로 볼 때 여러 장이 동시에 열려 있으면
 * 어디를 보라는 건지 알 수 없다.
 */

import { HOLIDAYS, HERO } from './data/holidays.js';
import { renderStage, preload } from './shared/stage.js';
import { mountBgm } from './shared/bgm.js';
import { artUrl } from './shared/asset-url.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const bento = document.getElementById('bento');

/* ── 추석 칸 — 이것만 링크다 ── */
const hero = document.createElement('a');
hero.className = 'hero';
hero.href = 'teacher.html';
hero.setAttribute('aria-label', `${HERO.name} 수업 시작하기`);
hero.innerHTML = `
  <span class="hero__bg" style="background-image:url('${artUrl(HERO.img)}')"></span>
  <span class="hero__today">${esc(HERO.tag)}</span>
  <span class="hero__main">
    <h2 class="hero__name"><em>${esc(HERO.when)}</em>${esc(HERO.name)}</h2>
    <p class="hero__body">${esc(HERO.body)}</p>
    <span class="hero__go">수업 시작</span>
  </span>`;
bento.append(hero);

/* ── 나머지 명절 — 뒤집어 보는 카드 ── */
for (const h of HOLIDAYS) {
  if (h.hero) continue;

  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = `tile${h.big ? ' tile--big' : ''}`;
  tile.style.setProperty('--tint', h.tint);
  tile.setAttribute('aria-expanded', 'false');
  tile.innerHTML = `
    <span class="tile__in">
      <span class="tile__face tile__front">
        <span class="tile__bg" style="background-image:url('${artUrl(h.img)}')${h.pos ? `;background-position:${h.pos}` : ''}"></span>
        <span class="tile__cap">
          <span class="tile__name">${esc(h.name)}</span>
          <span class="tile__when">${esc(h.when)}</span>
        </span>
      </span>
      <span class="tile__face tile__back">
        <span class="tile__tag">${esc(h.tag)}</span>
        <p class="tile__body">${esc(h.body)}</p>
        <span class="tile__meta">
          <span><i>먹는 것</i>${esc(h.food)}</span>
          <span><i>노는 것</i>${esc(h.play)}</span>
        </span>
      </span>
    </span>`;

  tile.addEventListener('click', () => {
    const open = tile.classList.contains('is-open');
    for (const t of bento.querySelectorAll('.tile.is-open')) {
      t.classList.remove('is-open');
      t.setAttribute('aria-expanded', 'false');
    }
    if (!open) {
      tile.classList.add('is-open');
      tile.setAttribute('aria-expanded', 'true');
    }
  });

  bento.append(tile);
}

/* 열린 칸을 Esc로 닫는다 */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  for (const t of bento.querySelectorAll('.tile.is-open')) {
    t.classList.remove('is-open');
    t.setAttribute('aria-expanded', 'false');
  }
});

/* 배경 — 밤하늘 */
renderStage(document.getElementById('stage'), 'landing-hero', {
  motion: 'kenburns-in',
  layers: ['moonlight', 'fireflies'],
});

/* 배경음악 — 칸을 처음 누르는 순간부터. 추석을 눌러 넘어가면 선생님 화면이 이어서 튼다. */
mountBgm(document.querySelector('.open__foot'), { before: document.querySelector('.open__student') });

/* 다음에 바로 쓸 삽화를 미리 받아둔다 */
preload(['opening-moonrise', 'opening-village-far', 'student-welcome']);
