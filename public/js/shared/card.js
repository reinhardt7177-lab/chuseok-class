/**
 * 학생 결과물을 그림 한 장으로 뽑는다. 패들릿에 올리라고 만든 기능이라
 * 서버를 거치지 않고 브라우저 안에서 Canvas로 그려 바로 내려받는다.
 *
 * 폭은 1080px 고정, 높이는 내용에 맞춰 860~1350px 사이에서 정해진다.
 * 패들릿 카드와 휴대폰 화면 모두에서 잘 보이는 비율.
 */

import { artUrl } from './asset-url.js';

const W = 1080;
const H_MAX = 1350;   // 4:5 — 이보다 길어지지 않는다
const H_MIN = 860;    // 내용이 적어도 카드 꼴은 갖추게

const C = {
  ink: '#10131c',
  ink2: '#1b2030',
  moon: '#f6ecd2',
  moonDim: '#a79f8c',
  gold: '#f2c96b',
  persimmon: '#e4703a',
  jade: '#4a9b78',
  line: 'rgba(246,236,210,.16)',
};

/** 웹폰트가 준비되기 전에 그리면 글자가 네모로 나온다 */
async function ready() {
  try {
    await document.fonts.load('700 64px "Gowun Batang"');
    await document.fonts.load('400 34px "Gowun Dodum"');
    await document.fonts.ready;
  } catch { /* 폰트 로딩이 막힌 환경이면 기본 글꼴로 */ }
}

const title = (px, weight = 700) => `${weight} ${px}px "Gowun Batang", serif`;
const body = (px) => `${px}px "Gowun Dodum", "Malgun Gothic", sans-serif`;

/** 글자를 폭에 맞춰 줄바꿈 — 한국어는 어절 단위로 끊는다 */
function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 배경 — 밤하늘, 보름달, 별 */
function backdrop(ctx, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0d1018');
  sky.addColorStop(.55, '#161d2e');
  sky.addColorStop(1, '#0d1018');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  /* 달무리 */
  const halo = ctx.createRadialGradient(W - 210, 210, 20, W - 210, 210, 330);
  halo.addColorStop(0, 'rgba(242,201,107,.34)');
  halo.addColorStop(1, 'rgba(242,201,107,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(W - 560, -140, 700, 700);

  /* 달 */
  const moon = ctx.createRadialGradient(W - 240, 186, 10, W - 210, 210, 118);
  moon.addColorStop(0, '#fff8e2');
  moon.addColorStop(.6, C.gold);
  moon.addColorStop(1, '#cf9a35');
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(W - 210, 210, 108, 0, Math.PI * 2);
  ctx.fill();

  /* 별 — 위치를 고정해 매번 같은 그림이 나오게 한다 */
  ctx.fillStyle = 'rgba(246,236,210,.5)';
  let seed = 7;
  for (let i = 0; i < 46; i += 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const x = (seed / 233280) * W;
    seed = (seed * 9301 + 49297) % 233280;
    const y = (seed / 233280) * (H * .62);
    seed = (seed * 9301 + 49297) % 233280;
    const r = .8 + (seed / 233280) * 1.9;
    ctx.globalAlpha = .25 + (seed / 233280) * .5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ═══════════════ 소원 엽서 ═══════════════ */

const PC = { W: 1480, H: 1000 };   // 148×100mm — 진짜 엽서 비율
let postcardArtPromise;

function postcardArt() {
  postcardArtPromise ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = artUrl('assets/img/postcard-art.jpg');
  });
  return postcardArtPromise;
}

/** 어절을 살려 줄바꿈하되, 폭보다 긴 단어만 글자 단위로 나눈다. */
function wrapPostcard(ctx, value, maxWidth) {
  const lines = [];
  for (const paragraph of String(value).replace(/\r/g, '').split('\n')) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const char of word) {
        if (line && ctx.measureText(line + char).width > maxWidth) {
          lines.push(line);
          line = '';
        }
        line += char;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** 보름달 — 달무리, 바다 자국, 방아 찧는 토끼 */
function fullMoon(ctx, cx, cy, r) {
  const halo = ctx.createRadialGradient(cx, cy, r * .6, cx, cy, r * 2.3);
  halo.addColorStop(0, 'rgba(242,201,107,.34)');
  halo.addColorStop(1, 'rgba(242,201,107,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.3, 0, Math.PI * 2);
  ctx.fill();

  const face = ctx.createRadialGradient(cx - r * .3, cy - r * .32, r * .1, cx, cy, r);
  face.addColorStop(0, '#fffaea');
  face.addColorStop(.62, C.gold);
  face.addColorStop(1, '#c9932f');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  /* 달의 바다 — 토끼가 앉을 아래쪽은 비워 두고 위쪽에만 */
  ctx.fillStyle = 'rgba(180,130,50,.15)';
  for (const [dx, dy, rr] of [[-.46, -.4, .15], [.3, -.56, .09], [.56, -.2, .11]]) {
    ctx.beginPath();
    ctx.arc(cx + r * dx, cy + r * dy, r * rr, 0, Math.PI * 2);
    ctx.fill();
  }

  /* 방아 찧는 토끼 — 오른쪽을 보고 서서 절구를 찧는다 */
  ctx.save();
  ctx.translate(cx - r * .1, cy + r * .2);
  const S = r / 150;                                 // 150 기준으로 그린 뒤 줄인다
  ctx.scale(S, S);
  const fur = 'rgba(146,98,30,.5)';
  ctx.fillStyle = fur;
  ctx.strokeStyle = fur;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.save();                                        // 귀 둘
  ctx.translate(-6, -52);
  for (const tilt of [-0.26, -0.03]) {
    ctx.save();
    ctx.rotate(tilt);
    ctx.beginPath();
    ctx.ellipse(0, -22, 7, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.translate(15, 2);
  }
  ctx.restore();

  ctx.beginPath();                                   // 머리
  ctx.arc(2, -40, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();                                   // 몸 — 아래로 갈수록 넓어지게
  ctx.ellipse(0, -4, 21, 27, .06, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 8;                                 // 앞발로 잡은 방앗공이
  ctx.beginPath();
  ctx.moveTo(10, -30);
  ctx.lineTo(44, 14);
  ctx.stroke();

  ctx.beginPath();                                   // 절구
  ctx.moveTo(30, 20);
  ctx.lineTo(66, 20);
  ctx.lineTo(58, 48);
  ctx.lineTo(38, 48);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 6;                                 // 앉은 자리
  ctx.beginPath();
  ctx.moveTo(-26, 28);
  ctx.lineTo(16, 28);
  ctx.stroke();
  ctx.restore();
}

/** 엽서 아래를 받치는 먼 산과 마을 — 빈자리를 메운다 */
function skyline(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = '#0a0d15';
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H - 128);
  ctx.quadraticCurveTo(W * .12, H - 196, W * .26, H - 142);
  ctx.quadraticCurveTo(W * .38, H - 104, W * .52, H - 160);
  ctx.quadraticCurveTo(W * .68, H - 214, W * .82, H - 148);
  ctx.quadraticCurveTo(W * .92, H - 112, W, H - 156);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  /* 능선에 달빛이 살짝 닿는다 */
  ctx.strokeStyle = 'rgba(242,201,107,.16)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** 오른쪽 위 우표 — 톱니 테두리에 작은 달 */
function stamp(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(246,236,210,.1)';
  ctx.strokeStyle = 'rgba(242,201,107,.5)';
  ctx.lineWidth = 2;

  /* 톱니 — 테두리를 따라 작은 반원을 파낸다 */
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = C.ink;
  const tooth = 11;
  for (let i = tooth; i < w; i += tooth * 2) {
    ctx.beginPath(); ctx.arc(x + i, y, tooth * .6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + i, y + h, tooth * .6, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = tooth; i < h; i += tooth * 2) {
    ctx.beginPath(); ctx.arc(x, y + i, tooth * .6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w, y + i, tooth * .6, 0, Math.PI * 2); ctx.fill();
  }

  /* 우표 속 그림 — 달과 한옥 지붕선 */
  ctx.fillStyle = 'rgba(242,201,107,.85)';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * .38, w * .2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(246,236,210,.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * .12, y + h * .72);
  ctx.lineTo(x + w * .5, y + h * .58);
  ctx.lineTo(x + w * .88, y + h * .72);
  ctx.stroke();

  ctx.fillStyle = C.gold;
  ctx.font = body(19);
  ctx.textAlign = 'center';
  ctx.fillText('한가위', x + w / 2, y + h * .9);
  ctx.textAlign = 'left';
  ctx.restore();
}

/** 낙관 — 붉은 도장 */
function seal(ctx, x, y, s, text) {
  ctx.save();
  ctx.fillStyle = '#b8352f';
  roundRect(ctx, x, y, s, s, 10);
  ctx.fill();

  ctx.fillStyle = '#fdf2e6';
  ctx.font = title(Math.round(s * .36));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.slice(0, 2), x + s / 2, y + s * .31);
  ctx.fillText(text.slice(2, 4), x + s / 2, y + s * .71);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

/**
 * 소원을 엽서 한 장으로 그린다.
 * 왼쪽은 쓰는 자리, 오른쪽은 보름달과 우표 — 진짜 엽서처럼 가운데를 점선으로 나눈다.
 *
 * @param {object} spec { kind, name, title, notes:[{label,text}], note }
 */
function paintPostcard(ctx, spec, art) {
  const { W: PW, H: PH } = PC;
  const left = 82;
  const textWidth = 710;
  const personal = spec.kind === '추석엽서';
  const heading = personal ? '달빛에 띄우는 편지'
    : spec.kind === '배움엽서' ? '오늘의 추석 이야기' : '보름달에 빈 소원';
  const notes = (spec.notes ?? []).filter((n) => n?.text);
  const blocks = personal
    ? [{ label: '', text: notes[0]?.text ?? '' }]
    : notes;

  ctx.fillStyle = '#fff7e9';
  ctx.fillRect(0, 0, PW, PH);
  if (art) ctx.drawImage(art, 0, 0, PW, PH);

  /* 인쇄 테두리와 윗머리 */
  ctx.strokeStyle = 'rgba(115,80,44,.42)';
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 25, PW - 50, PH - 50);
  ctx.strokeStyle = 'rgba(115,80,44,.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, PW - 72, PH - 72);

  ctx.fillStyle = '#aa6338';
  ctx.font = body(23);
  ctx.fillText('한가위 · 마음을 담은 엽서', left, 105);
  ctx.fillStyle = '#24364a';
  ctx.font = title(62);
  ctx.fillText(heading, left, 194, textWidth);
  ctx.fillStyle = '#c57d4e';
  ctx.fillRect(left, 222, 190, 3);

  if (personal) {
    ctx.fillStyle = '#a46238';
    ctx.font = body(23);
    ctx.fillText('받는 사람', left, 277);
    ctx.fillStyle = '#24364a';
    ctx.font = title(36);
    ctx.fillText(spec.lead ?? '', left + 118, 280, textWidth - 118);
    ctx.fillStyle = '#a46238';
    ctx.font = body(25);
    ctx.fillText(notes[0]?.label ?? '', left, 345, textWidth);
  }

  const bodyTop = personal ? 407 : 305;
  const bodyBottom = 808;
  let fontSize = 39;
  let laidOut = [];
  for (; fontSize >= 19; fontSize -= 1) {
    ctx.font = body(fontSize);
    laidOut = blocks.map((block) => ({
      label: block.label,
      lines: wrapPostcard(ctx, block.text, textWidth),
    }));
    const height = laidOut.reduce((sum, block) =>
      sum + (block.label ? 39 : 0) + block.lines.length * fontSize * 1.4 + 17, 0);
    if (height <= bodyBottom - bodyTop) break;
  }
  fontSize = Math.max(19, fontSize);
  let y = bodyTop;
  for (const block of laidOut) {
    if (block.label) {
      ctx.fillStyle = '#a46238';
      ctx.font = body(22);
      ctx.fillText(block.label, left, y);
      y += 38;
    }
    ctx.fillStyle = '#263240';
    ctx.font = body(fontSize);
    for (const line of block.lines) {
      ctx.fillText(line, left, y, textWidth);
      y += fontSize * 1.4;
    }
    y += 17;
  }

  /* 서명과 날짜 — 실제 편지처럼 본문 아래에 둔다 */
  ctx.strokeStyle = 'rgba(115,80,44,.3)';
  ctx.beginPath();
  ctx.moveTo(left, 843);
  ctx.lineTo(left + textWidth, 843);
  ctx.stroke();
  ctx.fillStyle = '#725a4d';
  ctx.font = body(23);
  ctx.fillText('보낸 사람', left, 894);
  ctx.fillStyle = '#24364a';
  ctx.font = title(34);
  ctx.fillText(spec.name ?? '', left + 120, 897, 315);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillStyle = '#725a4d';
  ctx.font = body(22);
  ctx.textAlign = 'right';
  ctx.fillText(today, left + textWidth, 894);
  ctx.textAlign = 'left';
}

/**
 * 결과 카드를 그린다.
 * 내용 길이에 따라 세로 길이가 달라지므로, 한 번 재보고(measure) 다시 그린다.
 * 그렇게 안 하면 짧은 카드에 빈 공간이 크게 남는다.
 *
 * spec.style === 'postcard' 면 세로로 늘이지 않고 엽서 한 장으로 그린다.
 *
 * @param {object} spec
 *   { kind, name, heading, subheading, emoji, big, lines[], note, chips[] }
 */
export async function drawCard(spec) {
  await ready();

  if (spec.style === 'postcard') {
    const cv = document.createElement('canvas');
    cv.width = PC.W;
    cv.height = PC.H;
    paintPostcard(cv.getContext('2d'), spec, await postcardArt());
    return cv;
  }

  const measure = document.createElement('canvas').getContext('2d');
  const contentEnd = paint(measure, H_MAX, spec, true);
  const H = Math.round(Math.min(H_MAX, Math.max(H_MIN, contentEnd + 200)));

  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  paint(cv.getContext('2d'), H, spec, false);
  return cv;
}

/**
 * 실제로 그리는 부분.
 * @param {boolean} dry true면 좌표만 계산하고 칠하지는 않는다
 * @returns {number} 본문이 끝난 y 좌표
 */
function paint(ctx, H, spec, dry) {
  if (!dry) backdrop(ctx, H);

  const PAD = 84;
  let y = 150;

  /* 머리말 */
  ctx.fillStyle = C.gold;
  ctx.font = body(28);
  if (!dry) ctx.fillText('추석 계기교육 · 한가위', PAD, y);
  y += 78;

  /* 제목 */
  ctx.fillStyle = C.moon;
  ctx.font = title(62);
  for (const line of wrap(ctx, spec.heading, W - PAD * 2 - 240)) {
    if (!dry) ctx.fillText(line, PAD, y);
    y += 74;
  }

  if (spec.subheading) {
    ctx.fillStyle = C.moonDim;
    ctx.font = body(30);
    y += 6;
    for (const line of wrap(ctx, spec.subheading, W - PAD * 2 - 200)) {
      if (!dry) ctx.fillText(line, PAD, y);
      y += 42;
    }
  }

  y += 44;

  /* 큰 글자 하나 (점수) */
  if (spec.big) {
    ctx.textAlign = 'center';
    ctx.font = title(150);
    ctx.fillStyle = C.gold;
    if (!dry) ctx.fillText(spec.big, W / 2, y + 116);
    ctx.textAlign = 'left';
    y += 186;
  }

  if (spec.emoji) {
    ctx.textAlign = 'center';
    ctx.font = '124px serif';
    if (!dry) ctx.fillText(spec.emoji, W / 2, y + 104);
    ctx.textAlign = 'left';
    y += 168;
  }

  /* 칩 — 고른 것들 */
  if (spec.chips?.length) {
    let cx = PAD;
    ctx.font = body(28);
    for (const chip of spec.chips) {
      const w = ctx.measureText(chip).width + 44;
      if (cx + w > W - PAD) { cx = PAD; y += 62; }
      if (!dry) {
        ctx.fillStyle = 'rgba(242,201,107,.14)';
        roundRect(ctx, cx, y - 34, w, 50, 25);
        ctx.fill();
        ctx.strokeStyle = 'rgba(242,201,107,.42)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = C.gold;
        ctx.fillText(chip, cx + 22, y);
      }
      cx += w + 12;
    }
    y += 76;
  }

  /* 본문 */
  if (spec.lines?.length) {
    ctx.font = body(34);
    for (const line of spec.lines) {
      if (!line) { y += 22; continue; }
      ctx.fillStyle = line.startsWith('▸') ? C.gold : C.moon;
      for (const l of wrap(ctx, line, W - PAD * 2)) {
        if (y > H_MAX - 250) break;
        if (!dry) ctx.fillText(l, PAD, y);
        y += 52;
      }
      y += 12;
    }
  }

  /* 풀이 */
  if (spec.note && y < H_MAX - 300) {
    ctx.font = body(27);
    const lines = wrap(ctx, spec.note, W - PAD * 2 - 56);
    const boxH = lines.length * 42 + 52;

    if (!dry) {
      ctx.fillStyle = 'rgba(74,155,120,.13)';
      roundRect(ctx, PAD, y - 10, W - PAD * 2, boxH, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(74,155,120,.36)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#bfe6d1';
      let ny = y + 34;
      for (const l of lines) {
        ctx.fillText(l, PAD + 28, ny);
        ny += 42;
      }
    }
    y += boxH;
  }

  const contentEnd = y;

  /* 꼬리말 — 이름과 날짜. 항상 카드 맨 아래에 붙인다 */
  if (!dry) {
    ctx.fillStyle = C.line;
    ctx.fillRect(PAD, H - 148, W - PAD * 2, 1.5);

    ctx.fillStyle = C.moon;
    ctx.font = title(38);
    ctx.fillText(spec.name ?? '', PAD, H - 88);

    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillStyle = C.moonDim;
    ctx.font = body(26);
    ctx.textAlign = 'right';
    ctx.fillText(today, W - PAD, H - 88);
    ctx.textAlign = 'left';
  }

  return contentEnd;
}

/** 카드를 그려서 바로 내려받게 한다 */
export async function saveCard(spec) {
  const cv = await drawCard(spec);
  const safeName = String(spec.name ?? '학생').replace(/[\\/:*?"<>|]/g, '');
  const file = `추석_${spec.kind ?? '활동'}_${safeName}.png`;

  return new Promise((resolve) => {
    cv.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve(file);
    }, 'image/png');
  });
}

/**
 * 결과 화면에 "그림으로 저장" 버튼을 붙인다.
 * 패들릿에 올리는 것이 목적이라 안내 문구를 같이 둔다.
 */
export function attachSaveButton(host, specFn, label = '그림으로 저장하기') {
  const box = document.createElement('div');
  box.className = 'save-card';
  box.innerHTML = `
    <button class="btn btn--gold btn--lg" type="button">🖼️ ${label}</button>
    <p>저장한 그림을 <b>패들릿</b>에 올리면 친구들과 함께 볼 수 있어요.</p>`;

  const btn = box.querySelector('button');
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = '만드는 중…';
    try {
      await saveCard(specFn());
      btn.textContent = '저장했어요 ✓';
    } catch {
      btn.textContent = '다시 시도해 주세요';
    }
    setTimeout(() => { btn.disabled = false; btn.textContent = `🖼️ ${label}`; }, 2400);
  };

  host.appendChild(box);
  return box;
}
