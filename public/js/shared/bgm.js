/**
 * 배경음악 — 「보름달이 뜨는 날」.
 *
 * 선생님 화면과 오프닝에서만 튼다. 학생 기기 서른 대가 한꺼번에 울리면 수업이 안 된다.
 *
 * 브라우저는 손대기 전에는 소리를 못 틀게 막는다(자동재생 정책).
 * 그래서 켜 두었어도 첫 클릭이나 키 입력에 맞춰 비로소 시작한다 — 학년을 고르는 그 클릭이면 된다.
 * 영상 컷에서는 쉰다. 유튜브 소리 위에 음악이 겹치면 둘 다 안 들린다.
 */

const KEY = 'chuseok.bgm';      // 'on' | 'off' — 선생님이 끈 것은 다음 수업에도 기억한다

let audio = null;
let wanted = true;              // 선생님이 켜 두었나
let held = false;               // 영상 때문에 잠깐 쉬는 중인가
const buttons = [];

/**
 * 단추를 붙이고 음악을 준비한다. 한 화면에서 여러 번 불러도 소리는 하나다.
 * @param {Element} host      단추를 넣을 곳
 * @param {object}  [opts]    { before: 이 요소 앞에 끼움, src, volume }
 */
export function mountBgm(host, { before = null, src = 'assets/audio/bgm.mp3', volume = 0.28 } = {}) {
  if (!host) return null;

  if (!audio) {
    audio = document.createElement('audio');
    audio.src = src;
    audio.loop = true;
    audio.volume = volume;
    /* 4.3MB다. 선생님이 처음 누르기 전까지는 한 바이트도 받지 않는다 —
       어차피 첫 클릭 전에는 틀 수 없고, 그 사이 그림 받을 길을 막을 뿐이다. */
    audio.preload = 'none';
    audio.setAttribute('aria-hidden', 'true');
    audio.hidden = true;
    document.body.append(audio);

    try { wanted = localStorage.getItem(KEY) !== 'off'; } catch { /* 사생활 보호 창 */ }

    /* 첫 손짓에 시작. 한 번 시작되면 그 뒤로는 이 리스너가 할 일이 없다. */
    const kick = () => { if (wanted && !held && audio.paused) play(); };
    document.addEventListener('pointerdown', kick, { capture: true });
    document.addEventListener('keydown', kick, { capture: true });
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bgm';
  btn.title = '배경음악 켜고 끄기';
  btn.onclick = () => {
    wanted = !wanted;
    try { localStorage.setItem(KEY, wanted ? 'on' : 'off'); } catch { /* 무시 */ }
    if (wanted && !held) play(); else audio.pause();
    paint();
  };
  buttons.push(btn);
  if (before && before.parentNode === host) host.insertBefore(btn, before);
  else host.append(btn);
  paint();
  return btn;
}

/** 영상처럼 다른 소리가 나는 동안 잠깐 쉰다. 끝나면 켜 두었던 대로 돌아온다. */
export function holdBgm(on) {
  held = !!on;
  if (!audio) return;
  if (held) audio.pause();
  else if (wanted) play();
}

function play() {
  audio.play().catch(() => { /* 아직 손대기 전이면 브라우저가 막는다 — 다음 손짓에 다시 */ });
}

function paint() {
  for (const b of buttons) {
    b.textContent = wanted ? '♪ 배경음악 켬' : '♪ 배경음악 끔';
    b.setAttribute('aria-pressed', String(wanted));
  }
}
