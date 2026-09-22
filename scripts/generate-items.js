/**
 * 활동에 올려놓을 낱개 그림을 만든다.
 * 생성 → 배경 제거(remove-bg) → 투명 PNG 저장.
 *
 * 이모지 대신 진짜 그림을 상에 올리게 하려고 만든 것.
 *   node scripts/generate-items.js            없는 것만
 *   node scripts/generate-items.js --force    다시
 *   node scripts/generate-items.js --only jujube
 */
import 'dotenv/config';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Leonardo, collectAssets } from '../server/leonardo.js';
import { STYLE_PREFIX, STYLE_SUFFIX, NEGATIVE } from './asset-manifest.js';
import { ITEMS } from './items-manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'assets', 'items');

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const onlyIx = argv.indexOf('--only');
const only = onlyIx >= 0 ? argv[onlyIx + 1]?.split(',') : null;

const leo = new Leonardo(process.env.LEONARDO_API_KEY?.trim());
leo.onRetry = ({ attempt, reason }) => console.log(`     ↻ 재시도 ${attempt} (${reason})`);

await mkdir(OUT, { recursive: true });

const todo = [];
for (const item of ITEMS) {
  if (only && !only.includes(item.id)) continue;
  const file = path.join(OUT, `${item.id}.png`);
  if (!force && (await exists(file))) continue;
  todo.push(item);
}

console.log(`\n  🍐 낱개 그림 — 만들 것 ${todo.length}개 (배경 제거 포함)\n`);
if (!todo.length) {
  console.log('  ✅ 새로 만들 것이 없습니다.\n');
  process.exit(0);
}

let ok = 0;
for (const item of todo) {
  try {
    /* [1] 그림 생성 — 배경을 단색으로 깔아야 배경 제거가 깔끔하다 */
    const job = await leo.createGeneration({
      model: 'lucid-origin',
      parameters: {
        prompt:
          `${STYLE_PREFIX}${item.prompt}, centered on a plain flat solid pale background, ` +
          `the object fully inside the frame with generous empty margin on all sides. ${STYLE_SUFFIX}`,
        negative_prompt: `${NEGATIVE}, busy background, table, room, scene, multiple dishes`,
        width: item.portrait ? 768 : 1024,
        height: item.portrait ? 1152 : 1024,
        quantity: 1, mode: 'FAST', prompt_enhance: 'OFF',
      },
    });
    const made = await leo.waitForGeneration(job.generationId, { timeoutMs: 180_000, intervalMs: 3_000 });
    const imageId = made.raw?.generated_images?.[0]?.id;
    if (!imageId) throw new Error('imageId를 못 받았습니다.');

    /* [2] 배경 제거 — sync 모델이라 한 번에 결과가 온다 */
    const cut = await leo.createSyncGeneration({
      model: 'remove-bg',
      parameters: {
        guidances: { image_reference: [{ image: { type: 'GENERATED', id: imageId } }] },
        format: 'png',
        channels: 'rgba',
      },
      ephemeral: true,
    });

    const url = collectAssets(cut).images[0] ?? cut?.results?.[0]?.url;
    if (!url) throw new Error('배경 제거 결과 URL이 없습니다.');

    /* 학교망에서 TLS가 자주 끊긴다. 여기서 실패하면 비싼 배경 제거가 날아간다. */
    let bytes = null;
    for (let i = 1; i <= 4 && !bytes; i += 1) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        bytes = Buffer.from(await res.arrayBuffer());
      } catch (err) {
        if (i === 4) throw new Error(`다운로드 실패 (${i}회) — ${err.message}`);
        console.log(`     ↻ 내려받기 재시도 ${i}`);
        await new Promise((r) => setTimeout(r, 1200 * i));
      }
    }
    await writeFile(path.join(OUT, `${item.id}.png`), bytes);

    console.log(`  ✅ ${item.id.padEnd(18)} ${item.name}`);
    ok += 1;
  } catch (err) {
    console.log(`  ❌ ${item.id.padEnd(18)} ${err.message}`);
  }
}

const me = await leo.me().catch(() => null);
const left = me?.user_details?.[0]?.apiPaidTokens;
console.log(`\n  성공 ${ok} / ${todo.length}${left ? ` · 남은 크레딧 ${left.toLocaleString('ko-KR')}` : ''}\n`);

async function exists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}
