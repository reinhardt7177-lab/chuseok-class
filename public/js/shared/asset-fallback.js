/**
 * 그림이 안 뜨면 한 번만 이 서버에서 직접 받아 본다.
 *
 * Render에 올라간 판은 그림·음악을 GitHub Pages로 돌려보낸다(server/asset-host.js).
 * 그런데 학교 망이 github.io를 막았거나, Pages가 한 기기에 요청을 너무 많이 받았다며 거절하거나,
 * 그림이 아직 Pages에 올라오지 않았으면 그림이 깨진다. 그럴 때 같은 주소에 local=1을 붙여
 * 다시 요청하면 서버가 돌려보내지 않고 직접 준다. 한 번만 한다 — 그래도 안 되면 정말 없는 파일이다.
 *
 * 맨 앞에서 돌아야 해서 module이 아니라 일반 스크립트이고, error 이벤트는 거품이 일지 않아
 * capture로 받는다. 그림 태그에만 건다 — 음악은 bgm.js가, 엽서 바탕은 card.js가 따로 한다.
 */
(function () {
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (!el || el.tagName !== 'IMG') return;
    var src = el.getAttribute('src');
    if (!src || src.indexOf('assets/') === -1 || /[?&]local=/.test(src)) return;
    el.setAttribute('src', src + (src.indexOf('?') === -1 ? '?' : '&') + 'local=1');
  }, true);
})();
