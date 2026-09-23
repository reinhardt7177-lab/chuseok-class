/**
 * 추석 계기교육 콘텐츠 — 단일 원본(single source of truth)
 * 교사용(전체학습)과 학생용(개별학습)이 이 파일 하나를 함께 읽는다.
 *
 * 학년대(band): low = 1~2학년 / mid = 3~4학년 / high = 5~6학년
 * 각 섹션의 content·prompts는 band별로 따로 쓰여 있다.
 */

export const BANDS = {
  low: {
    id: 'low',
    label: '1~2학년',
    short: '저학년',
    emoji: '🐣',
    blurb: '큰 그림과 짧은 문장, 듣고 만지는 활동 위주',
    readingLevel: '글자 최소 · 소리내어 읽어주기',
    quizStyle: 'OX와 그림 고르기',
  },
  mid: {
    id: 'mid',
    label: '3~4학년',
    short: '중학년',
    emoji: '🌱',
    blurb: '한자어는 풀어쓰고, 놀이형 활동으로 개념 잡기',
    readingLevel: '짧은 문장 · 스스로 읽기',
    quizStyle: 'OX · 4지선다 · 짝맞추기',
  },
  high: {
    id: 'high',
    label: '5~6학년',
    short: '고학년',
    emoji: '🌳',
    blurb: '유래와 농경문화, 오늘날의 변화까지 생각해보기',
    readingLevel: '설명문 수준 · 생각쓰기 포함',
    quizStyle: 'OX · 4지선다 · 서술형',
  },
};

export const BAND_ORDER = ['low', 'mid', 'high'];

/* ────────────────────────────────────────────────────────────
   섹션 = 수업의 한 장면
   media.motion → public/assets/motion/<id>.mp4  (Leonardo 모션)
   media.poster → public/assets/img/<id>.jpg      (첫 프레임 / 폴백)
   ──────────────────────────────────────────────────────────── */

export const SECTIONS = [
  {
    id: 'opening',
    order: 1,
    title: '보름달이 떴어요',
    subtitle: '여는 장면',
    icon: '🌕',
    accent: 'moon',
    minutes: { low: 3, mid: 3, high: 3 },
    media: { motion: 'opening-moonrise', poster: 'opening-moonrise' },
    activity: null,
    content: {
      low: {
        headline: '오늘 밤, 아주 큰 달이 떠요',
        lines: [
          '하늘을 봐요. 아주 큰 달이 떴어요.',
          '동그랗고 노란 보름달이에요.',
          '추석 무렵 볼 수 있는 둥근 달이에요.',
          '이런 날을 추석이라고 불러요.',
          '오늘은 추석 이야기를 들어 볼까요?',
        ],
        keyword: '추석',
      },
      mid: {
        headline: '둥근 달과 함께 맞는 추석',
        lines: [
          '가을 하늘에 커다랗고 둥근 보름달이 떠올랐습니다.',
          '추석은 음력 8월 15일, 보름달을 떠올리는 날이에요.',
          '이 무렵은 봄에 심은 곡식을 처음 거두는 때이기도 합니다.',
          '수확을 나누고 소중한 사람에게 고마움을 전하는 날,',
          '그날이 바로 추석입니다.',
        ],
        keyword: '추석 · 한가위',
      },
      high: {
        headline: '더도 말고 덜도 말고 한가위만 같아라',
        lines: [
          '음력 8월 15일. 예부터 둥근 보름달을 떠올리며 맞는 날입니다.',
          '봄에 심고 여름 내내 가꾼 곡식을 처음 거두어들이는 시기이기도 하지요.',
          '농사가 전부였던 시절, 첫 수확은 한 해를 살아냈다는 뜻이었습니다.',
          '그래서 조상들은 이 풍요로움에 감사하며 하늘과 조상에게 첫 곡식을 올렸습니다.',
          '더도 말고 덜도 말고 한가위만 같아라 — 이런 말이 전해집니다.',
          '늘 오늘처럼만 넉넉했으면 좋겠다는 바람이 담긴 말이지요.',
        ],
        keyword: '추석 · 한가위 · 중추절',
      },
    },
    prompts: {
      low: ['달이 어떻게 생겼나요?', '달을 보면 어떤 기분이 드나요?'],
      mid: ['보름달을 실제로 본 적 있나요? 언제였나요?', '추석 하면 제일 먼저 떠오르는 것은 무엇인가요?'],
      high: [
        '보름달이 추석의 상징이 된 까닭은 무엇일까요?',
        '"한가위만 같아라"라는 말에는 어떤 바람이 담겨 있을까요?',
      ],
    },
  },

  {
    id: 'what-is',
    order: 2,
    title: '추석은 어떤 날일까',
    subtitle: '개념 알기',
    icon: '📅',
    accent: 'gold',
    minutes: { low: 5, mid: 6, high: 7 },
    media: { motion: 'family-gathering', poster: 'family-gathering' },
    activity: 'word-cards',
    content: {
      low: {
        headline: '고마운 마음을 나누는 날이에요',
        lines: [
          '추석에는 가족이나 소중한 사람을 만날 수 있어요.',
          '멀리 있으면 전화로 안부를 전하기도 해요.',
          '함께 맛있는 음식을 나누기도 해요.',
          '새 옷을 입기도 해요.',
          '추석은 한가위라고도 불러요.',
        ],
        facts: [
          { term: '추석', gloss: '가을에 맞는 큰 명절' },
          { term: '한가위', gloss: '"가을의 한가운데"라는 뜻' },
        ],
        keyword: '한가위',
      },
      mid: {
        headline: '가을의 한가운데, 큰 명절',
        lines: [
          '추석은 음력 8월 15일입니다.',
          '우리가 쓰는 달력 날짜와는 조금 다르지요.',
          '옛날에는 달이 차고 기우는 모습으로 날짜를 세었어요.',
          '그것을 음력이라고 합니다.',
          '그래서 추석은 해마다 양력 날짜가 바뀝니다.',
          '한가위의 한은 크다, 가위는 가운데라는 뜻이에요.',
          '합치면 가을의 한가운데라는 말이 됩니다.',
        ],
        facts: [
          { term: '음력', gloss: '달이 차고 기우는 주기로 세는 날짜' },
          { term: '한가위', gloss: '한(크다) + 가위(가운데)' },
          { term: '2대 명절', gloss: '우리나라의 설날과 추석' },
        ],
        keyword: '음력 8월 15일',
      },
      high: {
        headline: '수확에 감사하는 농경 사회의 명절',
        lines: [
          '추석은 음력 8월 15일로, 양력으로는 9월에서 10월 사이를 오갑니다.',
          '음력은 달의 삭망 주기, 약 29.5일을 한 달로 셉니다.',
          '그렇게 열두 달을 세면 354일쯤 되어 태양년보다 11일가량 짧습니다.',
          '그래서 추석 날짜가 해마다 앞뒤로 밀리는 것이지요.',
          '순우리말 이름은 한가위입니다. 한(크다) 더하기 가위(가운데)입니다.',
          '중국의 중추절과 베트남의 뗏쭝투도 음력 8월 15일을 기념합니다.',
          '보름달을 바라보는 명절이라는 공통점이 있지만, 풍습은 나라마다 다릅니다.',
        ],
        facts: [
          { term: '음력', gloss: '달의 삭망 주기(약 29.5일) 기준 역법' },
          { term: '한가위', gloss: '한(大) + 가위(中) — 가을의 한가운데' },
          { term: '중추절', gloss: '한자로 "가을의 가운데 절기"' },
          { term: '가배(嘉俳)', gloss: '신라 시대 추석을 부르던 이름' },
        ],
        keyword: '음력 8월 15일 · 중추절',
      },
    },
    prompts: {
      low: ['추석에 어떤 마음을 전하고 싶나요?', '멀리 있는 사람에게 어떻게 안부를 전할 수 있을까요?'],
      mid: ['음력과 양력은 무엇이 다를까요?', '왜 추석 날짜는 해마다 바뀔까요?'],
      high: [
        '농사짓는 사회에서 음력을 쓴 까닭은 무엇일까요?',
        '여러 나라의 보름달 명절은 무엇이 같고 다를까요?',
      ],
    },
  },

  {
    id: 'origin',
    order: 3,
    title: '추석은 어떻게 생겨났을까',
    subtitle: '유래 알기',
    icon: '📜',
    accent: 'ink',
    minutes: { low: 4, mid: 6, high: 8 },
    media: { motion: 'silla-weaving', poster: 'silla-weaving' },
    activity: null,
    content: {
      low: {
        headline: '아주 옛날, 베 짜기 시합이 있었어요',
        lines: [
          '아주 옛날, 신라라는 나라가 있었어요.',
          '사람들이 두 편으로 나뉘었어요.',
          '한 달 동안 베 짜기 시합을 했지요.',
          '베는 옷을 만드는 천이에요.',
          '진 편이 이긴 편에게 음식을 대접했어요.',
          '그러고는 다 같이 노래하고 춤췄대요.',
          '이 이야기가 옛 역사책에 전해져요.',
        ],
        keyword: '베 짜기 시합',
      },
      mid: {
        headline: '옛 기록에 남은 신라의 가배 이야기',
        lines: [
          '약 2000년 전, 신라 유리왕 때 이야기입니다.',
          '나라 안 여자들을 두 편으로 나누었어요.',
          '왕의 두 딸이 각각 한 편씩 이끌었습니다.',
          '한 달 동안 길쌈, 그러니까 베 짜기를 겨루었지요.',
          '음력 8월 15일에 누가 더 많이 짰는지 발표했습니다.',
          '그런데 진 편이 벌을 받은 게 아니었어요.',
          '진 편이 이긴 편에게 음식을 대접하고, 다 함께 노래하고 춤췄습니다.',
          '이 행사를 가배라 불렀다고 『삼국사기』에 전해집니다.',
        ],
        facts: [
          { term: '길쌈', gloss: '실을 뽑아 옷감(베)을 짜는 일' },
          { term: '가배', gloss: '신라의 길쌈 대회 겸 축제' },
          { term: '삼국사기', gloss: '고려 시대에 김부식이 쓴 역사책' },
        ],
        keyword: '가배 · 길쌈',
      },
      high: {
        headline: '『삼국사기』가 전하는 가배의 기록',
        lines: [
          '삼국사기 신라본기에 유리이사금 9년의 일이 기록되어 있습니다.',
          '왕이 6부의 여자들을 두 편으로 나누고 왕녀 둘에게 각각 이끌게 했습니다.',
          '음력 7월 16일부터 한 달간 날마다 모여 길쌈을 겨루게 했지요.',
          '8월 15일에 성과를 따져 진 편이 이긴 편에게 술과 음식을 차려 대접했습니다.',
          '이때 노래와 춤과 온갖 놀이가 벌어졌는데, 이를 가배라 했습니다.',
          '진 편의 한 여자가 일어나 회소, 회소 하며 부른 노래가 애처롭고 우아했다고 합니다.',
          '훗날 사람들이 그 가락에 노랫말을 붙여 회소곡이라 불렀습니다.',
          '주목할 점은 이 기록이 승패를 가리는 데서 끝나지 않는다는 것입니다.',
          '다만 이 기록만으로 기원을 단정하기는 어렵습니다. 더 오래된 수확 의례가 바탕에 있었을 것입니다.',
        ],
        facts: [
          { term: '유리이사금', gloss: '신라 제3대 왕 (재위 24~57년)' },
          { term: '길쌈', gloss: '삼·모시 등에서 실을 뽑아 옷감을 짜는 일' },
          { term: '회소곡', gloss: '가배에서 진 편 여인이 불렀다는 노래' },
          { term: '삼국사기', gloss: '1145년 김부식 등이 편찬한 삼국 역사서' },
        ],
        keyword: '가배 · 회소곡 · 삼국사기',
      },
    },
    prompts: {
      low: ['시합에서 지면 기분이 어떨까요?', '진 편도 같이 놀았대요. 왜 그랬을까요?'],
      mid: ['진 편이 음식을 대접하고 다 같이 논 이유는 무엇일까요?', '우리 반에도 이런 시합이 있다면 어떨까요?'],
      high: [
        '승자만 축하하지 않고 모두가 함께 먹고 논 데에는 어떤 뜻이 있을까요?',
        '기록 하나만으로 명절의 기원을 단정할 수 없는 이유는 무엇일까요?',
      ],
    },
  },

  {
    id: 'food',
    order: 4,
    title: '추석에 먹는 음식',
    subtitle: '명절 음식',
    icon: '🍡',
    accent: 'persimmon',
    minutes: { low: 7, mid: 8, high: 8 },
    media: { motion: 'songpyeon-steam', poster: 'songpyeon-steam' },
    activity: 'songpyeon',
    content: {
      low: {
        headline: '송편을 만들어요',
        lines: [
          '추석에는 송편을 만들어 먹어요.',
          '쌀가루에 물을 넣고 조물조물 반죽해요.',
          '그 안에 깨나 콩을 넣어요.',
          '반달 모양으로 예쁘게 빚어요.',
          '솔잎을 깔고 쪄요. 향이 아주 좋아요.',
          '밤, 대추, 감도 같이 먹어요.',
          '갓 거둔 곡식과 과일을 나누기도 해요.',
        ],
        items: [
          { name: '송편', emoji: '🥟', gloss: '반달 모양 떡' },
          { name: '햇과일', emoji: '🍎', gloss: '올해 처음 딴 과일' },
          { name: '전', emoji: '🥞', gloss: '기름에 부친 반찬' },
        ],
        keyword: '송편',
      },
      mid: {
        headline: '햇곡식과 햇과일을 나누는 날',
        lines: [
          '추석에는 햇곡식과 햇과일을 쓰기도 합니다.',
          '하지만 모든 음식을 새로 거둔 재료로 만드는 것은 아니에요.',
          '그해 처음 수확한 쌀을 햅쌀이라고 합니다.',
          '햅쌀로 송편을 빚기도 하지요.',
          '송편 속에 넣는 깨, 콩, 밤을 소라고 부릅니다.',
          '찜기에 솔잎을 깔고 찌면 향이 배고 떡끼리 붙지 않아요.',
          '갓 딴 밤과 대추와 감 같은 햇과일도 상에 오릅니다.',
          '송편을 예쁘게 빚으면 예쁜 아기를 낳는다는 재미있는 말도 전해집니다.',
        ],
        items: [
          { name: '송편', emoji: '🥟', gloss: '햅쌀 반죽에 깨·콩·밤을 넣은 반달떡' },
          { name: '토란국', emoji: '🍲', gloss: '토란을 넣어 끓인 맑은 국' },
          { name: '화양적', emoji: '🍢', gloss: '고기와 채소를 색 맞춰 꿴 꼬치' },
          { name: '햇과일', emoji: '🌰', gloss: '밤·대추·감 등 그해 첫 수확' },
        ],
        keyword: '햅쌀 · 송편 · 토란국',
      },
      high: {
        headline: '첫 수확을 올리는 상, 천신(薦新)',
        lines: [
          '추석상의 핵심은 천신(薦新)입니다.',
          '그해 처음 거둔 곡식과 과일을 조상께 먼저 올리는 일이지요.',
          '그래서 햅쌀로 송편을 빚고, 갓 딴 밤과 대추와 감과 배를 올립니다.',
          '먹는 일에 순서와 의미를 둔 것입니다.',
          '송편이 반달 모양인 데에도 해석이 있습니다.',
          '보름달은 이미 다 찬 달이지만 반달은 앞으로 더 커질 달입니다.',
          '채워질 앞날을 바라는 뜻이라는 것이지요.',
          '토란국은 추석 무렵이 토란의 제철이기 때문입니다.',
          '지역 차이도 큽니다. 북쪽은 크고 소를 넉넉히, 남쪽은 작고 앙증맞게 빚습니다.',
        ],
        items: [
          { name: '송편', emoji: '🥟', gloss: '햅쌀 반죽 + 깨·콩·밤 소, 솔잎에 쪄내기' },
          { name: '토란국', emoji: '🍲', gloss: '제철 토란을 넣은 맑은 장국' },
          { name: '화양적', emoji: '🍢', gloss: '오색을 맞춰 꿴 꼬치 음식' },
          { name: '햇과일', emoji: '🌰', gloss: '천신(薦新) — 첫 수확을 먼저 올림' },
          { name: '신도주', emoji: '🍶', gloss: '햅쌀로 담근 그해의 술' },
        ],
        keyword: '천신 · 햅쌀 · 반달의 의미',
      },
    },
    prompts: {
      low: ['송편 안에 무엇을 넣고 싶나요?', '우리 집에서 추석에 먹는 음식은 뭐가 있나요?'],
      mid: ['왜 솔잎을 깔고 찔까요?', '"햇-"이 붙은 말에는 또 무엇이 있을까요? (햅쌀, 햇감자…)'],
      high: [
        '왜 보름달 모양이 아니라 반달 모양으로 빚었을까요?',
        '지역마다 송편 모양이 다른 까닭은 무엇일까요?',
      ],
    },
  },

  {
    id: 'customs',
    order: 5,
    title: '추석에 하는 일',
    subtitle: '풍습',
    icon: '🕯️',
    accent: 'ink',
    minutes: { low: 5, mid: 7, high: 9 },
    media: { motion: 'charye-table', poster: 'charye-table' },
    activity: 'charye',
    content: {
      low: {
        headline: '조상님께 인사드려요',
        lines: [
          '어떤 집에서는 추석 아침에 상을 차려요.',
          '음식을 올리고 조상님께 인사드리지요.',
          '이것을 차례라고 해요.',
          '산소에 찾아가기도 해요.',
          '산소에 찾아가 인사하는 것은 성묘예요.',
          '모두 고맙습니다 하는 마음이에요.',
        ],
        items: [
          { name: '차례', emoji: '🕯️', gloss: '아침에 상을 차리고 인사하기' },
          { name: '성묘', emoji: '⛰️', gloss: '산소에 찾아가 인사하기' },
        ],
        keyword: '차례 · 성묘',
      },
      mid: {
        headline: '차례, 성묘, 그리고 벌초',
        lines: [
          '차례를 지내는 집에서는 추석 아침에 조상께 음식을 올리고 인사드립니다.',
          '이것을 차례라고 해요.',
          '산소를 찾아가 인사하는 것은 성묘라고 하지요.',
          '추석 전에 미리 산소의 풀을 베어 정리하는 일은 벌초입니다.',
          '차례상 차림은 집집마다 다릅니다.',
          '붉은 과일은 동쪽, 흰 과일은 서쪽이라는 홍동백서도 한 가지 설명일 뿐이에요.',
          '과일을 반드시 그 순서로 놓아야 하는 것은 아닙니다.',
          '간단히 차리는 집도, 아예 지내지 않는 집도 많아요.',
        ],
        items: [
          { name: '차례', emoji: '🕯️', gloss: '명절 아침 조상께 올리는 간소한 제사' },
          { name: '성묘', emoji: '⛰️', gloss: '조상 산소를 찾아뵙는 일' },
          { name: '벌초', emoji: '🌾', gloss: '산소의 풀을 베어 정리하는 일' },
          { name: '홍동백서', emoji: '🍎', gloss: '과일 배치를 설명하는 말, 필수 규칙은 아님' },
        ],
        keyword: '차례 · 성묘 · 벌초',
      },
      high: {
        headline: '형식에 담긴 마음, 그리고 달라지는 모습',
        lines: [
          '차례는 명절 아침에 지내는 간소한 제사입니다.',
          '기제사와 달리 술을 한 번만 올리고 축문을 읽지 않는 것이 보통이지요.',
          '상차림을 설명하는 여러 말이 전해집니다.',
          '홍동백서 — 붉은 과일은 동쪽, 흰 과일은 서쪽이라는 말입니다.',
          '조율이시 — 대추, 밤, 배, 감 순서로 놓는다는 말입니다.',
          '어동육서 — 생선은 동쪽, 고기는 서쪽이라는 말입니다.',
          '하지만 홍동백서와 조율이시는 옛 예법 문헌의 필수 규칙이 아닙니다.',
          '집안마다 우리 집은 이렇게 한다는 가가례(家家禮)가 있었지요.',
          '2022년 성균관은 전을 올리지 않아도 되고 과일도 편하게 놓아도 된다고 안내했습니다.',
          '중요한 것은 상의 모양보다 기억하고 고마워하는 마음이라는 뜻입니다.',
        ],
        items: [
          { name: '차례', emoji: '🕯️', gloss: '명절 아침의 간소한 제사' },
          { name: '성묘·벌초', emoji: '⛰️', gloss: '산소를 찾아 살피고 손질하는 일' },
          { name: '홍동백서', emoji: '🍎', gloss: '과일 배치를 설명하는 말, 필수 규칙은 아님' },
          { name: '조율이시', emoji: '🌰', gloss: '과일 순서를 설명하는 말, 필수 규칙은 아님' },
          { name: '어동육서', emoji: '🐟', gloss: '생선과 고기의 자리를 설명하는 말' },
          { name: '가가례', emoji: '🏠', gloss: '집안마다 다른 예법 — 정답은 하나가 아님' },
        ],
        keyword: '차례 · 가가례 · 표준안',
      },
    },
    prompts: {
      low: ['고마운 사람에게 인사해 본 적 있나요?', '누구에게 고맙다고 말하고 싶나요?'],
      mid: ['우리 집은 추석 아침에 무엇을 하나요?', '집집마다 다른 이유는 무엇일까요?'],
      high: [
        '"가가례"라는 말은 우리에게 무엇을 알려줄까요?',
        '형식과 마음 중 무엇이 더 중요할까요? 그렇게 생각한 이유는?',
      ],
    },
  },

  {
    id: 'play',
    order: 6,
    title: '추석에 하는 놀이',
    subtitle: '민속놀이',
    icon: '🎎',
    accent: 'jade',
    minutes: { low: 7, mid: 8, high: 8 },
    media: { motion: 'ganggangsullae', poster: 'ganggangsullae' },
    activity: 'ganggangsullae',
    content: {
      low: {
        headline: '함께 춤추고 힘을 겨루는 놀이',
        lines: [
          '밝은 달 아래에서 강강술래를 했어요.',
          '손을 잡고 둥글게 돌며 노래해요.',
          '씨름은 두 사람이 샅바를 잡고 겨뤄요.',
          '상대방을 넘어뜨리면 이겨요.',
          '줄다리기는 두 편이 긴 줄을 잡아요.',
          '모두 힘을 모아 줄을 당겨요.',
          '지역마다 놀이가 달랐지만 함께 어울렸어요.',
        ],
        lineArt: ['ganggangsullae', 'ganggangsullae-above', 'ssireum', 'ssireum', 'tug-of-war', 'tug-of-war', 'folk-games'],
        factsArt: 'folk-games',
        videoArt: 'folk-games',
        askArt: 'folk-games',
        items: [
          { name: '강강술래', emoji: '💃', gloss: '손잡고 둥글게 돌며 노래하고 춤추기' },
          { name: '씨름', emoji: '🤼', gloss: '샅바를 잡고 상대를 넘어뜨리기' },
          { name: '줄다리기', emoji: '🪢', gloss: '두 편이 힘을 모아 긴 줄 당기기' },
        ],
        keyword: '강강술래 · 씨름 · 줄다리기',
      },
      mid: {
        headline: '강강술래·씨름·줄다리기',
        lines: [
          '강강술래는 손을 잡고 둥글게 돌며 부르는 노래이자 춤입니다.',
          '한 사람이 앞소리를 메기면 여럿이 “강강술래” 하고 받아요.',
          '느리게 시작해 점점 빠르게 도는 모습이 보름달을 떠올리게 하지요.',
          '씨름은 두 사람이 샅바를 잡고 상대를 넘어뜨리려 겨루는 놀이입니다.',
          '추석 같은 명절에 씨름판이 열리면 선수와 구경꾼이 함께 즐겼어요.',
          '줄다리기는 두 편이 긴 줄을 잡고 힘을 모아 당기는 놀이입니다.',
          '지역에 따라 풍년과 마을의 안녕을 바라는 뜻도 담았지요.',
          '놀이 모습은 지역마다 달랐지만, 함께 어울리는 즐거움이 있었습니다.',
        ],
        lineArt: ['ganggangsullae', 'ganggangsullae-above', 'ganggangsullae-above', 'ssireum', 'ssireum', 'tug-of-war', 'tug-of-war', 'folk-games'],
        factsArt: 'folk-games',
        videoArt: 'ganggangsullae',
        askArt: 'folk-games',
        items: [
          { name: '강강술래', emoji: '💃', gloss: '손잡고 원을 그리며 부르는 노래이자 춤' },
          { name: '씨름', emoji: '🤼', gloss: '샅바를 잡고 겨루는 힘겨루기' },
          { name: '줄다리기', emoji: '🪢', gloss: '두 편이 함께 긴 줄을 당기는 놀이' },
        ],
        keyword: '강강술래 · 씨름 · 줄다리기',
      },
      high: {
        headline: '세 놀이로 보는 추석의 어울림',
        lines: [
          '강강술래는 전남 해안 지역에서 전해 온 공동체의 노래와 춤입니다.',
          '앞소리와 뒷소리를 주고받으며 원을 그려 돌다가 점점 빠르게 움직입니다.',
          '씨름에서는 두 선수가 샅바를 잡고 기술을 써서 상대를 넘어뜨립니다.',
          '명절의 씨름판은 선수와 구경꾼이 함께 즐기는 자리이기도 했습니다.',
          '줄다리기는 마을 사람들이 편을 나누어 긴 줄을 함께 당기는 놀이입니다.',
          '일부 지역에서는 줄다리기를 하며 풍년과 공동체의 안녕을 빌었습니다.',
          '강강술래는 2009년, 남북이 함께 등재한 씨름은 2018년 유네스코 인류무형문화유산이 됐습니다.',
          '줄다리기 의례와 놀이는 한국을 포함한 네 나라가 함께 올려 2015년 등재됐지요.',
          '방법은 서로 다르지만, 여러 사람이 함께 어울린다는 공통점이 있습니다.',
        ],
        lineArt: ['ganggangsullae', 'ganggangsullae-above', 'ssireum', 'ssireum', 'tug-of-war', 'tug-of-war', 'folk-games', 'tug-of-war', 'folk-games'],
        factsArt: 'folk-games',
        videoArt: 'ganggangsullae',
        askArt: 'folk-games',
        items: [
          { name: '강강술래', emoji: '💃', gloss: '선후창 · 유네스코 인류무형문화유산(2009)' },
          { name: '씨름', emoji: '🤼', gloss: '유네스코 인류무형문화유산(2018, 남북 공동)' },
          { name: '줄다리기', emoji: '🪢', gloss: '유네스코 인류무형문화유산(2015, 4개국 공동)' },
        ],
        keyword: '강강술래 · 씨름 · 줄다리기',
      },
    },
    prompts: {
      low: ['세 놀이 중에 무엇을 해보고 싶나요?', '혼자 할 때와 함께할 때 무엇이 다를까요?'],
      mid: ['강강술래·씨름·줄다리기는 각각 어떻게 하나요?', '이 놀이들에는 어떤 공통점이 있을까요?'],
      high: [
        '세 놀이에서 경쟁과 협력은 각각 어떻게 나타나나요?',
        '요즘 우리 반에서 모두가 함께할 수 있는 놀이는 무엇이 있을까요?',
      ],
    },
  },

  {
    id: 'wish',
    order: 7,
    title: '보름달에 소원을 빌어요',
    subtitle: '함께하는 활동',
    icon: '🌙',
    accent: 'moon',
    minutes: { low: 6, mid: 6, high: 6 },
    media: { motion: 'moon-wish', poster: 'moon-wish' },
    activity: 'moon-wish',
    content: {
      low: {
        headline: '달님에게 소원을 말해요',
        lines: [
          '보름달을 보면 소원을 빌어요.',
          '두 손을 모으고 눈을 감아요.',
          '마음속으로 빌어도 돼요.',
          '소리 내어 말해도 좋아요.',
          '우리 반 친구들 소원을 모아 볼까요?',
        ],
        keyword: '소원',
      },
      mid: {
        headline: '달을 보며 비는 마음',
        lines: [
          '옛날 사람들은 가장 둥근 달에 특별한 힘이 있다고 믿었습니다.',
          '그래서 보름달이 뜨면 소원을 빌었어요.',
          '풍년이 들기를, 가족이 건강하기를 바랐지요.',
          '재미있는 것은 그 소원의 내용입니다.',
          '대부분 나 혼자가 아니라 우리를 위한 것이었어요.',
          '우리 반 친구들의 소원을 모아 하나의 달을 만들어 봅시다.',
        ],
        keyword: '소원 · 기원',
      },
      high: {
        headline: '개인의 소원과 공동체의 소원',
        lines: [
          '달맞이는 정월대보름과 추석에 모두 있던 풍습입니다.',
          '보름달이 뜨는 것을 먼저 본 사람의 소원이 이루어진다고도 했지요.',
          '흥미로운 것은 전해 오는 소원의 내용입니다.',
          '대부분 개인의 성공이 아니라 풍년, 마을의 안녕, 가족의 건강이었습니다.',
          '농사는 혼자 지을 수 없었고, 흉년은 마을 전체의 문제였기 때문입니다.',
          '개인의 안전이 공동체의 안전과 묶여 있던 시대의 사고방식이지요.',
          '오늘 우리는 어떤 소원을 빌게 될까요?',
          '나만의 소원과 우리 모두를 위한 소원을 하나씩 적어 봅시다.',
        ],
        keyword: '달맞이 · 공동체의 기원',
      },
    },
    prompts: {
      low: ['어떤 소원을 빌고 싶나요?'],
      mid: ['나를 위한 소원과 우리를 위한 소원, 어떻게 다를까요?'],
      high: [
        '옛사람들의 소원이 대부분 "우리"를 위한 것이었던 이유는 무엇일까요?',
        '오늘날 우리가 함께 빌면 좋을 소원은 무엇일까요?',
      ],
    },
  },

  {
    id: 'today',
    order: 8,
    title: '오늘날의 추석',
    subtitle: '지금, 우리의 이야기',
    icon: '🏙️',
    accent: 'persimmon',
    minutes: { low: 4, mid: 7, high: 10 },
    media: { motion: 'modern-chuseok', poster: 'modern-chuseok' },
    activity: 'discuss',
    content: {
      low: {
        headline: '우리 집 추석은 어때요?',
        lines: [
          '추석을 보내는 모습은 집집마다 달라요.',
          '시골 할머니 댁에 가는 집도 있어요.',
          '여행을 가는 집도 있어요.',
          '집에서 편하게 쉬는 집도 있지요.',
          '영상통화로 인사하기도 해요.',
          '어떻게 보내든 모두 괜찮아요.',
        ],
        keyword: '우리 집 추석',
      },
      mid: {
        headline: '달라진 추석, 달라지지 않은 것',
        lines: [
          '예전에는 많은 집이 고향에 모여 며칠을 함께 보내기도 했습니다.',
          '요즘은 모습이 많이 달라졌어요.',
          '여행을 가거나, 짧게 만나거나, 영상통화로 인사를 나누기도 합니다.',
          '가족의 모습도 다양합니다.',
          '조부모와 사는 집, 한 부모 가정, 다문화 가정, 친척이 멀리 사는 집도 있지요.',
          '추석을 보내는 방법에 정답은 없습니다.',
          '다만 변하지 않는 것이 하나 있어요.',
          '고마운 사람을 떠올리고, 마음을 나눈다는 것입니다.',
        ],
        keyword: '다양한 가족 · 변하는 명절',
      },
      high: {
        headline: '명절은 왜, 어떻게 달라지고 있을까',
        lines: [
          '고향에 가거나 여행을 떠나는 등 명절을 보내는 방법이 다양해졌습니다.',
          '1인 가구는 전체 가구의 3분의 1을 넘어섰지요.',
          '명절 노동이 특정 사람에게 몰리는 문제도 오래 이야기되어 왔습니다.',
          '가족의 형태도 달라졌습니다.',
          '한 부모 가정, 조손 가정, 다문화 가정, 1인 가구가 모두 우리 사회의 구성원입니다.',
          '그래서 차례를 간소화하거나, 각자 편한 방식으로 안부를 전하는 집이 늘고 있습니다.',
          '여기서 생각해 볼 것이 있습니다.',
          '형식이 달라지는 것과 마음이 사라지는 것은 다른 일이라는 점입니다.',
          '명절의 본질이 고마움을 나누는 것이라면,',
          '그 방법은 시대에 맞게 바뀌어도 괜찮지 않을까요?',
        ],
        keyword: '변화 · 다양성 · 명절의 본질',
      },
    },
    teacherCaution:
      '가족 형태는 학생마다 다릅니다. "누구와 보내는지"보다 "어떤 마음을 나누는지"로 이야기를 이끌어 주세요. 고향·친척·차례를 당연한 전제로 두지 않도록 발문에 유의합니다.',
    prompts: {
      low: ['우리 집은 추석에 무엇을 하나요?'],
      mid: ['추석에 꼭 하고 싶은 것 한 가지는 무엇인가요?', '떨어져 있는 사람에게 마음을 전하는 방법은?'],
      high: [
        '명절의 형식이 달라지는 것을 어떻게 생각하나요?',
        '명절 일이 한 사람에게 몰린다면, 어떻게 나눌 수 있을까요?',
        '10년 뒤 추석은 어떤 모습일까요?',
      ],
    },
  },

  {
    id: 'wrap',
    order: 9,
    title: '정리하고 확인해요',
    subtitle: '마무리 퀴즈',
    icon: '✅',
    accent: 'jade',
    minutes: { low: 6, mid: 8, high: 10 },
    media: { motion: null, poster: 'wrap-lantern' },
    activity: 'quiz',
    content: {
      low: {
        headline: '오늘 배운 것을 확인해요',
        lines: [
          '오늘 추석에 대해 많이 배웠어요.',
          '이제 문제를 풀어 볼까요?',
          'O 또는 X를 골라요.',
          '틀려도 괜찮아요. 다시 배우면 돼요!',
        ],
        keyword: '확인하기',
      },
      mid: {
        headline: '오늘 배운 것을 정리해 봅시다',
        lines: [
          '오늘 배운 것을 정리해 봅시다.',
          '먼저 퀴즈로 확인해요.',
          '그다음 가장 기억에 남는 것을 한 문장으로 적어 봅시다.',
          '올해 추석에는 오늘 배운 것을 가족에게 알려줘 볼까요?',
        ],
        keyword: '정리하기',
      },
      high: {
        headline: '알게 된 것과 생각하게 된 것',
        lines: [
          '오늘 배운 것을 퀴즈로 확인해 봅시다.',
          '그리고 마지막에는 생각을 적어 봅시다.',
          '알게 된 것과 생각하게 된 것은 다릅니다.',
          '알게 된 것은 사실이고, 생각하게 된 것은 그 사실에서 내가 길어 올린 것이지요.',
          '둘 다 적어 보세요.',
        ],
        keyword: '정리 · 성찰',
      },
    },
    prompts: {
      low: ['오늘 제일 재미있었던 건 뭐예요?'],
      mid: ['오늘 새로 알게 된 것 한 가지는?'],
      high: ['오늘 배운 것 중 다른 사람에게 꼭 알려주고 싶은 것은 무엇인가요?'],
    },
  },
];

/** 섹션 id로 빠르게 찾기 */
export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

/** 해당 학년대의 총 수업 시간(분) */
export function totalMinutes(band) {
  return SECTIONS.reduce((sum, s) => sum + (s.minutes[band] ?? 0), 0);
}

/** 섹션 + 학년대 → 화면에 그릴 내용 한 덩어리 */
export function resolveSection(section, band) {
  return {
    ...section,
    body: section.content[band],
    ask: section.prompts[band] ?? [],
    minutes: section.minutes[band],
  };
}

/**
 * 한 장면을 "한 화면에 한 문장 + 그림 한 장"으로 쪼갠다.
 *
 * 처음에는 장면 하나를 한 화면에 다 넣었는데, 고학년처럼 글이 많으면
 * 용어 카드가 화면 밖으로 밀려났다. 무엇보다 프로젝터에 문단 여섯 개를
 * 띄우는 건 아이들이 읽기 어렵다. 그래서 문장 단위로 끊고,
 * 각 문장에 그 장면의 삽화를 하나씩 붙인다.
 *
 * @param {object} section  SECTIONS의 한 항목
 * @param {string} band     low | mid | high
 * @param {Array}  art      이 장면의 삽화 목록 (shared/assets.js)
 * @returns {Array} [{ kind, text, art, showTitle, facts }]
 */
export function beatsFor(section, band, art = [], extras = {}) {
  const body = section.content[band];
  if (!art.length) {
    return body.lines.map((text, i) => ({ kind: 'line', text, art: null, showTitle: i === 0 }));
  }

  /* 순서대로 돌려 쓰면 "강강술래!" 문장에 줄다리기 그림이 붙는다.
     삽화마다 달아둔 낱말(kw)로 짝을 짓되, 앞 문장이 좋은 그림을 먼저
     채가지 않도록 전체 후보를 모아 "가장 확실한 짝"부터 배정한다. */
  const candidates = [];
  body.lines.forEach((text, line) => {
    for (const a of art) {
      for (const w of a.kw ?? []) {
        if (text.includes(w)) candidates.push({ line, asset: a, score: w.length });
      }
    }
  });
  candidates.sort((x, y) => y.score - x.score);

  const chosen = new Array(body.lines.length).fill(null);
  const used = new Set();

  /* 그림의 순서가 문장 뜻과 달라질 수 있는 장면은 짝을 명시한다.
     같은 그림을 여러 문장에 써도 씨름 설명에 강강술래가 나오지 않는다. */
  body.lineArt?.forEach((id, i) => {
    const match = art.find((a) => a.id === id);
    if (match && i < chosen.length) {
      chosen[i] = match;
      used.add(match.id);
    }
  });

  /* 도입 문장("달이 밝은 밤이에요" 같은)에는 특정 낱말이 없어 엉뚱한 그림이 붙는다.
     첫 컷은 그 장면의 대표 삽화로 못박는다. */
  const hero = art.find((a) => a.role === 'hero');
  if (hero && !chosen[0]) {
    chosen[0] = hero;
    used.add(hero.id);
  }

  for (const c of candidates) {
    if (chosen[c.line] || used.has(c.asset.id)) continue;
    chosen[c.line] = c.asset;
    used.add(c.asset.id);
  }

  /* 짝을 못 찾은 문장은 남은 그림으로 채운다.
     그림보다 문장이 많은 장면에서는 처음부터 다시 돌린다.
     (예전에는 마지막 그림만 계속 반복해서 같은 화면이 세 번 나왔다) */
  const spare = art.filter((a) => !used.has(a.id));
  let s = 0;
  const leftover = () => {
    if (s < spare.length) return spare[s++];
    return art[(s++ - spare.length) % art.length];
  };

  const beats = body.lines.map((text, i) => ({
    kind: 'line',
    text,
    art: chosen[i] ?? leftover(),
    showTitle: i === 0,          // 첫 화면에만 제목과 소제목을 크게
  }));

  /* 용어는 따로 한 화면 — 문장에 섞으면 둘 다 안 읽힌다 */
  const facts = body.facts ?? body.items ?? [];
  if (facts.length) {
    beats.push({ kind: 'facts', facts, art: art.find((a) => a.id === body.factsArt) ?? leftover(), showTitle: false });
  }

  /* 영상은 흐름 안에 한 컷으로 들어간다.
     예전에는 오른쪽 도구창에 있어서 교사가 따로 찾아 눌러야 했다. */
  if (extras.video) {
    beats.push({ kind: 'video', video: extras.video, art: art.find((a) => a.id === body.videoArt) ?? leftover(), showTitle: false });
  }

  /* 교사 발문도 화면에 띄운다. 학생이 함께 읽고 생각할 시간이 된다. */
  const ask = section.prompts[band] ?? [];
  if (ask.length) {
    beats.push({ kind: 'ask', ask, art: art.find((a) => a.id === body.askArt) ?? leftover(), showTitle: false });
  }

  return beats;
}
