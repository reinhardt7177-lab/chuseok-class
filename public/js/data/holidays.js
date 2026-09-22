/**
 * 우리나라의 명절 — 오프닝 벤토 그리드에 쓴다.
 *
 * 추석만 수업으로 이어지고, 나머지는 눌러서 뒤집어 보는 카드다.
 * "사대 명절(설날·한식·단오·추석)"은 따로 표시해 둔다.
 *
 * 날짜는 음력이 기본이고, 한식과 동지는 절기라 양력으로 적었다.
 * 그림은 한 칸에 하나씩 들어가는 작은 SVG — 선 몇 개로만 그린다.
 */

/* 칸마다 쓰는 작은 그림. 40×40 자리에 맞춰 그렸다. */
const MARK = {
  /* 설날 — 떡국 한 그릇 */
  tteokguk: `<path d="M7 17h26c0 9-6 15-13 15S7 26 7 17Z" fill="currentColor" opacity=".22"/>
    <path d="M7 17h26" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="15" cy="14" rx="5" ry="2.6" fill="currentColor"/>
    <ellipse cx="25" cy="13" rx="4.4" ry="2.3" fill="currentColor" opacity=".7"/>
    <ellipse cx="20" cy="9" rx="4" ry="2.1" fill="currentColor" opacity=".45"/>`,

  /* 정월대보름 — 달집과 보름달 */
  daljip: `<circle cx="29" cy="10" r="6" fill="currentColor" opacity=".5"/>
    <path d="M20 33 11 14h18l-9 19Z" fill="currentColor" opacity=".22"/>
    <path d="M11 14 20 4l9 10" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" fill="none"/>
    <path d="M6 33h28" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,

  /* 한식 — 봉분과 풀 (성묘) */
  seongmyo: `<path d="M5 29c0-8 6.7-14 15-14s15 6 15 14" fill="currentColor" opacity=".24"/>
    <path d="M5 29c0-8 6.7-14 15-14s15 6 15 14" stroke="currentColor" stroke-width="2.2" fill="none"/>
    <path d="M4 33h32" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M12 15v-5M20 12V6M28 15v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,

  /* 삼짇날 — 돌아온 제비 */
  jebi: `<path d="M4 13c6-1 9 3 12 7 3-4 6-8 12-7" stroke="currentColor" stroke-width="2.6"
      stroke-linecap="round" fill="none"/>
    <path d="M16 20c2 3 5 5 8 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <path d="M22 28c4 1 8 0 12-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      opacity=".55" fill="none"/>`,

  /* 단오 — 그네 */
  geune: `<path d="M4 6h32" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M12 6v18M28 6v18" stroke="currentColor" stroke-width="1.8"/>
    <rect x="9" y="24" width="22" height="4" rx="1.6" fill="currentColor"/>
    <path d="M6 32c5-2 9-2 14 0s9 2 14 0" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" opacity=".45" fill="none"/>`,

  /* 칠석 — 은하수 건너 만나는 두 별 */
  chilseok: `<path d="M3 20c6-4 12-4 17 0s11 4 17 0" stroke="currentColor" stroke-width="2"
      stroke-dasharray="1.5 4" stroke-linecap="round" opacity=".75" fill="none"/>
    <path d="M9 12l1.7 3.6 3.9.5-2.9 2.7.8 3.9L9 20.8 5.5 22.7l.8-3.9-2.9-2.7 3.9-.5L9 12Z" fill="currentColor"/>
    <path d="M31 12l1.7 3.6 3.9.5-2.9 2.7.8 3.9L31 20.8l-3.5 1.9.8-3.9-2.9-2.7 3.9-.5L31 12Z" fill="currentColor" opacity=".7"/>
    <path d="M8 30h24" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".3"/>`,

  /* 중양절 — 국화 한 송이 */
  gukhwa: `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none">
      <path d="M20 4v8M20 28v8M4 20h8M28 20h8M8.7 8.7l5.6 5.6M25.7 25.7l5.6 5.6M31.3 8.7l-5.6 5.6M14.3 25.7l-5.6 5.6"/>
    </g>
    <circle cx="20" cy="20" r="6.5" fill="currentColor" opacity=".3"/>
    <circle cx="20" cy="20" r="3.2" fill="currentColor"/>`,

  /* 동지 — 팥죽 */
  patjuk: `<path d="M6 16h28c0 9.5-6.3 16-14 16S6 25.5 6 16Z" fill="currentColor" opacity=".24"/>
    <path d="M6 16h28" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="14" cy="12" r="2.4" fill="currentColor"/>
    <circle cx="21" cy="10" r="2" fill="currentColor" opacity=".75"/>
    <circle cx="27" cy="12.5" r="2.2" fill="currentColor" opacity=".55"/>
    <path d="M12 6c1.5-1.5 1.5-3 0-4M20 5c1.5-1.5 1.5-3 0-4M28 6c1.5-1.5 1.5-3 0-4"
      stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5" fill="none"/>`,
};

/** 달력 순서대로 — 설날부터 동지까지 한 해가 한 바퀴 돈다 */
export const HOLIDAYS = [
  {
    id: 'seollal', name: '설날', when: '음력 1월 1일', big: true,
    tint: '#e4703a', img: 'assets/img/holiday-seollal.jpg',
    tag: '한 살을 더 먹는 날',
    food: '떡국', play: '윷놀이 · 연날리기',
    body: '한 해가 시작되는 날이에요. 떡국을 한 그릇 먹으면 한 살을 더 먹는다고 했지요. '
        + '어른들께 세배를 드리고 덕담을 들어요.',
  },
  {
    id: 'daeboreum', name: '정월대보름', when: '음력 1월 15일',
    tint: '#f2c96b', img: 'assets/img/holiday-daeboreum.jpg',
    tag: '새해 첫 보름달',
    food: '오곡밥 · 부럼', play: '달집태우기 · 쥐불놀이',
    body: '새해 들어 처음 뜨는 보름달을 보는 날이에요. 딱딱한 부럼을 깨물어 한 해 건강을 빌고, '
        + '달집을 태우며 소원을 말했어요.',
  },
  {
    id: 'hansik', name: '한식', when: '양력 4월 5일 무렵', big: true,
    tint: '#7fc4a4', img: 'assets/img/holiday-hansik.jpg',
    tag: '불을 쓰지 않는 날',
    food: '찬 음식', play: '성묘 · 나무 심기',
    body: '동지에서 백다섯째 되는 날이에요. 이날은 불을 피우지 않아 찬 음식을 먹었어요. '
        + '조상의 산소를 찾아 풀을 뽑고 손질합니다.',
  },
  {
    id: 'samjinnal', name: '삼짇날', when: '음력 3월 3일',
    tint: '#f2a273', img: 'assets/img/holiday-samjinnal.jpg',
    tag: '제비가 돌아오는 날',
    food: '진달래 화전', play: '풀각시 놀이',
    body: '강남 갔던 제비가 돌아온다는 날이에요. 산에 핀 진달래꽃을 따다 반죽 위에 올려 '
        + '화전을 부쳐 먹으며 봄을 맞았습니다.',
  },
  {
    id: 'dano', name: '단오', when: '음력 5월 5일', big: true,
    tint: '#4a9b78', pos: "38% center", img: 'assets/img/holiday-dano.jpg',
    tag: '여름을 맞이하는 날',
    food: '수리취떡', play: '그네뛰기 · 씨름',
    body: '모내기를 끝내고 한 해 농사가 잘되기를 비는 날이에요. 창포물에 머리를 감고, '
        + '여자들은 그네를 뛰고 남자들은 씨름을 했어요.',
  },
  {
    id: 'chilseok', name: '칠석', when: '음력 7월 7일',
    tint: '#9db8e8', pos: "center 42%", img: 'assets/img/holiday-chilseok.jpg',
    tag: '견우와 직녀가 만나는 날',
    food: '밀전병 · 호박전', play: '별 보기',
    body: '일 년에 딱 하루, 은하수 양쪽에 떨어져 있던 견우와 직녀가 까치와 까마귀가 놓아 준 '
        + '오작교에서 만나는 날이라고 했어요.',
  },

  /* ★ 오늘 배울 명절 — 벤토에서 가장 큰 칸을 차지한다 */
  {
    id: 'chuseok', name: '추석', when: '음력 8월 15일', big: true, hero: true,
    tint: '#f2c96b', img: 'assets/img/opening-moonrise.jpg',
    tag: '오늘 배울 명절',
    food: '송편 · 햇곡식', play: '강강술래 · 씨름',
    body: '한 해 농사를 거두고 조상께 감사드리는 날이에요. 가장 크고 밝은 보름달 아래에서 '
        + '온 가족이 모입니다.',
  },

  {
    id: 'jungyang', name: '중양절', when: '음력 9월 9일',
    tint: '#e0a458', pos: "72% center", img: 'assets/img/holiday-jungyang.jpg',
    tag: '국화가 한창인 날',
    food: '국화전 · 국화주', play: '단풍놀이',
    body: '좋은 숫자인 9가 두 번 겹치는 날이에요. 산에 올라 단풍을 보고, 노랗게 핀 국화를 '
        + '얹어 국화전을 부쳤습니다.',
  },
  {
    id: 'dongji', name: '동지', when: '양력 12월 22일 무렵',
    tint: '#d9534f', img: 'assets/img/holiday-dongji.jpg',
    tag: '밤이 가장 긴 날',
    food: '팥죽', play: '달력 나누기',
    body: '한 해에서 밤이 가장 긴 날이에요. 붉은 팥죽을 쑤어 나쁜 기운을 쫓았고, '
        + '이날부터 해가 길어져 "작은설"이라고도 불렀어요.',
  },
];

export const HERO = HOLIDAYS.find((h) => h.hero);
