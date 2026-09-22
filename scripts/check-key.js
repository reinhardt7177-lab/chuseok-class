/** API 키가 살아있는지, 크레딧이 얼마나 남았는지 확인한다.  실행: npm run key:check */
import 'dotenv/config';
import { Leonardo } from '../server/leonardo.js';

const key = process.env.LEONARDO_API_KEY?.trim();

if (!key || key.startsWith('여기에')) {
  console.error('\n  ❌ .env 파일의 LEONARDO_API_KEY가 아직 비어 있습니다.');
  console.error('     https://app.leonardo.ai → Settings → API Access 에서 키를 만들어 붙여넣으세요.\n');
  process.exit(1);
}

console.log(`\n  🔑 키 확인 중… (${key.slice(0, 8)}…${key.slice(-4)})`);

try {
  const leo = new Leonardo(key);
  const me = await leo.me();
  const u = me?.user_details?.[0] ?? me?.user_details ?? me;

  console.log('  ✅ 키가 정상 동작합니다.\n');
  console.log(`     사용자     : ${u?.user?.username ?? '(이름 없음)'}`);
  console.log(`     구독 토큰  : ${fmt(u?.subscriptionTokens)}`);
  console.log(`     GPT 토큰   : ${fmt(u?.subscriptionGptTokens)}`);
  console.log(`     모델 토큰  : ${fmt(u?.subscriptionModelTokens)}`);
  console.log(`     API 크레딧 : ${fmt(u?.apiCredit ?? u?.apiPaidTokens)}`);
  console.log('\n  다음 단계 →  npm run models   (사용 가능한 모델 확인)\n');
} catch (err) {
  console.error(`\n  ❌ ${err.message}`);
  if (err.status === 401) console.error('     키가 틀렸거나 만료됐습니다. Leonardo에서 새 키를 발급하세요.');
  if (err.status === 403) console.error('     이 키에 API 사용 권한이 없습니다. API 구독 플랜을 확인하세요.');
  console.error('');
  process.exit(1);
}

function fmt(v) {
  return v === null || v === undefined ? '—' : Number(v).toLocaleString('ko-KR');
}
