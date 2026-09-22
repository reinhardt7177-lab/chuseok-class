/**
 * 유튜브 후보 영상이 (1) 살아있는지 (2) 임베드가 허용되는지 확인한다.
 * 수업 중 "동영상을 재생할 수 없음"이 뜨는 사고를 막기 위한 사전 점검.
 *   node scripts/check-videos.js
 */
import { VIDEO_CANDIDATES } from './video-candidates.js';

const results = [];

for (const v of VIDEO_CANDIDATES) {
  const r = { ...v, alive: false, embeddable: false, title: null, author: null, note: '' };

  // 1) 존재 여부 — oEmbed는 비공개/삭제 영상에 4xx를 준다
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v.id}&format=json`,
    );
    if (res.ok) {
      const j = await res.json();
      r.alive = true;
      r.title = j.title;
      r.author = j.author_name;
    } else {
      r.note = `oEmbed ${res.status}`;
    }
  } catch (err) {
    r.note = `oEmbed 실패: ${err.message}`;
  }

  // 2) 임베드 허용 여부 — watch 페이지의 playableInEmbed 플래그
  if (r.alive) {
    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${v.id}`, {
        headers: { 'accept-language': 'ko-KR,ko;q=0.9', 'user-agent': 'Mozilla/5.0' },
      });
      const html = await res.text();
      const m = html.match(/"playableInEmbed":(true|false)/);
      r.embeddable = m ? m[1] === 'true' : null;
      if (m === null) r.note += ' (플래그 못 찾음)';
    } catch (err) {
      r.note += ` embed확인실패: ${err.message}`;
    }
  }

  results.push(r);
  const mark = !r.alive ? '❌ 없음' : r.embeddable === false ? '⛔ 임베드불가' : r.embeddable === null ? '❔ 불명' : '✅';
  console.log(`${mark}  ${v.id}  ${(r.title ?? v.label).slice(0, 52)}`);
  if (r.author) console.log(`        └ ${r.author}${r.note ? '  ' + r.note : ''}`);
}

const ok = results.filter((r) => r.alive && r.embeddable !== false);
console.log(`\n  사용 가능 ${ok.length} / 전체 ${results.length}\n`);

const bad = results.filter((r) => !r.alive || r.embeddable === false);
if (bad.length) {
  console.log('  제외해야 할 것:');
  bad.forEach((b) => console.log(`    • ${b.id} ${b.label} — ${!b.alive ? '영상 없음' : '임베드 차단'}`));
  console.log('');
}
