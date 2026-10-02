# 이 저장소에서 일하는 에이전트에게 (Codex 등)

교실 수업용 앱이다. 선생님이 수업 시간에 실제로 쓴다. 아래 규칙은 실제로 돈이 나가고 수업이 끊긴 뒤에 만든 것이다.

## 배포 — 반드시 지킬 것

- **Render 자동 배포는 꺼져 있다.** `main`에 push해도 Render(https://chuseok-class.onrender.com)는 바뀌지 않는다.
  push할 때마다 바뀌는 것은 **GitHub Pages(정적판)** 뿐이다.
- Render에 올리는 길은 `npm run deploy:render` 하나다. 올리기 전에 `npm run deploy:check` 로 지금 올려도 되는 시간인지 본다.
- **평일 한국 시간 08:30~15:00 에는 올리지 않는다.** 스크립트도 이 시간에는 거절한다.
  `--now` 는 **사용자가 "지금 올려"라고 직접 말했을 때만** 쓴다. 거절당했다고 `--now` 로 우회하지 않는다.
- 이유: 배포하면 서버가 다시 켜져서 **열려 있던 수업방이 전부 사라지고**, 접속 중인 학생 기기가 파일을 다시 받아 대역폭 요금이 난다.
  2026-09-23 수업 시간에 배포를 15번 해서 약 $39 가 청구됐다.
- 운영 서버에 검사를 몰아치지 않는다. 시험은 로컬(`npm start` → http://127.0.0.1:8088)에서 한다.
  Render 무료 서버는 CPU 0.1 이라 한꺼번에 두드리면 상태 검사에 실패해 재시작되고 방이 사라진다.
- 수업 시간대 변경이나 Render 설정(자동 배포 등) 변경은 사용자에게 먼저 묻는다.

## 그림·음악

- 그림 **내용**(교체·재생성)은 사용자가 시킨 것만 바꾼다.
- 그림을 넣거나 바꾼 뒤에는 `python scripts/squeeze-images.py --apply` 를 한 번 돌린다. 이미 가벼운 파일은 건너뛴다.
  무거운 그림은 곧 대역폭 요금이다 (학급 하나가 그림·음악으로 약 300MB 를 받는다).
- **같은 파일 이름으로 바꿨다면** `public/js/shared/asset-url.js` 의 `ART_VERSION` 을 올린다. 이미 받아 간 기기가 새 그림을 받는다.
- Render 판의 그림·음악은 **GitHub Pages 에서 내려간다** (`server/asset-host.js`). 그림은 push 하고 Pages 배포(약 1분)가 끝나야 Render 판에서도 보인다.
  교실 PC(`npm start`)는 파일을 직접 준다.
- 그림을 `canvas` 에 그리는 코드(`public/js/shared/card.js`)는 `img.crossOrigin = 'anonymous'` 가 있어야 한다.
  없으면 그림이 Pages 에서 올 때 PNG 저장이 `SecurityError` 로 막힌다.

## 커밋

- 같은 폴더에서 다른 에이전트가 작업 중일 수 있다. `git add -A` / `git add .` 를 쓰지 말고 **자기가 바꾼 파일만** 지정해서 add 한다.
  커밋 직전에 `git diff --cached --name-only` 로 남의 작업이 섞이지 않았는지 본다.
- `.env` 에 API 키가 있다 (`LEONARDO_API_KEY`, `RENDER_API_KEY`). 읽거나 출력하거나 커밋하지 않는다.
- 작업 파일은 `.codex-*` 로 이름 짓는다 (.gitignore 에 있다).

## 구조 한눈에

- `public/` — 브라우저가 바로 읽는 ES 모듈. 빌드 단계가 없다. 수업 내용은 `public/js/data/lesson.js` 에 있다.
- `server/` — Express. 방은 `rooms.js` (메모리에만 있다), 그림 분리는 `asset-host.js`, 캐시 규칙은 `static-cache.js`.
- `scripts/` — 그림 생성·압축, 배포(`deploy-render.js`), 수업 시간 판별(`class-hours.js`).
- 자세한 것은 `README.md`.
