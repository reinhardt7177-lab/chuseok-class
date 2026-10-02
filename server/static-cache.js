/**
 * 정적 파일의 캐시 규칙 — express.static 에 넘길 옵션을 만든다.
 *
 * 왜 기본값을 못 쓰나
 *   Express의 기본 ETag는 "파일 크기 + 수정 시각"이다. Render는 배포할 때마다 저장소를
 *   새로 받아 오므로 수정 시각이 전부 바뀌고, 그림 하나 안 바뀌었어도 접속 중이던
 *   브라우저가 모든 파일을 처음부터 다시 내려받는다.
 *   2026-09-23 수업 시간에 배포가 15번 있었고, 그날 이 서버가 내보낸 데이터가 238GB였다.
 *
 * 그래서
 *   · ETag를 파일 '내용'으로 만든다. 같은 파일이면 배포를 몇 번 해도 같은 ETag라서
 *     브라우저는 304(본문 없음)만 받는다.
 *   · Last-Modified는 끈다. 브라우저가 If-Modified-Since까지 같이 보내면, Express는
 *     Last-Modified가 없을 때 "바뀌었다"고 판정해 304를 못 준다. 둘 중 하나로 통일해야 한다.
 *   · 그림·음악은 한동안 묻지도 않게 한다(max-age). 화면 쪽은 artUrl()로 ?v=를 붙이므로
 *     그림을 바꾸면 ART_VERSION만 올리면 된다. 교실 PC에서는 0 — 그림을 고치면 곧바로 보여야 한다.
 *   · HTML·JS·CSS는 매번 묻는다(no-cache). 작아서 304면 충분하고, 고친 즉시 반영된다.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const MEDIA = /\.(jpe?g|png|webp|gif|svg|ico|mp3|m4a|ogg|woff2?)$/i;

/** 파일 경로 → { 크기+시각, 내용 지문 }. 같은 파일을 다시 읽지 않기 위한 기억이다. */
const tags = new Map();

/** 내용이 같으면 언제나 같은 ETag */
function contentTag(file, stat) {
  const sig = `${stat.size}:${stat.mtimeMs}`;
  const hit = tags.get(file);
  if (hit?.sig === sig) return hit.tag;
  const tag = `"${createHash('sha1').update(readFileSync(file)).digest('base64url')}"`;
  tags.set(file, { sig, tag });
  return tag;
}

/**
 * 그림·음악을 브라우저가 묻지 않고 쓰는 시간(초).
 * ASSET_MAX_AGE 로 정한다. 정하지 않으면 Render에서만 1시간, 교실 PC는 0(매번 확인).
 */
export function mediaMaxAge(env = process.env) {
  if (env.ASSET_MAX_AGE !== undefined && env.ASSET_MAX_AGE !== '') {
    const n = Number(env.ASSET_MAX_AGE);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return env.RENDER ? 3600 : 0;
}

export function staticOptions({ maxAge = mediaMaxAge() } = {}) {
  return {
    etag: false,
    lastModified: false,
    setHeaders(res, file, stat) {
      res.setHeader('ETag', contentTag(file, stat));
      res.setHeader(
        'Cache-Control',
        MEDIA.test(file) && maxAge > 0 ? `public, max-age=${maxAge}` : 'no-cache',
      );
    },
  };
}
