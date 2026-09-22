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

/** @returns {Promise<boolean>} 교실 서버가 응답하면 true */
export function hasServer() {
  asked ??= fetch('api/connect', { method: 'GET' })
    .then((r) => r.ok)
    .catch(() => false);
  return asked;
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
