/**
 * 그림·음악을 Render 밖(GitHub Pages)에서 내려받게 한다.
 *
 * 왜
 *   학급 하나가 그림·음악으로 약 383MB를 받는다. Render는 월 5GB를 넘으면 GB당 $0.15라서,
 *   2026-09-23(추석 연휴 전 마지막 수업일)에 전국 학급이 한꺼번에 쓰자 264GB, 약 $39가 청구됐다.
 *   그림은 이미 GitHub Pages에 같은 주소로 올라가 있다(.github/workflows/pages.yml). 거기는 무료다.
 *
 * 어떻게
 *   /assets/... 요청이 오면 Pages의 같은 경로로 302를 돌려보낸다. 화면 코드는 바뀌지 않는다.
 *   입장 코드·명단·퀴즈 같은 실시간 기능은 계속 이 서버가 맡는다.
 *
 * 켜지는 때
 *   · Render에서는 기본으로 켜진다 (Render가 넣어 주는 RENDER 환경변수로 알아본다).
 *   · 교실 PC(npm start)에서는 꺼져 있다 — 같은 와이파이 안에서 직접 주는 쪽이 빠르다.
 *   · ASSET_BASE=https://… 로 다른 곳을 가리킬 수 있다(예: Cloudflare Pages). ASSET_BASE= (빈 값)이면 끈다.
 *
 * 안 열릴 때를 위해 길이 두 개 있다. Pages가 막히면 그림이 모두 깨지기 때문이다.
 *   1) 이 서버가 Pages를 들여다본다. 안 열리면 그동안은 직접 내보낸다.
 *      Render 대역폭이 다시 들지만 수업이 끊기는 것보단 낫다.
 *   2) 화면도 그림이 안 뜨면 같은 주소에 ?local=1을 붙여 한 번 다시 받는다(js/shared/asset-fallback.js).
 *      ?local= 이 붙은 요청은 돌려보내지 않고 직접 준다.
 *      학교 망이 github.io를 막았거나 Pages가 한 기기에 429를 줄 때, 파일이 아직 Pages에 없을 때도 이렇게 넘어간다.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';

const PAGES = 'https://reinhardt7177-lab.github.io/chuseok-class';
const WHEN_UP = 2 * 60e3;       // Pages가 열려 있을 땐 2분마다 본다
const WHEN_DOWN = 30e3;         // 닫혀 있을 땐 30초마다 — 돌아오면 빨리 알아야 한다
const TIMEOUT = 4000;
const REDIRECT_AGE = 600;       // 브라우저가 이 돌려보내기를 기억하는 시간(초). Pages 자신의 max-age와 같다.
const SAFE = /^\/assets\/[A-Za-z0-9._\-/]+$/;

/** 어디서 내려받게 할까. 빈 문자열이면 이 서버가 직접 준다. */
export function assetBase(env = process.env) {
  const raw = env.ASSET_BASE !== undefined ? env.ASSET_BASE : (env.RENDER ? PAGES : '');
  return String(raw).trim().replace(/\/+$/, '');
}

/** 건강 확인에 쓸 그림 몇 개 — 실제로 있는 파일에서 고른다. 이름을 못 박아 두면 그림이 바뀔 때 깨진다. */
function probePaths(publicDir) {
  try {
    return readdirSync(path.join(publicDir, 'assets', 'img'))
      .filter((f) => /\.jpe?g$/i.test(f))
      .sort()
      .slice(0, 3)
      .map((f) => `/assets/img/${f}`);
  } catch {
    return [];
  }
}

export function assetHost({ publicDir, env = process.env, log = console.log, every = {} } = {}) {
  const base = assetBase(env);
  const pass = (req, res, next) => next();
  if (!base) return pass;

  let baseHost;
  try {
    const u = new URL(base);
    if (!/^https?:$/.test(u.protocol)) throw new Error('http(s)가 아님');
    baseHost = u.host.toLowerCase();
  } catch {
    log(`  ⚠️  ASSET_BASE 가 주소가 아니어서 쓰지 않습니다 — ${base}`);
    return pass;
  }

  const paths = publicDir ? probePaths(publicDir) : [];
  let up = true;                 // 처음엔 열려 있다고 보고 시작한다. 첫 확인은 바로 이어서 한다.

  async function reachable() {
    for (const p of paths) {
      try {
        const res = await fetch(base + p, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT) });
        if (res.status === 200) return true;
      } catch { /* 안 열림 — 다음 그림으로 */ }
    }
    return paths.length === 0;   // 볼 그림이 없으면 판단할 수 없으니 그대로 둔다
  }

  async function watch() {
    try {
      const ok = await reachable();
      if (ok !== up) {
        up = ok;
        log(ok
          ? '  📦 그림·음악 — 다시 GitHub Pages에서 내려받습니다'
          : '  ⚠️  그림·음악을 받아 오는 곳이 응답하지 않습니다 — 이 서버가 직접 내보냅니다 (대역폭이 듭니다)');
      }
    } catch { /* 확인하다 넘어져도 감시는 이어간다 */ }
    setTimeout(watch, up ? (every.up ?? WHEN_UP) : (every.down ?? WHEN_DOWN)).unref();
  }
  watch();
  log(`  📦 그림·음악은 ${base} 에서 내려받습니다`);

  return function redirectAssets(req, res, next) {
    if (!up) return next();
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!req.path.startsWith('/assets/')) return next();
    if (req.query.local !== undefined) return next();        // 화면이 "여기서 직접 줘"라고 한 요청
    if (!SAFE.test(req.path) || req.path.includes('..')) return next();

    const host = String(req.get('x-forwarded-host') ?? req.get('host') ?? '').split(',')[0].trim().toLowerCase();
    if (host === baseHost) return next();                    // 자기 자신으로 돌려보내 무한히 돌지 않게

    res.set('Cache-Control', `public, max-age=${REDIRECT_AGE}`);
    res.redirect(302, base + req.originalUrl);
  };
}
