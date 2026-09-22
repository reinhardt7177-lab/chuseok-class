/**
 * Render에 이 앱을 올린다.
 *   node scripts/deploy-render.js
 *
 * .env 의 RENDER_API_KEY 를 쓴다. 키는 어디에도 찍지 않는다.
 *
 * 이미 같은 이름의 서비스가 있으면 새로 만들지 않고 그 서비스에
 * 배포만 다시 건다. 여러 번 돌려도 서비스가 늘어나지 않는다.
 *
 * 만드는 것은 render.yaml 과 같은 설정이다.
 * 둘 중 하나만 쓰면 되는데, 이 스크립트는 대시보드에 들어가지 않고
 * 끝내고 싶을 때 쓰는 길이다.
 */
import 'dotenv/config';

const KEY = process.env.RENDER_API_KEY;
const REPO = process.env.RENDER_REPO ?? 'https://github.com/reinhardt7177-lab/chuseok-class';
const NAME = process.env.RENDER_SERVICE ?? 'chuseok-class';
const BRANCH = 'main';
const REGION = 'singapore';

if (!KEY) {
  console.error('\n  RENDER_API_KEY 가 없습니다.');
  console.error('  Render → Account Settings → API Keys → Create API Key 로 만든 키를');
  console.error('  D:\\mumu\\추석\\.env 에 한 줄 넣어 주세요.\n');
  console.error('      RENDER_API_KEY=rnd_...\n');
  process.exit(1);
}

const API = 'https://api.render.com/v1';

async function call(path, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      authorization: `Bearer ${KEY}`,
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* 본문이 JSON이 아닐 때 */ }
  if (!res.ok) {
    const why = json?.message ?? json?.error ?? text.slice(0, 300);
    throw new Error(`${res.status} ${path} — ${why}`);
  }
  return json;
}

/** Render 목록 API는 [{ 무엇: {...}, cursor }] 꼴로 돌려준다 */
const unwrap = (rows, key) => (rows ?? []).map((r) => r?.[key] ?? r);

async function main() {
  /* ── 누구의 계정인가 ── */
  const owners = unwrap(await call('/owners?limit=20'), 'owner');
  if (!owners.length) throw new Error('계정을 찾지 못했습니다. API 키를 다시 확인해 주세요.');
  const owner = owners[0];
  console.log(`  계정  ${owner.name ?? owner.email ?? owner.id}`);

  /* ── 이미 있는 서비스인가 ── */
  const found = unwrap(await call(`/services?name=${encodeURIComponent(NAME)}&limit=20`), 'service')
    .find((s) => s.name === NAME);

  let service = found;
  let deployId = null;

  if (service) {
    console.log(`  기존 서비스를 씁니다 — ${service.id}`);
  } else {
    console.log(`  새 서비스를 만듭니다 — ${NAME} (${REGION}, free)`);
    const made = await call('/services', {
      method: 'POST',
      body: JSON.stringify({
        type: 'web_service',
        name: NAME,
        ownerId: owner.id,
        repo: REPO,
        branch: BRANCH,
        autoDeploy: 'yes',
        serviceDetails: {
          runtime: 'node',
          plan: 'free',
          region: REGION,
          healthCheckPath: '/',
          envSpecificDetails: {
            buildCommand: 'npm ci --omit=dev',
            startCommand: 'node server/server.js',
          },
        },
      }),
    });
    service = made?.service ?? made;
    /* 서비스를 만들면 Render가 첫 배포를 알아서 건다. 여기서 또 걸면 두 번 돈다. */
    deployId = made?.deployId ?? null;
  }

  /* ── 이미 도는 배포가 있으면 그것을 지켜보고, 없으면 새로 건다 ── */
  const RUNNING = ['created', 'queued', 'build_in_progress', 'update_in_progress', 'pre_deploy_in_progress'];
  if (!deployId) {
    const recent = unwrap(await call(`/services/${service.id}/deploys?limit=5`), 'deploy');
    const live = recent.find((d) => RUNNING.includes(d.status));
    if (live) {
      deployId = live.id;
      console.log('  이미 도는 배포가 있어 그것을 지켜봅니다');
    } else {
      const started = await call(`/services/${service.id}/deploys`, {
        method: 'POST',
        body: JSON.stringify({ clearCache: 'do_not_clear' }),
      });
      deployId = (started?.deploy ?? started)?.id;
    }
  }
  if (!deployId) throw new Error('배포를 시작하지 못했습니다.');
  console.log(`  배포 — ${deployId}`);

  const DONE = { live: '올라감', deactivated: '내려감', build_failed: '빌드 실패',
                 update_failed: '갱신 실패', canceled: '취소됨', pre_deploy_failed: '사전 단계 실패' };

  const until = Date.now() + 12 * 60 * 1000;
  let last = '';
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, 10_000));
    const d = await call(`/services/${service.id}/deploys/${deployId}`);
    const status = (d.deploy ?? d).status;
    if (status !== last) { console.log(`    ${status}`); last = status; }
    if (status in DONE) {
      const url = (await call(`/services/${service.id}`))?.serviceDetails?.url;
      console.log(`\n  ${DONE[status]}`);
      if (status === 'live') {
        console.log(`  주소  ${url}`);
        console.log(`  교사용  ${url}/teacher.html`);
        console.log('\n  ※ 무료 등급은 15분 조용하면 잠듭니다. 수업 몇 분 전에 한 번 열어 두세요.\n');
      } else {
        console.log(`  로그  https://dashboard.render.com/web/${service.id}/logs\n`);
        process.exitCode = 1;
      }
      return;
    }
  }
  console.log('\n  아직 배포 중입니다. 대시보드에서 이어서 보세요.');
  console.log(`  https://dashboard.render.com/web/${service.id}\n`);
}

main().catch((e) => {
  console.error(`\n  실패 — ${e.message}\n`);
  process.exit(1);
});
