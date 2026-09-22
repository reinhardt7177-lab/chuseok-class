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
 * 정적 호스팅일 때만 쓰이는데, 그때는 어차피 인터넷에 연결돼 있으므로
 * 필요한 순간에만 CDN에서 받아 온다. 교실에서는 아무것도 받지 않는다.
 *
 * @returns {Promise<string|null>} data:image/png URL — 실패하면 null
 */
export async function qrDataUrl(text) {
  try {
    if (!window.QRCode) {
      await new Promise((ok, no) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js';
        s.onload = ok;
        s.onerror = no;
        document.head.append(s);
      });
    }
    return await window.QRCode.toDataURL(text, {
      width: 420,
      margin: 1,
      color: { dark: '#10131c', light: '#f6ecd2' },
    });
  } catch {
    return null;   // QR이 없어도 주소만으로 들어올 수 있다
  }
}
