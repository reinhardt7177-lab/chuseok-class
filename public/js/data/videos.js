/**
 * 수업에 붙일 유튜브 영상.
 * 2026-09-22 기준 전부 재생·임베드 가능 확인 (scripts/check-videos.js)
 *
 * bands  = 이 영상을 권하는 학년대
 * pick   = 해당 학년대의 기본 추천 1편 (교사가 화면에서 바꿀 수 있음)
 * start  = 재생 시작 지점(초). 긴 영상에서 핵심만 보여줄 때 사용
 * note   = 교사에게 주는 한 줄 안내
 */

export const VIDEOS = [
  /* ── 2. 추석은 어떤 날일까 ── */
  {
    id: 'Qh8NlsyhMxo', section: 'what-is', bands: ['low'], pick: ['low'],
    title: '추석에는 무엇을 할까요?', channel: '키드키즈넷',
    seconds: 183, note: '풍습과 음식을 한 번에 훑습니다. 저학년 도입용.',
  },
  {
    id: 'j69ES2_TzJ8', section: 'what-is', bands: ['mid', 'high'], pick: ['mid'],
    title: '[에듀박스] 추석 알아보기', channel: '참쌤스쿨',
    seconds: 203, note: '교사가 만든 자료라 군더더기가 없습니다.',
  },
  {
    id: '1cWr1ZZ5T5k', section: 'what-is', bands: ['mid', 'high'], pick: ['high'],
    title: '추석 계기교육', channel: '초등백과',
    seconds: 246, note: '유래부터 오늘날까지 차분하게 정리.',
  },
  {
    id: 'XNesAWl2eSg', section: 'what-is', bands: ['low', 'mid'],
    title: '우리나라 명절 알아보기', channel: '킴더가르텐',
    seconds: 185, note: '설날과 견주며 볼 때 좋습니다.',
  },

  /* ── 3. 유래 ── */
  {
    id: '1cWr1ZZ5T5k', section: 'origin', bands: ['mid', 'high'], pick: ['mid', 'high'],
    key: 'origin-1cWr', title: '추석 계기교육 — 유래 부분', channel: '초등백과',
    seconds: 246, note: '가배 이야기가 나오는 앞부분만 보여줘도 충분합니다.',
  },

  /* ── 4. 음식 ── */
  {
    id: 'cF1crz_i2dc', section: 'food', bands: ['low'], pick: ['low'],
    title: '한가위 송편', channel: '깨비키즈',
    seconds: 411, note: '송편 만드는 과정을 천천히 보여줍니다.',
  },
  {
    id: 'yCNLRL4jz0c', section: 'food', bands: ['low', 'mid'], pick: ['mid'],
    title: '추석 송편 만들기', channel: '지니키즈',
    seconds: 370, note: '요리 놀이 형식이라 몰입이 잘 됩니다.',
  },
  {
    id: '-g47TZsBELc', section: 'food', bands: ['mid', 'high'], pick: ['high'],
    title: '교실에서 송편만들기', channel: 'The-K한국교직원공제회',
    seconds: 160, note: '실제 교실 실습 장면. 직접 만들 계획이면 이것부터.',
  },
  {
    id: 'rPyOc5rl2YU', section: 'food', bands: ['low', 'mid'],
    title: '써니와 함께하는 송편만들기', channel: '아이꿈터TV',
    seconds: 271, note: '따라 하기 쉬운 설명.',
  },

  /* ── 5. 풍습 ── */
  {
    id: 'acFuYAB_CqU', section: 'customs', bands: ['mid', 'high'], pick: ['mid'],
    title: '성균관이 발표한 모범 차례상', channel: 'KBS News',
    seconds: 130, note: '"정답은 하나가 아니다"를 짚어주기 좋은 뉴스.',
  },
  {
    id: 'H29eBK6e34w', section: 'customs', bands: ['high'], pick: ['high'],
    title: '성균관이 짚어주는 요즘 차례상', channel: 'JTBC News',
    seconds: 122, note: '전통이 바뀌는 과정을 토의 소재로 쓸 수 있습니다.',
  },
  {
    id: 'tFHkvfYFuOo', section: 'customs', bands: ['high'],
    title: '차례상에 전 안 올려도 됩니다', channel: 'SBS 뉴스',
    seconds: 155, note: '형식과 마음 중 무엇이 먼저인지 토론 붙이기.',
  },

  /* ── 6. 놀이 ── */
  {
    id: '6MiibRcbRk4', section: 'play', bands: ['low'], pick: ['low'],
    title: '추석에 전통놀이해요 — 8가지 전래놀이', channel: '까꿍구름이',
    seconds: 156, note: '노래로 여러 놀이를 한 번에. 따라 부르기 좋습니다.',
  },
  {
    id: 'zjg757sy8k8', section: 'play', bands: ['low', 'mid'], pick: ['mid'],
    title: '어린이를 위한 국악 — 강강술래', channel: '국립국악원',
    seconds: 395, note: '국립국악원 제작. 메기고 받는 소리가 잘 들립니다.',
  },
  {
    id: 'nF14Q18CqXI', section: 'play', bands: ['high'], pick: ['high'],
    title: '유네스코 인류무형문화유산 「강강술래」', channel: '국립국악원',
    seconds: 746, start: 0, note: '12분으로 깁니다. 앞 3분만 보여줘도 충분해요.',
  },
  {
    id: '_kBk4bs0NDg', section: 'play', bands: ['high'],
    title: '국립국악원 무용단 「강강술래」', channel: '국립국악원',
    seconds: 888, note: '공연 전막. 원의 대형이 바뀌는 장면을 짚어주면 좋습니다.',
  },
  {
    id: 'd7JIfIMQy4s', section: 'play', bands: ['mid', 'high'],
    title: '선생님과 함께하는 민속놀이', channel: '크는나무',
    seconds: 304, note: '씨름·줄다리기·제기차기 등 실제 놀이법.',
  },

  /* ── 7. 소원 ── */
  {
    id: 'e_aOcXw9vOI', section: 'wish', bands: ['low'], pick: ['low'],
    title: '한가위 달토끼와 소망떡', channel: '담이목장',
    seconds: 379, note: '추석의 의미를 이야기로 풀어줍니다.',
  },
  {
    id: 'MEpoat1ifGQ', section: 'wish', bands: ['low', 'mid'], pick: ['mid'],
    title: '떡방아 찧는 옥토끼', channel: '키바조이',
    seconds: 167, note: '달토끼 전설. 짧아서 붙이기 좋습니다.',
  },
  {
    id: 'yEOYYfGtlpE', section: 'wish', bands: ['mid', 'high'], pick: ['high'],
    title: '달나라 옥토끼와 신선', channel: '은구슬 TV',
    seconds: 413, note: '전래동화 원형에 가까운 판본.',
  },
];

/** 같은 영상이 여러 장면에 쓰일 수 있어 key로 구분한다 */
export const videoKey = (v) => v.key ?? `${v.section}-${v.id}`;

/** 특정 장면 + 학년대에서 볼 수 있는 영상 목록 */
export function videosFor(sectionId, band) {
  return VIDEOS.filter((v) => v.section === sectionId && v.bands.includes(band));
}

/** 그중 기본으로 띄울 한 편 */
export function defaultVideo(sectionId, band) {
  const list = videosFor(sectionId, band);
  return list.find((v) => v.pick?.includes(band)) ?? list[0] ?? null;
}

/** 초 → "6분 35초" */
export function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}분 ${s}초` : `${m}분`;
}

/** 교실 환경을 고려한 임베드 URL — 관련영상 최소화, 자동재생 없음 */
export function embedUrl(video, { autoplay = false } = {}) {
  const params = new URLSearchParams({
    rel: '0',            // 다른 채널 관련영상 숨기기
    modestbranding: '1',
    playsinline: '1',
    cc_lang_pref: 'ko',
    hl: 'ko',
  });
  if (video.start) params.set('start', String(video.start));
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${video.id}?${params}`;
}

/** 임베드가 막혔을 때 새 창으로 열 주소 */
export function watchUrl(video) {
  const t = video.start ? `&t=${video.start}` : '';
  return `https://www.youtube.com/watch?v=${video.id}${t}`;
}
