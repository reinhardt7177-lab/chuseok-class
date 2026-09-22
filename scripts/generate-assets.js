/**
 * 수업 삽화 일괄 생성기.
 *   npm run assets              — 아직 없는 것만 생성
 *   npm run assets:dry          — 비용·목록만 미리보기
 *   node scripts/generate-assets.js --only opening-moonrise,moon-rabbit
 *   node scripts/generate-assets.js --force            — 이미 있어도 다시
 *   node scripts/generate-assets.js --section food     — 특정 장면만
 *
 * 이미 받은 이미지는 건너뛰므로 중간에 끊겨도 다시 돌리면 이어서 받는다.
 */
import 'dotenv/config';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Leonardo, sleep } from '../server/leonardo.js';
import { ASSETS, DEFAULTS, NEGATIVE, fullPrompt } from './asset-manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG_DIR = path.join(ROOT, 'public', 'assets', 'img');
const CACHE = path.join(ROOT, 'scripts', '.asset-cache.json');

const CONCURRENCY = 3;       // Leonardo 동시 요청 슬롯
const CREDITS_PER_IMAGE = 8; // 실측치

/* ── 인자 파싱 ── */
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : null;
};

const dryRun = flag('dry-run');
const force = flag('force');
const onlyIds = value('only')?.split(',').map((s) => s.trim());
const onlySection = value('section');

let queue = ASSETS;
if (onlyIds) queue = queue.filter((a) => onlyIds.includes(a.id));
if (onlySection) queue = queue.filter((a) => a.section === onlySection);

/* ── 캐시 ── */
const cache = await readJson(CACHE, {});
await mkdir(IMG_DIR, { recursive: true });

/* ── 이미 받은 것 거르기 ── */
const todo = [];
for (const asset of queue) {
  const file = path.join(IMG_DIR, `${asset.id}.jpg`);
  if (!force && (await exists(file))) continue;
  todo.push(asset);
}

console.log(`\n  🎨 삽화 생성기`);
console.log(`     전체 ${ASSETS.length}장 · 대상 ${queue.length}장 · 새로 만들 것 ${todo.length}장`);
console.log(`     예상 비용 ${todo.length * CREDITS_PER_IMAGE} 크레딧 (장당 ${CREDITS_PER_IMAGE})`);

if (dryRun) {
  console.log('\n  ── 미리보기 (실제 생성 안 함) ──\n');
  for (const a of todo) {
    console.log(`  [${a.section}/${a.role}] ${a.id}  —  ${a.scene}`);
    console.log(`     ${fullPrompt(a).slice(0, 150)}…`);
    console.log(`     ${a.width ?? DEFAULTS.width}×${a.height ?? DEFAULTS.height}  motion:${a.motion}  layers:[${(a.layers ?? []).join(',')}]\n`);
  }
  process.exit(0);
}

if (!todo.length) {
  console.log('\n  ✅ 새로 만들 것이 없습니다. (--force 로 다시 만들 수 있어요)\n');
  process.exit(0);
}

const leo = new Leonardo(process.env.LEONARDO_API_KEY?.trim());
leo.onRetry = ({ attempt, waitMs, reason }) =>
  console.log(`     ↻ 네트워크 재시도 ${attempt} (${reason}) — ${waitMs}ms 후`);

const before = await creditBalance(leo);
console.log(`     시작 전 잔액 ${before?.toLocaleString('ko-KR') ?? '?'} 크레딧\n`);

const done = [];
const failed = [];
let finished = 0;

/* ── 동시 실행 (슬롯 CONCURRENCY개) ── */
const lanes = Array.from({ length: CONCURRENCY }, () => worker());
await Promise.all(lanes);

async function worker() {
  while (todo.length) {
    const asset = todo.shift();
    if (!asset) return;
    try {
      await generateOne(asset);
      done.push(asset.id);
    } catch (err) {
      failed.push({ id: asset.id, message: err.message });
      console.log(`  ❌ ${asset.id} — ${err.message}`);
    }
    finished += 1;
  }
}

async function generateOne(asset) {
  const width = asset.width ?? DEFAULTS.width;
  const height = asset.height ?? DEFAULTS.height;
  const label = `${asset.id}`.padEnd(24);

  const job = await leo.createGeneration({
    model: DEFAULTS.model,
    parameters: {
      prompt: fullPrompt(asset),
      negative_prompt: NEGATIVE,
      width,
      height,
      quantity: DEFAULTS.quantity,
      mode: DEFAULTS.mode,
      prompt_enhance: DEFAULTS.prompt_enhance,
    },
  });

  const result = await leo.waitForGeneration(job.generationId, {
    timeoutMs: 240_000,
    intervalMs: 3_500,
  });

  const url = result.images[0];
  if (!url) throw new Error('이미지 URL이 응답에 없습니다.');

  const file = path.join(IMG_DIR, `${asset.id}.jpg`);
  await download(url, file);

  cache[asset.id] = {
    generationId: job.generationId,
    imageId: result.raw?.generated_images?.[0]?.id ?? null,
    url,
    cost: job.cost?.amount ?? null,
    width,
    height,
    at: new Date().toISOString(),
  };
  await writeFile(CACHE, JSON.stringify(cache, null, 2), 'utf8');

  const pct = Math.round(((finished + 1) / (finished + 1 + todo.length)) * 100);
  console.log(`  ✅ ${label} ${width}×${height}  $${job.cost?.amount ?? '?'}   (${pct}%)`);
}

/* ── 마무리 ── */
const after = await creditBalance(leo);
console.log(`\n  ─────────────────────────────────`);
console.log(`  성공 ${done.length}장 / 실패 ${failed.length}장`);
if (before && after) console.log(`  사용한 크레딧 ${(before - after).toLocaleString('ko-KR')} · 남은 잔액 ${after.toLocaleString('ko-KR')}`);
if (failed.length) {
  console.log(`\n  실패 목록 (다시 돌리면 이어서 시도합니다):`);
  failed.forEach((f) => console.log(`    • ${f.id} — ${f.message}`));
}
console.log('');

/* ── 유틸 ── */
async function download(url, dest) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`다운로드 실패 HTTP ${res.status}`);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(1500 * attempt);
    }
  }
}

async function creditBalance(client) {
  try {
    const me = await client.me();
    const u = me?.user_details?.[0] ?? me;
    return u?.apiPaidTokens ?? null;
  } catch {
    return null;
  }
}

async function exists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

async function readJson(p, fallback) {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return fallback; }
}
