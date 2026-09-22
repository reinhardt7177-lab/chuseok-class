/** 계정에서 쓸 수 있는 모델 목록을 뽑는다.  실행: npm run models */
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { Leonardo } from '../server/leonardo.js';

const leo = new Leonardo(process.env.LEONARDO_API_KEY?.trim());
const { version, data } = await leo.models();

await writeFile(
  new URL('../docs/leonardo-models.json', import.meta.url),
  JSON.stringify(data, null, 2),
  'utf8',
);

const list = Array.isArray(data) ? data
  : data?.models ?? data?.custom_models ?? data?.data ?? [];

console.log(`\n  📦 ${version} 모델 ${list.length}개  (전체 응답은 docs/leonardo-models.json 에 저장)\n`);
for (const m of list.slice(0, 60)) {
  const id = m?.id ?? m?.model ?? m?.name ?? '(id 없음)';
  const name = m?.name ?? m?.description ?? '';
  const kind = m?.modality ?? m?.type ?? m?.category ?? '';
  console.log(`   • ${String(id).padEnd(34)} ${kind ? `[${kind}] ` : ''}${name}`.trimEnd());
}
console.log('');
