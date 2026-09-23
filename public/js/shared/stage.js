/**
 * 무대 — 삽화 한 장에 모션과 입자를 입혀 살아 있는 화면으로 만든다.
 * 모션 영상을 쓰지 않기로 했으므로, 화면의 생기는 전부 여기서 나온다.
 */

import { ASSET_BY_ID } from './assets.js';
import { artUrl } from './asset-url.js';

/** 파티클 종류별 개수와 크기 — 너무 많으면 저사양 교실 PC가 버벅인다 */
const FX_SPEC = {
  moonlight: { count: 14, size: [3, 9],  dur: [18, 34], peak: .45 },
  fireflies: { count: 16, size: [3, 6],  dur: [8, 16],  peak: .9 },
  sparks:    { count: 18, size: [2, 5],  dur: [6, 13],  peak: .85 },
  steam:     { count: 10, size: [18, 44], dur: [7, 13], peak: .28 },
  dust:      { count: 20, size: [2, 5],  dur: [24, 44], peak: .35 },
  leaves:    { count: 9,  size: [10, 18], dur: [12, 22], peak: .8 },
};

const rand = (min, max) => min + Math.random() * (max - min);

/** 파티클 레이어 하나를 만든다 */
function buildLayer(kind) {
  const spec = FX_SPEC[kind];
  if (!spec) return null;

  const layer = document.createElement('div');
  layer.className = `fx fx--${kind}`;
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < spec.count; i += 1) {
    const dot = document.createElement('span');
    const size = rand(spec.size[0], spec.size[1]);

    dot.style.width = `${size}px`;
    dot.style.height = kind === 'leaves' ? `${size * 0.8}px` : `${size}px`;
    dot.style.left = `${rand(-4, 100)}%`;
    dot.style.setProperty('--dur', `${rand(spec.dur[0], spec.dur[1])}s`);
    dot.style.setProperty('--delay', `${rand(-spec.dur[1], 0)}s`);
    dot.style.setProperty('--peak', String(spec.peak));
    dot.style.setProperty('--dx', `${rand(-8, 8)}vw`);
    dot.style.setProperty('--dy', `${rand(4, 12)}vh`);

    // 떠다니는 것들은 아래쪽에서 시작해야 자연스럽다
    if (kind === 'fireflies' || kind === 'sparks' || kind === 'steam') {
      dot.style.top = `${rand(35, 95)}%`;
    }
    layer.appendChild(dot);
  }
  return layer;
}

/**
 * 무대를 그린다.
 * @param {HTMLElement} host  .stage 요소
 * @param {string} assetId    public/assets/img/<id>.jpg
 * @param {object} opts       { motion, layers, scrim: 'full'|'soft'|'none' }
 */
export function renderStage(host, assetId, opts = {}) {
  const asset = ASSET_BY_ID[assetId] ?? {};
  const motion = opts.motion ?? asset.motion ?? 'kenburns-in';
  const layers = opts.layers ?? asset.layers ?? [];
  const scrim = opts.scrim ?? 'full';

  // 기존 배경·효과만 걷어낸다 (.stage__body 안의 내용은 남긴다)
  host.querySelectorAll('.stage__img, .fx, .stage__scrim').forEach((n) => n.remove());

  const img = document.createElement('img');
  img.className = `stage__img motion-${motion}`;
  img.src = artUrl(`assets/img/${assetId}.jpg`);
  img.alt = ''; // 배경 장식 — 내용은 본문이 전달한다
  img.setAttribute('aria-hidden', 'true');
  img.decoding = 'async';

  // 같은 클래스를 다시 붙일 때 애니메이션이 재시작되도록
  img.addEventListener('load', () => { void img.offsetWidth; }, { once: true });

  host.prepend(img);

  if (scrim !== 'none') {
    const s = document.createElement('div');
    s.className = `stage__scrim${scrim === 'soft' ? ' stage__scrim--soft' : ''}`;
    img.after(s);
  }

  for (const kind of layers) {
    const layer = buildLayer(kind);
    if (layer) host.insertBefore(layer, host.querySelector('.stage__body'));
  }
}

/** 삽화를 미리 받아둔다 — 수업 중 흰 화면이 번쩍이지 않게 */
export function preload(assetIds) {
  for (const id of assetIds) {
    const img = new Image();
    img.decoding = 'async';
    img.src = artUrl(`assets/img/${id}.jpg`);
  }
}
