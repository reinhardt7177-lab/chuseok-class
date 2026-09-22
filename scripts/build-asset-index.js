/**
 * scripts/asset-manifest.js(노드용) → public/js/shared/assets.js(브라우저용)
 * 프롬프트는 빼고 화면에 필요한 것만 옮긴다. 매니페스트를 고치면 다시 돌릴 것.
 *   node scripts/build-asset-index.js
 */
import { writeFile } from 'node:fs/promises';
import { ASSETS } from './asset-manifest.js';

const slim = ASSETS.map(({ id, section, role, scene, motion, layers, kw, width, height }) => ({
  id, section, role, scene, motion, layers: layers ?? [], kw: kw ?? [],
  w: width ?? 1536, h: height ?? 864,
}));

const out = `/* 자동 생성 — 고치지 말고 scripts/asset-manifest.js를 고친 뒤
   node scripts/build-asset-index.js 를 다시 돌리세요. */

export const ASSETS = ${JSON.stringify(slim, null, 2)};

export const ASSET_BY_ID = Object.fromEntries(ASSETS.map((a) => [a.id, a]));

/** 특정 장면에 딸린 삽화들 */
export function assetsFor(sectionId, role) {
  return ASSETS.filter((a) => a.section === sectionId && (!role || a.role === role));
}

/** 장면의 대표 삽화 */
export function heroFor(sectionId) {
  return assetsFor(sectionId, 'hero')[0] ?? assetsFor(sectionId)[0] ?? null;
}
`;

await writeFile(new URL('../public/js/shared/assets.js', import.meta.url), out, 'utf8');
console.log(`  ✅ assets.js 생성 — ${slim.length}장`);
