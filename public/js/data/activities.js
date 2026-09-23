/**
 * 학생 활동에 쓰는 자료.
 * 활동은 "해보면서 알게 되는" 것이 목적이라, 정답 뒤에 반드시 까닭을 붙였다.
 */

/* ─────────────── 어휘 카드 짝맞추기 ─────────────── */

export const WORD_CARDS = {
  low: [
    { term: '추석', gloss: '가을에 맞는 큰 명절' },
    { term: '한가위', gloss: '가을의 한가운데' },
    { term: '송편', gloss: '반달 모양 떡' },
    { term: '보름달', gloss: '가장 둥근 달' },
  ],
  mid: [
    { term: '한가위', gloss: '한(크다) + 가위(가운데)' },
    { term: '음력', gloss: '달이 차고 기우는 주기로 세는 날짜' },
    { term: '가배', gloss: '신라의 길쌈 대회이자 축제' },
    { term: '길쌈', gloss: '실을 뽑아 옷감을 짜는 일' },
    { term: '차례', gloss: '명절 아침에 지내는 간소한 제사' },
    { term: '성묘', gloss: '조상 산소를 찾아뵙는 일' },
  ],
  high: [
    { term: '천신(薦新)', gloss: '그해 첫 수확을 조상께 먼저 올리는 일' },
    { term: '가가례(家家禮)', gloss: '집집마다 다른 예법 — 정답은 하나가 아님' },
    { term: '회소곡', gloss: '가배에서 진 편 여인이 불렀다는 노래' },
    { term: '조율이시', gloss: '대추·밤·배·감 순으로 놓기' },
    { term: '어동육서', gloss: '생선은 동쪽, 고기는 서쪽' },
    { term: '선후창', gloss: '앞소리를 메기면 뒷소리를 받는 방식' },
    { term: '벌초', gloss: '산소의 풀을 베어 정리하는 일' },
    { term: '삭망 주기', gloss: '달이 차고 기우는 약 29.5일의 주기' },
  ],
};

/* ─────────────── 송편 빚기 ─────────────── */

export const SONGPYEON = {
  steps: [
    {
      id: 'dough',
      title: '반죽을 골라요',
      hint: '햅쌀가루에 무엇을 넣느냐에 따라 색이 달라져요.',
      options: [
        { id: 'white', label: '흰쌀', emoji: '⚪', color: '#f4efe4', note: '아무것도 넣지 않은 기본 흰 송편' },
        { id: 'green', label: '쑥', emoji: '🌿', color: '#9fc49a', note: '쑥을 넣으면 연둣빛이 돼요' },
        { id: 'pink', label: '오미자', emoji: '🌸', color: '#eaa8b4', note: '오미자로 분홍빛을 내요' },
        { id: 'yellow', label: '치자', emoji: '🌼', color: '#f0d98a', note: '치자로 노란빛을 내요' },
      ],
    },
    {
      id: 'filling',
      title: '소를 넣어요',
      hint: '속에 넣는 것을 "소"라고 해요.',
      options: [
        { id: 'sesame', label: '깨', emoji: '⚫', note: '꿀에 버무린 깨 — 가장 흔해요' },
        { id: 'bean', label: '콩', emoji: '🫘', note: '고소한 콩 소' },
        { id: 'chestnut', label: '밤', emoji: '🌰', note: '달콤한 밤 소' },
        { id: 'jujube', label: '대추', emoji: '🔴', note: '쫀득한 대추 소' },
      ],
    },
    {
      id: 'shape',
      title: '모양을 빚어요',
      hint: '왜 보름달이 아니라 반달일까요?',
      options: [
        { id: 'half', label: '반달', emoji: '🌗', correct: true, note: '앞으로 더 채워질 날을 바라는 뜻이에요' },
        { id: 'full', label: '보름달', emoji: '🌕', note: '보름달은 이미 다 찬 달이라 송편은 반달로 빚어요' },
        { id: 'star', label: '별', emoji: '⭐', note: '재미있지만 전통 모양은 반달이에요' },
      ],
    },
    {
      id: 'steam',
      title: '쪄요',
      hint: '찜기에 무엇을 깔까요?',
      options: [
        { id: 'pine', label: '솔잎', emoji: '🌲', correct: true, note: '솔잎 향이 배고 떡끼리 붙지 않아요' },
        { id: 'cloth', label: '면포', emoji: '🧻', note: '붙지는 않지만 솔잎 향은 안 나요' },
        { id: 'nothing', label: '그냥', emoji: '🚫', note: '떡끼리 다 붙어버려요' },
      ],
    },
  ],
};

/* ─────────────── 차례상 차리기 ─────────────── */

export const CHARYE = {
  rule: '조율이시 — 대추, 밤, 배, 감 순서로 놓습니다',
  why:
    '대추는 씨가 하나라 임금을, 밤은 세 톨이라 삼정승을, 배는 씨가 여섯이라 육조를, ' +
    '감은 여덟이라 팔도 관찰사를 뜻한다는 풀이가 전해집니다. ' +
    '다만 문헌마다 다르고 집집마다 달라서, 이것만이 정답인 것은 아니에요.',
  items: [
    { id: 'jujube',    name: '대추', emoji: '🔴', order: 1, seeds: '씨가 하나' },
    { id: 'chestnut',  name: '밤',   emoji: '🌰', order: 2, seeds: '세 톨' },
    { id: 'pear',      name: '배',   emoji: '🍐', order: 3, seeds: '씨가 여섯' },
    { id: 'persimmon', name: '감',   emoji: '🟠', order: 4, seeds: '씨가 여덟' },
  ],
  extra: {
    rule: '홍동백서 — 붉은 과일은 동쪽, 흰 과일은 서쪽',
    note: '동쪽이 오른편, 서쪽이 왼편입니다.',
  },
};

/* ─────────────── 강강술래 리듬 ─────────────── */

export const GANGGANG = {
  /** 진양조 → 중모리 → 자진모리. 실제로 점점 빨라지는 구조를 몸으로 느끼게 한다. */
  rounds: [
    { name: '진양조', bpm: 60,  beats: 8,  call: '달 떠온다 달 떠온다',   response: '강강술래' },
    { name: '중모리', bpm: 90,  beats: 12, call: '동해 동창 달 떠온다',   response: '강강술래' },
    { name: '자진모리', bpm: 140, beats: 16, call: '뛰어보세 뛰어나 보세', response: '강강술래' },
  ],
  tolerance: 260, // 박자 허용 오차(ms) — 아이들 손가락에 너무 엄격하면 재미가 없다
};

/* ─────────────── 오늘날의 추석 · 토의 ─────────────── */

export const DISCUSS = {
  low:  { prompt: '우리 집은 추석에 무엇을 하나요?', placeholder: '예) 할머니 댁에 가요' },
  mid:  { prompt: '추석에 꼭 하고 싶은 것 한 가지는?', placeholder: '예) 가족과 송편을 빚고 싶어요' },
  high: {
    prompt: '명절의 형식이 달라지는 것을 어떻게 생각하나요?',
    placeholder: '내 생각과 그렇게 생각한 까닭을 함께 적어 보세요',
  },
};

/* ─────────────── 소원 ─────────────── */

/**
 * 추석 엽서 쓰기 — 수업을 닫는 활동.
 *
 * 소원 적기가 "내가 바라는 것"이라면, 엽서는 "남에게 건네는 말"이다.
 * 받을 사람을 먼저 고르게 하면 무엇을 쓸지가 훨씬 쉬워진다.
 */
export const POSTCARD = {
  toWhom: [
    { id: 'family',   icon: '👨‍👩‍👧', label: '가족에게',      hint: '고마웠던 일 한 가지를 떠올려 보세요' },
    { id: 'friend',   icon: '🙋',      label: '친구에게',      hint: '같이 있어 좋았던 때를 적어 보세요' },
    { id: 'teacher',  icon: '🍎',      label: '선생님께',      hint: '올해 배운 것 중 기억에 남는 것을' },
    { id: 'future',   icon: '🌱',      label: '내년의 나에게', hint: '한 해 뒤의 나에게 남기는 말' },
    { id: 'ancestor', icon: '🕯️',      label: '조상님께',      hint: '오늘 배운 것을 떠올리며' },
  ],
  greetings: [
    '더도 말고 덜도 말고 한가위만 같아라',
    '풍성한 한가위 되세요',
    '보름달처럼 환한 날 되세요',
    '올 추석도 건강하세요',
  ],
  maxLen: 120,
};

export const WISH = {
  prompts: [
    { id: 'me', label: '나를 위한 소원', emoji: '🙋', placeholder: '내가 바라는 것을 적어요' },
    { id: 'us', label: '우리 모두를 위한 소원', emoji: '🤝', placeholder: '우리 반, 우리 가족, 우리 모두를 위해' },
  ],
};
