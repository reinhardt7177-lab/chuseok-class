/**
 * 수업에 쓸 삽화 목록과 프롬프트.
 * 모션 영상 대신 정지 이미지를 쓰고, 움직임은 앱에서 CSS로 만든다.
 * (모션 1편 300크레딧 vs 이미지 1장 8크레딧 — 37배 차이)
 *
 * section = 어느 장면에 붙는 그림인지 (lesson.js의 섹션 id)
 * role    = hero(장면 대표) / detail(설명용) / card(활동 카드) / ui(화면 장식)
 * motion  = 앱에서 입힐 CSS 연출
 *   kenburns-in / kenburns-out / pan-left / pan-right / sway / float / still
 * layers  = 이미지 위에 덧씌울 파티클
 *   moonlight / fireflies / leaves / steam / sparks / dust
 */

/** 모든 프롬프트 뒤에 붙는 공통 화풍 — 전체 톤을 통일하는 장치 */
export const STYLE_SUFFIX =
  'Korean traditional folk art meets soft watercolor children book illustration, ' +
  'warm earthy palette of persimmon orange, ink black, jade green and moonlight cream, ' +
  'gentle hand-painted texture with visible paper grain, soft rim light, ' +
  'no text, no letters, no watermark, wholesome and serene mood';

export const NEGATIVE =
  'text, letters, korean text, hangul, chinese characters, watermark, signature, logo, caption, ' +
  'ugly, deformed hands, extra fingers, distorted face, horror, scary, blurry, lowres, ' +
  'photorealistic, photograph, photo, realistic photography, dslr, bokeh photography, 3d render, cgi';

/**
 * 음식·사물처럼 "사진 같은" 소재는 화풍이 사진 쪽으로 끌려간다.
 * 이런 대상은 화풍 지시를 프롬프트 맨 앞으로 옮겨서 먼저 걸어준다.
 */
export const STYLE_PREFIX =
  'A flat hand-painted watercolor illustration in the style of a Korean children picture book, ' +
  'visible brush strokes and paper texture, soft gouache shapes with clean outlines, ' +
  'absolutely not a photograph. The illustration shows: ';

/** 기본 생성 설정 — 교실 프로젝터(16:9) 기준 */
export const DEFAULTS = {
  model: 'lucid-origin',
  width: 1536,
  height: 864,
  quantity: 1,
  mode: 'FAST',
  prompt_enhance: 'OFF',
};

/** 카드·아이템용 정사각 설정 */
export const SQUARE = { width: 1024, height: 1024 };
/** 세로형 (인물·사물 카드) */
export const PORTRAIT = { width: 896, height: 1152 };

export const ASSETS = [
  /* ─────────────── 1. 여는 장면 ─────────────── */
  {
    id: 'opening-moonrise', section: 'opening', role: 'hero', anchor: true,
    scene: '보름달이 뜬 한옥 마을',
    kw: ['보름달', '달이 떴', '큰 달', '마을'],
    motion: 'kenburns-in', layers: ['moonlight', 'fireflies'],
    prompt:
      'An enormous luminous full harvest moon rising over a quiet Korean hanok village at night, ' +
      'curved tiled roofs silhouetted against a deep indigo sky, silver pampas grass swaying in the foreground, ' +
      'warm paper lanterns glowing along a stone path, thin mist drifting low over rice paddies',
  },
  {
    id: 'opening-moon-closeup', section: 'opening', role: 'detail',
    scene: '보름달 클로즈업',
    kw: ['동그랗', '가장 밝', '가장 크고', '달이 가장'],
    motion: 'float', layers: ['moonlight'],
    prompt:
      'Extreme close view of a giant glowing full moon filling the entire frame, ' +
      'soft craters and gentle surface texture painted in cream and pale gold, ' +
      'a few thin wisps of cloud drifting across, deep indigo night sky at the edges',
  },
  {
    id: 'opening-village-far', section: 'opening', role: 'detail',
    scene: '가을 들녘과 마을 원경',
    kw: ['곡식', '거두', '수확', '들녘', '농사'],
    motion: 'pan-right', layers: ['dust'],
    prompt:
      'Wide panoramic view of golden ripe rice fields stretching toward a small Korean village at dusk, ' +
      'straw bundles stacked in the fields, low hills in the distance, ' +
      'a winding dirt path, flocks of birds, amber and rose evening sky',
  },
  {
    id: 'opening-grass', section: 'opening', role: 'detail',
    scene: '달빛 아래 억새',
    kw: ['억새', '가을 하늘', '밤입니다'],
    motion: 'sway', layers: ['moonlight', 'fireflies'],
    prompt:
      'Close foreground of silver pampas grass plumes backlit by moonlight, ' +
      'delicate feathery texture catching pale light, blurred dark hills behind, ' +
      'tiny fireflies floating between the stalks, tranquil autumn night',
  },

  /* ─────────────── 2. 추석은 어떤 날 ─────────────── */
  {
    id: 'family-gathering', section: 'what-is', role: 'hero',
    scene: '마루에 모인 가족',
    kw: ['가족이 모', '온 가족', '함께 보'],
    motion: 'kenburns-out', layers: ['dust'],
    prompt:
      'A warm Korean family of many generations gathered on the wooden floor of a hanok living room, ' +
      'grandparents, parents and children sitting together around a low table laden with holiday food, ' +
      'everyone smiling and talking, autumn sunlight streaming through paper sliding doors, ' +
      'persimmons hanging to dry under the eaves outside',
  },
  {
    id: 'moon-phases', section: 'what-is', role: 'detail',
    scene: '달이 차고 기우는 모습',
    kw: ['차고 기우', '음력', '삭망', '주기'],
    motion: 'still', layers: ['moonlight'],
    prompt:
      'A row of moons across a dark indigo sky showing the lunar cycle from thin crescent ' +
      'to half moon to full moon and back to crescent, evenly spaced in a gentle arc, ' +
      'each moon softly glowing with cream light, tiny stars scattered between, simple and clear',
  },
  {
    id: 'hanok-courtyard', section: 'what-is', role: 'detail',
    scene: '한옥 마당의 가을 볕',
    kw: ['가을의 한가운데', '한가위의'],
    motion: 'kenburns-in', layers: ['leaves', 'dust'],
    prompt:
      'A sunlit hanok courtyard in autumn, large earthenware jars lined along a stone terrace, ' +
      'strings of red persimmons drying under the wooden eaves, a broom leaning by the door, ' +
      'golden ginkgo leaves scattered on the packed earth, peaceful midmorning light',
  },
  {
    id: 'greeting-elders', section: 'what-is', role: 'detail',
    scene: '어른께 인사드리는 아이들',
    kw: ['인사', '어른', '할머니', '할아버지'],
    motion: 'still', layers: ['dust'],
    prompt:
      'Children in colorful hanbok bowing politely to smiling grandparents seated on a warm floor, ' +
      'a low table with tea and rice cakes beside them, folding screen in the background, ' +
      'gentle affectionate atmosphere, soft warm interior light',
  },
  {
    id: 'homecoming-road', section: 'what-is', role: 'detail',
    scene: '고향으로 가는 길',
    kw: ['고향', '멀리 사는', '날짜가 바뀝', '밀리는'],
    motion: 'pan-left', layers: ['dust'],
    prompt:
      'A winding country road at golden hour with a family walking home carrying wrapped gift boxes ' +
      'and bundles, autumn trees lining the road, distant village rooftops and a rising pale moon, ' +
      'long soft shadows, nostalgic warm feeling',
  },
  {
    id: 'harvest-basket', section: 'what-is', role: 'card',
    scene: '수확 바구니', ...SQUARE,
    kw: ['맛있는 음식', '나누'],
    motion: 'float', layers: [],
    prompt:
      'A generous woven bamboo basket overflowing with freshly harvested Korean autumn produce, ' +
      'chestnuts, jujubes, ripe persimmons, asian pears and rice stalks, ' +
      'arranged on a plain warm cream background, simple centered composition',
  },

  /* ─────────────── 3. 유래 · 가배 ─────────────── */
  {
    id: 'silla-weaving', section: 'origin', role: 'hero',
    scene: '신라의 길쌈 대회',
    kw: ['길쌈', '베 짜기', '겨루', '짰는지'],
    motion: 'pan-right', layers: ['dust'],
    prompt:
      'Ancient Silla dynasty scene, two teams of women in flowing hanbok weaving hemp cloth on wooden looms ' +
      'in a palace courtyard, baskets of thread and woven fabric stacked beside them, ' +
      'a royal princess overseeing the contest from a pavilion, autumn trees, historical Korean painting mood',
  },
  {
    id: 'silla-palace', section: 'origin', role: 'detail',
    scene: '신라의 궁궐',
    kw: ['신라', '유리왕', '유리이사금', '6부'],
    motion: 'kenburns-in', layers: ['dust'],
    prompt:
      'A majestic ancient Silla palace complex with sweeping tiled roofs and painted wooden brackets, ' +
      'stone stairways and courtyards, pine trees and distant mountains, ' +
      'banners fluttering, early morning haze, grand historical atmosphere',
  },
  {
    id: 'weaving-loom', section: 'origin', role: 'detail',
    scene: '베틀과 실',
    kw: ['베는', '실', '옷감', '한 달 동안'],
    motion: 'kenburns-in', layers: ['dust'],
    prompt:
      'Close intimate view of hands working a traditional Korean wooden loom, ' +
      'fine hemp threads stretched taut, a shuttle mid motion, spools of natural fiber nearby, ' +
      'warm lamplight, rich texture of wood and thread, quiet concentration',
  },
  {
    id: 'silla-feast', section: 'origin', role: 'detail',
    scene: '진 편이 대접한 잔치',
    kw: ['대접', '노래하고', '춤', '잔치', '가배'],
    motion: 'sway', layers: ['sparks'],
    prompt:
      'A joyful ancient Korean outdoor feast at night, women in hanbok sharing food and drink at long low tables, ' +
      'some dancing and singing together in a loose circle, musicians with drums at the side, ' +
      'torches and lanterns casting warm light, everyone celebrating together regardless of who won',
  },
  {
    id: 'old-book', section: 'origin', role: 'card',
    scene: '옛 역사책', ...SQUARE,
    kw: ['삼국사기', '기록', '회소곡', '단정'],
    motion: 'float', layers: ['dust'],
    prompt:
      'An old Korean bound book with thread stitching lying open on a wooden desk, ' +
      'aged cream paper with faint ink brush strokes suggested but unreadable, ' +
      'an ink stone and brush resting beside it, soft window light, scholarly and quiet',
  },

  /* ─────────────── 4. 음식 ─────────────── */
  {
    id: 'songpyeon-steam', section: 'food', role: 'hero',
    scene: '송편 빚기와 찜기',
    kw: ['송편을 만들', '떡이 바로', '송편이지요'],
    motion: 'kenburns-in', layers: ['steam'],
    prompt:
      'Close warm view of hands shaping half-moon shaped songpyeon rice cakes on a wooden board, ' +
      'small bowls of sesame, sweet bean and chestnut filling nearby, ' +
      'a bamboo steamer lined with green pine needles releasing soft white steam, ' +
      'freshly harvested chestnuts jujubes and persimmons in a basket at the side',
  },
  {
    id: 'songpyeon-shaping', section: 'food', role: 'detail',
    scene: '송편을 빚는 손',
    kw: ['반죽', '빚어', '빚습니다', '조물조물'],
    motion: 'kenburns-in', layers: [],
    prompt:
      'Very close view of two hands pressing and folding a small ball of white rice dough ' +
      'into a neat half moon shape, a tiny spoon of sesame filling at the center, ' +
      'flour dusted wooden board, soft natural light, tender and careful gesture',
  },
  {
    id: 'songpyeon-colors', section: 'food', role: 'detail',
    scene: '오색 송편',
    kw: ['반달 모양', '예쁘게', '반달은'],
    motion: 'float', layers: ['steam'],
    prompt:
      'A beautiful arrangement of colorful songpyeon rice cakes in white, soft pink, pale green, ' +
      'yellow and light purple, each a neat half moon shape, resting on fresh green pine needles ' +
      'in a shallow wooden bowl, gentle steam rising, appetizing and festive',
  },
  {
    id: 'pine-needles', section: 'food', role: 'card',
    scene: '솔잎', ...SQUARE,
    kw: ['솔잎'],
    motion: 'still', layers: ['steam'],
    prompt:
      'A generous bed of fresh green pine needles filling the frame, ' +
      'each needle crisp and detailed, a few small white rice cakes nestled among them, ' +
      'faint steam, fresh and fragrant feeling, plain soft background',
  },
  {
    id: 'toran-soup', section: 'food', role: 'card',
    scene: '토란국', ...SQUARE,
    kw: ['토란'],
    motion: 'still', layers: ['steam'],
    prompt:
      'A warm bowl of clear Korean taro soup with tender taro chunks, beef slices and scallion, ' +
      'served in a simple ceramic bowl on a wooden table, gentle steam rising, ' +
      'a brass spoon resting beside, comforting home cooked feeling',
  },
  {
    id: 'jeon-frying', section: 'food', role: 'detail',
    scene: '전 부치기',
    kw: ['전을', '부치'],
    motion: 'kenburns-out', layers: ['steam'],
    prompt:
      'Korean savory pancakes being pan fried on a flat griddle, golden edges crisping, ' +
      'zucchini rounds, fish fillets and skewers coated in egg batter, ' +
      'a hand turning one with chopsticks, warm kitchen light, sizzling and homey',
  },
  {
    id: 'hwayangjeok', section: 'food', role: 'card',
    scene: '화양적 꼬치', ...SQUARE,
    kw: ['화양적', '꼬치'],
    motion: 'still', layers: [],
    prompt:
      'Elegant Korean skewers arranged on a white ceramic plate, each threaded with ' +
      'colorful strips of beef, carrot, mushroom, scallion and yellow egg in neat repeating order, ' +
      'the five traditional colors clearly visible, refined and festive presentation',
  },
  {
    id: 'fresh-fruits', section: 'food', role: 'detail',
    scene: '햇과일 한 상',
    kw: ['햇과일', '밤, 대추', '밤과 대추', '과일도'],
    motion: 'float', layers: ['dust'],
    prompt:
      'An abundant spread of fresh Korean autumn fruit on a wooden table, ' +
      'glossy orange persimmons, large golden asian pears, glossy red jujubes, ' +
      'chestnuts spilling from a cloth, a few grape clusters, warm natural light, bountiful',
  },
  {
    id: 'chestnut-jujube', section: 'food', role: 'card',
    scene: '밤과 대추', ...SQUARE,
    kw: ['깨나 콩', '깨, 콩', '소라고', '소를 넣'],
    motion: 'still', layers: [],
    prompt:
      'A close still life of glossy brown chestnuts and deep red dried jujubes ' +
      'grouped on a plain cream surface, a spiky chestnut burr split open beside them, ' +
      'simple uncluttered composition, rich warm color',
  },
  {
    id: 'rice-harvest', section: 'food', role: 'detail',
    scene: '햅쌀 추수',
    kw: ['거둔 것', '수확', '천신', '거둔 곡식'],
    motion: 'pan-right', layers: ['dust'],
    prompt:
      'Farmers harvesting golden rice in a wide autumn field, bundled rice sheaves standing in rows, ' +
      'a woman carrying a bundle on her head, blue sky with high thin clouds, ' +
      'distant mountains, honest hardworking and abundant feeling',
  },
  {
    id: 'rice-grains', section: 'food', role: 'card',
    scene: '햅쌀', ...SQUARE,
    kw: ['햅쌀', '처음 딴', '처음 수확'],
    motion: 'still', layers: [],
    prompt:
      'A close view of freshly milled white rice grains heaped in a shallow wooden bowl, ' +
      'a few golden rice stalks with full heads laid beside, ' +
      'soft warm light showing the pearly texture of each grain, plain background',
  },

  /* ─────────────── 5. 풍습 ─────────────── */
  {
    id: 'charye-table', section: 'customs', role: 'hero',
    scene: '차례상',
    kw: ['차례상', '상을 차려', '상차림'],
    motion: 'pan-left', layers: ['dust'],
    prompt:
      'A carefully arranged Korean ancestral memorial table seen from a respectful angle, ' +
      'neat rows of brass bowls, stacked fruit, pan fried jeon, rice cakes and a small incense burner with thin smoke, ' +
      'a folding screen behind, morning light through hanji paper doors, quiet and reverent atmosphere',
  },
  {
    id: 'charye-bowing', section: 'customs', role: 'detail',
    scene: '차례를 지내는 가족',
    kw: ['차례', '인사드려', '제사', '절'],
    motion: 'still', layers: ['dust'],
    prompt:
      'A family in traditional hanbok bowing together before a memorial table in a hanok room, ' +
      'seen from behind and slightly to the side so the gesture reads clearly, ' +
      'soft morning light through paper doors, incense smoke curling upward, solemn and warm',
  },
  {
    id: 'seongmyo', section: 'customs', role: 'detail',
    scene: '성묘',
    kw: ['성묘', '산소에 가', '산소를 찾'],
    motion: 'kenburns-out', layers: ['dust', 'leaves'],
    prompt:
      'A family visiting an ancestral grave mound on a grassy hillside in autumn, ' +
      'a small offering of fruit and rice cakes placed on a cloth, everyone bowing respectfully, ' +
      'pine trees and rolling hills beyond, clear blue autumn sky, peaceful and tender',
  },
  {
    id: 'beolcho', section: 'customs', role: 'detail',
    scene: '벌초',
    kw: ['벌초', '풀을 베'],
    motion: 'pan-right', layers: ['dust'],
    prompt:
      'People tidying a grassy ancestral burial mound before the holiday, ' +
      'cutting and raking the long grass with simple tools, a water bottle and hats resting nearby, ' +
      'warm late summer sunlight, green hillside, quiet diligent care',
  },
  {
    id: 'incense-burner', section: 'customs', role: 'card',
    scene: '향로', ...SQUARE,
    kw: ['고맙습니다', '고마워하는', '기억하고'],
    motion: 'float', layers: ['steam'],
    prompt:
      'A small brass incense burner on a wooden stand with a single stick of incense ' +
      'sending up a thin graceful ribbon of smoke, plain dark background, ' +
      'warm metallic highlights, still and contemplative',
  },
  {
    id: 'fruit-arrangement', section: 'customs', role: 'detail',
    scene: '과일 놓는 자리',
    kw: ['홍동백서', '붉은 과일', '조율이시', '어동육서', '놓는 자리', '놓기'],
    motion: 'still', layers: [],
    prompt:
      'Neatly stacked ceremonial fruit on brass footed dishes arranged in a straight row, ' +
      'red jujubes, brown chestnuts, golden pears and orange persimmons each in their own dish, ' +
      'viewed straight on against a folding screen, orderly and dignified',
  },
  {
    id: 'hanbok-family', section: 'customs', role: 'detail',
    scene: '한복 입은 가족',
    kw: ['집집마다', '간단히', '지내지 않', '문헌마다', '가가례', '표준안'],
    motion: 'kenburns-in', layers: ['dust'],
    prompt:
      'A cheerful family portrait in beautiful traditional hanbok of many colors, ' +
      'grandparents, parents and children standing together in a hanok courtyard, ' +
      'everyone smiling warmly at the viewer, autumn foliage behind, bright and joyful',
  },
  {
    id: 'hanji-door', section: 'customs', role: 'card',
    scene: '한지 문살', ...PORTRAIT,
    kw: ['음식을 올리'],
    motion: 'still', layers: ['dust'],
    prompt:
      'A traditional Korean hanji paper sliding door with a delicate wooden lattice grid, ' +
      'warm morning light glowing through the translucent paper, ' +
      'a soft shadow of tree branches cast across it, serene and minimal',
  },

  /* ─────────────── 6. 놀이 ─────────────── */
  {
    id: 'ganggangsullae', section: 'play', role: 'hero',
    scene: '강강술래',
    kw: ['강강술래는', '둥글게 돌며', '손을 잡고 둥글게', '달이 밝은'],
    motion: 'sway', layers: ['moonlight', 'fireflies'],
    prompt:
      'Women and girls in colorful hanbok holding hands in a wide joyful circle dancing under an enormous full moon, ' +
      'seen from a slightly elevated angle so the circle reads clearly, ' +
      'a grassy field by the sea at night, skirts and ribbons swirling with motion, ' +
      'bonfire light warming their faces, celebratory and free',
  },
  {
    id: 'ganggangsullae-above', section: 'play', role: 'detail',
    scene: '위에서 본 강강술래',
    kw: ['빙글빙글', '돌면서', '둥근 모양', '보름달을 닮', '선후창'],
    motion: 'float', layers: ['moonlight'],
    prompt:
      'A graceful overhead view of dancers in colorful hanbok forming a perfect circle on dark grass, ' +
      'their skirts spreading like flower petals, hands joined all around, ' +
      'moonlight pooling in the center of the ring, decorative and rhythmic composition',
  },
  {
    id: 'ssireum', section: 'play', role: 'detail',
    scene: '씨름',
    kw: ['씨름'],
    motion: 'kenburns-in', layers: ['dust'],
    prompt:
      'Two Korean wrestlers gripping each others satba belts in a sandy ring, ' +
      'muscles tensed in a balanced struggle, a lively crowd of villagers cheering around the edge, ' +
      'a prize bull tethered nearby, bright autumn afternoon, dynamic and energetic',
  },
  {
    id: 'tug-of-war', section: 'play', role: 'detail',
    scene: '줄다리기',
    kw: ['줄다리기', '줄을 당', '힘겨루기', '두 편으로 갈라'],
    motion: 'pan-left', layers: ['dust'],
    prompt:
      'Two long lines of villagers pulling a massive braided straw rope in opposite directions, ' +
      'faces full of effort and laughter, colorful flags and banners overhead, ' +
      'a wide open field with golden rice paddies beyond, festive communal energy',
  },
  {
    id: 'folk-games', section: 'play', role: 'detail',
    scene: '마을 잔치 전경',
    kw: ['다 같이', '마을', '잔치', '하나로 모이'],
    motion: 'pan-right', layers: ['dust'],
    prompt:
      'A lively Korean autumn village festival field seen wide, several games happening at once, ' +
      'wrestling in a sandy ring, a seesaw board, a rope pull, musicians with drums and gongs parading, ' +
      'colorful banners, food stalls, golden fields beyond, bustling and happy',
  },
  {
    id: 'neolttwigi', section: 'play', role: 'detail',
    scene: '널뛰기',
    kw: ['널뛰기', '더 재미'],
    motion: 'sway', layers: ['leaves'],
    prompt:
      'Two girls in bright hanbok playing on a traditional Korean seesaw plank, ' +
      'one launched high into the air with skirts billowing, the other landing, ' +
      'a hanok courtyard with autumn trees, onlookers clapping, joyful motion and color',
  },
  {
    id: 'bull-fight', section: 'play', role: 'card',
    scene: '소싸움', ...SQUARE,
    kw: ['소싸움', '풍년이 든다'],
    motion: 'still', layers: ['dust'],
    prompt:
      'Two sturdy Korean bulls with locked horns in a dusty village ring, ' +
      'handlers and a crowd watching from behind a wooden fence, ' +
      'warm dust kicked up around their hooves, rural autumn setting, sturdy and traditional',
  },
  {
    id: 'geobuk-nori', section: 'play', role: 'card',
    scene: '거북놀이', ...SQUARE,
    kw: ['거북놀이', '남생아', '청어', '문지기'],
    motion: 'sway', layers: ['leaves'],
    prompt:
      'Village children playing under a large turtle costume woven from dried corn husks and straw, ' +
      'other children and adults following behind laughing and clapping, ' +
      'walking along a village lane with tiled roofs, playful folk tradition',
  },
  {
    id: 'drums-pungmul', section: 'play', role: 'detail',
    scene: '풍물놀이',
    kw: ['앞소리', '뒷소리', '메기', '받지요', '받는 소리', '장단', '진양조', '빨라', '함께 외쳐', '강강술래!'],
    motion: 'sway', layers: ['sparks', 'dust'],
    prompt:
      'A spirited Korean folk percussion troupe parading in white costumes with colorful sashes, ' +
      'players striking barrel drums, hourglass drums and small gongs, ' +
      'long white streamers spinning from their hats, motion and rhythm everywhere, festive energy',
  },

  /* ─────────────── 7. 소원 ─────────────── */
  {
    id: 'moon-wish', section: 'wish', role: 'hero',
    scene: '보름달에 소원을 비는 밤',
    kw: ['소원을 빌', '소원을 빌어요', '달맞이'],
    motion: 'float', layers: ['moonlight', 'sparks'],
    prompt:
      'Children seen from behind standing on a small hill at night, hands pressed together in wish making, ' +
      'looking up at a giant glowing full moon that fills the sky, ' +
      'tiny golden light motes drifting upward around them, silver grass and a lone pine tree, ' +
      'deeply peaceful and hopeful',
  },
  {
    id: 'moon-rabbit', section: 'wish', role: 'detail',
    scene: '달토끼',
    kw: ['특별한 힘', '믿었'],
    motion: 'float', layers: ['moonlight', 'sparks'],
    prompt:
      'A charming white rabbit inside the glowing full moon pounding rice cake with a wooden mallet ' +
      'in a stone mortar, a cassia tree beside it, the whole scene rendered as a soft luminous ' +
      'silhouette within the moon disc, whimsical storybook feeling',
  },
  {
    id: 'wish-lanterns', section: 'wish', role: 'detail',
    scene: '소원 등불',
    kw: ['풍년', '건강', '안녕'],
    motion: 'float', layers: ['sparks', 'fireflies'],
    prompt:
      'Dozens of warm glowing paper lanterns floating upward into a deep night sky, ' +
      'people below watching with upturned faces, a full moon behind them, ' +
      'golden light reflecting on a still pond, magical and hopeful',
  },
  {
    id: 'moon-giant', section: 'wish', role: 'detail',
    scene: '하늘을 채운 보름달',
    kw: ['가장 둥근 달', '먼저 본'],
    motion: 'kenburns-in', layers: ['moonlight'],
    prompt:
      'An enormous full moon dominating the frame low on the horizon, ' +
      'a tiny silhouetted village and a few pine trees at the very bottom for scale, ' +
      'the moon glowing cream and pale gold against deep indigo, awe inspiring and still',
  },
  {
    id: 'wish-paper', section: 'wish', role: 'card',
    scene: '소원을 적은 종이', ...SQUARE,
    kw: ['모아', '적어', '우리 반'],
    motion: 'sway', layers: ['sparks'],
    prompt:
      'Small blank strips of warm cream hanji paper tied to a bare tree branch with red thread, ' +
      'fluttering gently, completely blank with no writing on them, ' +
      'soft bokeh lantern light behind, hopeful and delicate',
  },

  /* ─────────────── 8. 오늘날의 추석 ─────────────── */
  {
    id: 'modern-chuseok', section: 'today', role: 'hero',
    scene: '달라진 명절 풍경',
    kw: ['요즘', '달라졌', '간소화'],
    motion: 'kenburns-out', layers: ['dust'],
    prompt:
      'A cozy modern Korean apartment living room at dusk with a small family ' +
      'video calling relatives on a tablet propped on the table, a simple plate of songpyeon beside it, ' +
      'city skyline and a full moon visible through the window, warm lamp light, tender and modern',
  },
  {
    id: 'video-call', section: 'today', role: 'detail',
    scene: '영상통화로 만나는 가족',
    kw: ['영상통화', '안부'],
    motion: 'kenburns-in', layers: [],
    prompt:
      'A close warm view of a tablet screen showing smiling grandparents waving, ' +
      'a child waving back at the camera from the near side, a plate of rice cakes on the table, ' +
      'soft indoor evening light, affectionate and contemporary',
  },
  {
    id: 'highway-traffic', section: 'today', role: 'detail',
    scene: '귀성길',
    kw: ['귀성', '고향에 모여', '시골'],
    motion: 'pan-right', layers: ['dust'],
    prompt:
      'A long line of cars on a Korean highway at sunset during the holiday exodus, ' +
      'seen from a gentle elevated angle, autumn mountains on both sides, ' +
      'warm amber sky and tail lights glowing, patient and hopeful mood',
  },
  {
    id: 'airport-travel', section: 'today', role: 'detail',
    scene: '명절 여행',
    kw: ['여행'],
    motion: 'kenburns-out', layers: [],
    prompt:
      'A bright modern airport departure hall with families rolling suitcases, ' +
      'large windows showing a plane and an evening sky with a pale moon, ' +
      'cheerful travelers of different ages, clean contemporary illustration style',
  },
  {
    id: 'solo-chuseok', section: 'today', role: 'detail',
    scene: '혼자 맞는 추석',
    kw: ['1인 가구', '혼자', '집에서', '쉬는'],
    motion: 'kenburns-in', layers: ['dust'],
    prompt:
      'A cozy small apartment at night, one young person sitting comfortably by a window ' +
      'with a warm cup and a small plate of rice cakes, a cat curled nearby, ' +
      'the full moon visible outside, soft lamp light, calm and content rather than lonely',
  },
  {
    id: 'diverse-families', section: 'today', role: 'detail',
    scene: '다양한 가족',
    kw: ['다양', '한 부모', '조손', '다문화', '가족의 모습', '가족의 형태', '구성원'],
    motion: 'float', layers: ['dust'],
    prompt:
      'A warm illustration showing several different Korean family groups side by side, ' +
      'a grandparent with a grandchild, a single parent with two kids, a multicultural family, ' +
      'a couple with no children, each group smiling and sharing holiday food, ' +
      'equal visual weight for all, inclusive and warm',
  },
  {
    id: 'market-shopping', section: 'today', role: 'detail',
    scene: '명절 장보기',
    kw: ['명절 노동', '몰리는'],
    motion: 'pan-left', layers: ['dust'],
    prompt:
      'A bustling traditional Korean market before the holiday, stalls piled with fruit, ' +
      'rice cakes, dried fish and vegetables under striped awnings, ' +
      'shoppers carrying full bags, vendors calling out, lively colorful crowded scene',
  },
  {
    id: 'sharing-food', section: 'today', role: 'card',
    scene: '나눔', ...SQUARE,
    kw: ['마음을 나', '고마움을 나', '고마운 사람', '정답은 없', '괜찮'],
    motion: 'float', layers: [],
    prompt:
      'Two pairs of hands passing a wrapped box of holiday food to each other, ' +
      'a simple warm gesture of giving centered in the frame, ' +
      'soft neutral background, tied cloth wrapping in traditional pattern, generous and kind',
  },

  /* ─────────────── 9. 마무리 ─────────────── */
  {
    id: 'wrap-lantern', section: 'wrap', role: 'hero',
    scene: '등불이 켜진 길',
    kw: ['정리해', '많이 배웠'],
    motion: 'kenburns-in', layers: ['fireflies', 'sparks'],
    prompt:
      'A gentle night path lined with glowing paper lanterns leading toward a distant full moon, ' +
      'autumn leaves scattered on the stones, a hanok gate half open at the end of the path, ' +
      'soft bokeh lights, quiet closing mood, inviting and warm',
  },
  {
    id: 'thank-you-scene', section: 'wrap', role: 'detail',
    scene: '고마움을 전하는 마음',
    kw: ['알려줘', '가족에게'],
    motion: 'float', layers: ['sparks'],
    prompt:
      'A child handing a small hand drawn card to a smiling grandparent, ' +
      'both seated on a warm wooden floor with tea between them, ' +
      'soft evening light through a paper door, quiet gratitude, gentle and moving',
  },
  {
    id: 'moon-farewell', section: 'wrap', role: 'detail',
    scene: '달에게 인사',
    kw: ['생각을 적', '생각하게 된', '둘 다'],
    motion: 'kenburns-out', layers: ['moonlight', 'fireflies'],
    prompt:
      'A wide calm night landscape with the full moon high above a sleeping village, ' +
      'a single lit window, silver grass swaying, the path empty and peaceful, ' +
      'deep blue and cream palette, a sense of a good day ending well',
  },


  /* ─────────────── 내용을 늘리며 추가한 컷들 ─────────────── */
  {
    id: 'opening-children-look', section: 'opening', role: 'detail',
    scene: '달을 올려다보는 아이들',
    kw: ['하늘을 봐', '이야기를 들어', '올려다'],
    motion: 'kenburns-in', layers: ['moonlight', 'fireflies'],
    prompt:
      'Two children lying on their backs on a grassy hill at night looking straight up at a huge full moon, ' +
      'seen from the side so their upturned faces catch the moonlight, ' +
      'wide open sky, silver grass around them, wonder and quiet joy',
  },
  {
    id: 'opening-lantern-path', section: 'opening', role: 'detail',
    scene: '등불이 켜진 마을 길',
    kw: ['추석이라고', '그날이 바로', '한가위만'],
    motion: 'pan-right', layers: ['fireflies', 'sparks'],
    prompt:
      'A narrow village lane at night lined with warm glowing paper lanterns on wooden posts, ' +
      'stone walls and tiled roofs on both sides, a cat sitting on a wall, ' +
      'the full moon visible above the rooftops, cozy and welcoming',
  },
  {
    id: 'two-holidays', section: 'what-is', role: 'detail',
    scene: '설날과 추석',
    kw: ['중추절', '오봉', '다른 나라', '비슷한 시기', '새 옷'],
    motion: 'still', layers: ['dust'],
    prompt:
      'A simple two part illustration side by side, on the left a snowy winter scene with a hanok ' +
      'and children in thick hanbok bowing, on the right an autumn scene with golden fields and a full moon, ' +
      'clearly divided down the middle, balanced composition, easy to read at a glance',
  },
  {
    id: 'silla-two-teams', section: 'origin', role: 'detail',
    scene: '두 편으로 나뉜 사람들',
    kw: ['두 편', '나뉘', '나누었'],
    motion: 'pan-left', layers: ['dust'],
    prompt:
      'Ancient Korean women in hanbok gathered in two distinct groups facing each other across a courtyard, ' +
      'one group wearing warmer red tones and the other cooler blue tones so the two teams read clearly, ' +
      'baskets of thread between them, a friendly competitive mood, palace buildings behind',
  },
  {
    id: 'silla-princess', section: 'origin', role: 'detail',
    scene: '왕녀가 이끄는 모습',
    kw: ['왕의 두 딸', '왕녀', '이끌'],
    motion: 'kenburns-in', layers: ['dust'],
    prompt:
      'A young Silla princess in elegant royal hanbok standing on a pavilion step, ' +
      'gesturing warmly toward women working at looms below her, ' +
      'attendants beside her holding rolls of woven cloth, dignified and kind, historical Korean painting mood',
  },
  {
    id: 'kids-circle-dance', section: 'play', role: 'detail',
    scene: '아이들의 강강술래',
    kw: ['손을 잡고', '둥글게 서', '유네스코'],
    motion: 'sway', layers: ['moonlight', 'fireflies'],
    prompt:
      'Elementary school children of mixed ages in colorful hanbok holding hands in a circle on a playground at dusk, ' +
      'laughing and leaning back as they spin, a big full moon rising behind them, ' +
      'lively and modern yet traditional, joyful energy',
  },
  {
    id: 'wish-hands', section: 'wish', role: 'card', width: 1024, height: 1024,
    scene: '소원을 비는 두 손',
    kw: ['두 손', '눈을 감', '마음속', '소리 내어'],
    motion: 'float', layers: ['sparks'],
    prompt:
      'Close view of a child two small hands pressed together in front of the chest in a wish making gesture, ' +
      'warm golden moonlight falling on them, tiny light motes floating around, ' +
      'soft dark background, tender and sincere',
  },
  {
    id: 'wrap-telling-family', section: 'wrap', role: 'detail',
    scene: '가족에게 알려주는 아이',
    kw: ['기억에 남는', '한 문장으로'],
    motion: 'kenburns-in', layers: ['dust'],
    prompt:
      'A child excitedly explaining something to grandparents and parents at a low table, ' +
      'gesturing with both hands while the family listens with warm amused smiles, ' +
      'a plate of rice cakes and tea on the table, cozy evening room, affectionate',
  },
  {
    id: 'wrap-calendar', section: 'wrap', role: 'card', width: 1024, height: 1024,
    scene: '달력에 표시한 추석',
    kw: ['문제를 풀', '퀴즈로 확인', 'O 또는 X', '먼저 퀴즈'],
    motion: 'still', layers: [],
    prompt:
      'A simple wall calendar page with one date circled in warm orange crayon, ' +
      'a small drawing of a full moon and a half moon shaped rice cake doodled beside it, ' +
      'no readable text or numbers anywhere, plain wall behind, childlike and warm',
  },
  {
    id: 'wrap-moon-together', section: 'wrap', role: 'detail',
    scene: '함께 보는 보름달',
    kw: ['틀려도', '다시 배우'],
    motion: 'kenburns-out', layers: ['moonlight', 'fireflies'],
    prompt:
      'A family of several generations standing together on a rooftop or terrace seen from behind, ' +
      'all looking up at an enormous full moon, arms around each other, ' +
      'city and village lights below, deeply warm and peaceful closing image',
  },

  /* ─────────────── UI 장식 ─────────────── */
  {
    id: 'byeongpung', section: 'ui', role: 'ui',
    kw: [],
    scene: '차례상 뒤 병풍',
    motion: 'still', layers: [],
    prompt:
      'A traditional Korean folding screen seen straight from the front, filling the whole frame, ' +
      'six tall panels divided by thin dark wooden frames, ' +
      'each panel painted with a quiet ink landscape of pine trees, distant mountains and a pale moon, ' +
      'muted cream silk with soft ink washes, symmetrical and calm, no people',
  },
  {
    id: 'ritual-table', section: 'ui', role: 'ui',
    kw: [],
    scene: '차례상 상판',
    motion: 'still', layers: [],
    prompt:
      'The top surface of a traditional Korean lacquered ritual table seen straight from the front at a low angle, ' +
      'warm reddish brown wood with a smooth sheen and a simple raised edge, ' +
      'empty with nothing on it, plain dark background above and below',
  },
  {
    id: 'student-welcome', section: 'ui', role: 'ui',
    scene: '학생 접속 화면 배경',
    motion: 'float', layers: ['moonlight'],
    prompt:
      'A friendly inviting illustration of a round full moon with a cute rabbit pounding rice cake ' +
      'in the moon shadow, surrounded by soft clouds and tiny stars, ' +
      'simple uncluttered composition with generous empty space at the center for an interface, ' +
      'cheerful and childlike',
  },
  {
    id: 'landing-hero', section: 'ui', role: 'ui',
    scene: '첫 화면 배경',
    motion: 'kenburns-in', layers: ['moonlight', 'fireflies'],
    prompt:
      'A sweeping wide night scene of a Korean village under an enormous full moon, ' +
      'rice fields, hanok rooftops and lantern lit paths spreading across the lower third, ' +
      'the upper half mostly open indigo sky with room for a title, ' +
      'rich atmospheric depth, cinematic and beautiful',
  },
  {
    id: 'quiz-backdrop', section: 'ui', role: 'ui',
    scene: '퀴즈 화면 배경',
    motion: 'float', layers: ['sparks'],
    prompt:
      'A soft abstract backdrop of deep indigo with a large faint moon shape offset to one side, ' +
      'scattered tiny stars and a few drifting pine needles and rice grains, ' +
      'very low contrast and uncluttered so interface elements can sit on top, calm and spacious',
  },
  {
    id: 'loading-moon', section: 'ui', role: 'ui', ...SQUARE,
    scene: '로딩 화면',
    motion: 'float', layers: ['moonlight'],
    prompt:
      'A simple charming full moon with a tiny rabbit silhouette, centered on a plain deep indigo field, ' +
      'a few small stars around it, very clean minimal composition, gentle glow',
  },
];

export const ASSET_BY_ID = Object.fromEntries(ASSETS.map((a) => [a.id, a]));

/** 섹션별로 묶어 보기 */
export function assetsBySection(sectionId) {
  return ASSETS.filter((a) => a.section === sectionId);
}

/**
 * 사진체로 끌려가기 쉬운 소재들 — 화풍 지시를 앞뒤로 모두 건다.
 * 1차 생성에서 실제로 사진처럼 나온 것들을 골라냈다.
 */
export const NEEDS_STYLE_BOOST = new Set([
  'songpyeon-steam', 'songpyeon-shaping', 'pine-needles', 'toran-soup', 'jeon-frying',
  'hwayangjeok', 'fresh-fruits', 'chestnut-jujube', 'rice-harvest', 'rice-grains',
  'incense-burner', 'highway-traffic', 'charye-table', 'harvest-basket', 'old-book',
]);

/** 프롬프트 = (필요하면 화풍 선언 +) 장면 설명 + 공통 화풍 */
export function fullPrompt(asset) {
  const prefix = NEEDS_STYLE_BOOST.has(asset.id) ? STYLE_PREFIX : '';
  return `${prefix}${asset.prompt}. ${STYLE_SUFFIX}`;
}
