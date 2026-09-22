/**
 * 교실 서버가 있는지 한 번만 확인한다.
 *
 * 이 앱은 두 가지 방식으로 돌아간다.
 *   1. 교실 PC에서 `npm start` — 실시간 명단, 라이브 퀴즈, 입장 코드가 모두 된다.
 *   2. GitHub Pages 같은 정적 호스팅 — 수업 진행과 혼자 학습만 된다.
 *
 * 둘을 화면에서 갈라 주려면 서버가 있는지 먼저 알아야 한다.
 */

let asked = null;

/**
 * @returns {Promise<boolean>} 교실 서버가 응답하면 true
 *
 * 한 번 물어보고 끝내면 안 된다. 그 한 번이 하필 흔들리면 서버가 멀쩡히
 * 있는데도 "서버 없음"으로 굳어져, 선생님 화면에 입장 코드 대신
 * 혼자 학습 안내가 뜬다. 잠들었다 깨는 무료 호스팅에서 특히 잘 난다.
 * 그래서 대답이 없을 때만 몇 번 더 물어본다.
 */
export function hasServer() {
  asked ??= probe();
  return asked;
}

async function probe() {
  for (const wait of [0, 700, 1800]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      const stop = AbortController ? new AbortController() : null;
      const timer = setTimeout(() => stop?.abort(), 5000);
      const res = await fetch('api/connect', { signal: stop?.signal });
      clearTimeout(timer);
      /* 404는 "여기 서버 없음"이라는 분명한 대답이므로 더 묻지 않는다 */
      if (res.ok) return true;
      if (res.status === 404) return false;
    } catch { /* 대답이 없었을 뿐이다 — 다시 물어본다 */ }
  }
  return false;
}

/**
 * QR을 만든다.
 *
 * 교실 서버가 있을 때는 서버가 만들어 준 것을 쓰므로 이 길로 오지 않는다.
 * 정적 호스팅일 때만 쓰인다.
 *
 * 그리는 라이브러리는 js/vendor/ 에 같이 넣어 두었다. CDN에서 받아 오게 했더니
 * 주소가 바뀌어 QR 자리가 깨진 그림으로 남은 적이 있고, 무엇보다 교실에서
 * 인터넷이 끊기면 못 받는다.
 *
 * @returns {Promise<string|null>} data URL — 실패하면 null
 */
export async function qrDataUrl(text) {
  try {
    if (!window.qrcode) {
      await new Promise((ok, no) => {
        const s = document.createElement('script');
        s.src = new URL('js/vendor/qrcode-generator.js', baseHref()).href;
        s.onload = ok;
        s.onerror = no;
        document.head.append(s);
      });
    }
    const qr = window.qrcode(0, 'M');    // 0 = 내용에 맞춰 크기 자동
    qr.addData(text);
    qr.make();
    return qr.createDataURL(8, 2);       // 칸 8px, 여백 2칸
  } catch {
    return null;   // QR이 없어도 주소만 보고 들어올 수 있다
  }
}

/** teacher.html 이든 student.html 이든 같은 폴더를 가리키게 */
function baseHref() {
  return location.href.replace(/[^/]*$/, '');
}
