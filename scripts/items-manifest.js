/**
 * 활동에 올려놓을 낱개 그림 목록.
 * 생성 → 배경 제거 → 투명 PNG (scripts/generate-items.js 가 실행)
 *
 * 배경 제거가 장당 약 70크레딧으로 비싸다. 꼭 필요한 것만 넣는다.
 */

/* ─────────────── 차례상 · 맨 앞줄(5열) 과일과 과자 ───────────────
   이 줄에 규칙이 가장 분명하게 걸린다.
     조율이시 — 대추·밤·배·감 순서
     홍동백서 — 붉은 것은 동쪽(오른쪽), 흰 것은 서쪽(왼쪽)
   문헌마다 다르고 집안마다 다르므로, 활동에서도 그 점을 함께 알려준다. */
const FRUIT_ROW = [
  ['jujube',    '대추', 1, 'red',   'a neat stack of glossy deep red Korean jujubes'],
  ['chestnut',  '밤',   2, 'white', 'a neat stack of peeled pale yellow chestnuts'],
  ['pear',      '배',   3, 'white', 'two large round golden Korean asian pears stacked'],
  ['persimmon', '감',   4, 'red',   'a neat stack of glossy orange persimmons'],
  ['apple',     '사과', 5, 'red',   'a neat stack of deep red apples'],
  ['dried-persimmon', '곶감', 6, 'red', 'a neat row of flattened amber dried persimmons'],
  ['yakgwa',    '약과', 7, 'white', 'a neat stack of golden brown Korean honey pastry rounds'],
  ['dasik',     '다식', 8, 'white', 'a neat row of small pale pressed Korean tea cakes with flower patterns'],
];

/* ─────────────── 차례상 · 뒤쪽 네 줄 ───────────────
   1열 밥·국·잔  2열 적·전  3열 탕  4열 포·나물·김치·식혜
   지금은 활동 대상이 아니라 "상이 어떻게 생겼는지" 보여주는 용도다. */
const BACK_ROWS = [
  ['rice',    '메(밥)', 1, 'a mounded bowl of white steamed rice with a lid beside it, in a brass ritual bowl'],
  ['soup',    '갱(국)', 1, 'a clear beef and radish soup in a brass ritual bowl with a lid beside it'],
  ['cup',     '술잔',   1, 'a small brass ritual wine cup on a footed stand, empty'],
  ['jeok',    '적',     2, 'a stack of grilled beef skewers neatly arranged on a brass ritual dish'],
  ['jeon',    '전',     2, 'a neat stack of golden pan fried Korean savory pancakes on a brass ritual dish'],
  ['fish',    '어적',   2, 'one whole grilled croaker fish laid flat on a brass ritual dish, head to the side'],
  ['tang',     '소탕', 3, 'a clear soup with cubed white tofu and green vegetables in a tall brass ritual bowl'],
  ['tang-yuk', '육탕', 3, 'a rich clear beef soup with sliced beef and radish in a tall brass ritual bowl'],
  ['tang-eo',  '어탕', 3, 'a clear fish soup with white fish pieces and scallion in a tall brass ritual bowl'],
  ['po',      '포',     4, 'a neat stack of dried seasoned beef jerky slices on a brass ritual dish'],
  ['namul',   '나물',   4, 'three small heaps of seasoned vegetables in green, white and brown on one brass ritual dish'],
  ['kimchi',  '침채',   4, 'white water kimchi with radish slices in a shallow brass ritual bowl'],
  ['sikhye',  '식혜',   4, 'sweet rice punch with floating rice grains in a brass ritual bowl'],
];

/* ─────────────── 송편 빚기 ─────────────── */
const SONGPYEON = [
  ['white',  '흰쌀',  'plain white rice dough, pale ivory'],
  ['green',  '쑥',    'mugwort dough, soft sage green'],
  ['pink',   '오미자', 'omija berry dough, gentle rose pink'],
  ['yellow', '치자',  'gardenia dough, warm pale yellow'],
];

/* ─────────────── 강강술래 무용수 (이미 생성됨) ─────────────── */
const DANCERS = [
  ['red', 'a deep red high-waisted bell-shaped chima and a short white jeogori'],
  ['blue', 'a navy blue high-waisted bell-shaped chima and a short white jeogori'],
  ['green', 'a jade green high-waisted bell-shaped chima and a short cream jeogori'],
  ['yellow', 'a golden yellow high-waisted bell-shaped chima and a short white jeogori'],
  ['purple', 'a soft purple high-waisted bell-shaped chima and a short white jeogori'],
  ['orange', 'a persimmon orange high-waisted bell-shaped chima and a short cream jeogori'],
];

export const ITEMS = [
  /* 차례상 과일 — 놋제기(굽 달린 놋그릇)에 담아 정면에서 */
  ...FRUIT_ROW.map(([id, name, order, hue, what]) => ({
    id: `dish-${id}`,
    name,
    group: 'charye',
    order,
    hue,                       // red = 홍(동쪽) / white = 백(서쪽)
    prompt:
      `${what} on a shallow brass footed ritual dish, seen straight from the front at eye level, ` +
      'the dish and food together as one neat object',
  })),

  /* 차례상 뒤쪽 네 줄 — 상 전체 모습을 보여주기 위한 것 */
  ...BACK_ROWS.map(([id, name, row, what]) => ({
    id: `dish-${id}`,
    name,
    group: 'charye-back',
    row,
    prompt: `${what}, seen straight from the front at eye level, the dish and food together as one neat object`,
  })),

  /* 송편 — 고른 반죽 색이 그대로 보이게 */
  ...SONGPYEON.map(([id, name, tint]) => ({
    id: `songpyeon-${id}`,
    name: `송편 ${name}`,
    group: 'songpyeon',
    prompt:
      `a single half moon shaped Korean songpyeon rice cake made of ${tint}, ` +
      'plump and smooth with a neat crimped seam along the straight edge, ' +
      'resting on two green pine needles, seen from the front at a slight angle, one cake only',
  })),
  {
    id: 'songpyeon-full', name: '송편 보름달', group: 'songpyeon',
    prompt: 'a single round ball shaped white Korean rice cake, plump and smooth, '
          + 'resting on two green pine needles, seen from the front, one cake only',
  },
  {
    id: 'songpyeon-star', name: '송편 별', group: 'songpyeon',
    prompt: 'a single playful star shaped white Korean rice cake with five soft rounded points, '
          + 'resting on two green pine needles, seen from the front, one cake only',
  },

  /* 무용수 */
  ...DANCERS.map(([id, wear]) => ({
    id: `dancer-${id}`,
    name: `무용수 ${id}`,
    group: 'dancer',
    portrait: true,
    prompt:
      `a single full body Korean girl in hanbok with ${wear}, standing upright facing the viewer, ` +
      'the jeogori has a white dongjeong collar and a long goreum ribbon visibly tied at the front, ' +
      'both arms stretched out to the sides at shoulder height as if holding hands with someone, ' +
      'skirt flaring gently, white beoseon socks and black flower shoes, feet together, ' +
      'unmistakably Korean clothing, no Chinese hanfu, no Mongolian deel, no Japanese kimono, ' +
      'simple flat shapes, one figure only',
  })),
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const itemsIn = (group) => ITEMS.filter((i) => i.group === group);
