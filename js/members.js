/**
 * 坂道グループ メンバーデータベース
 * 乃木坂46 / 日向坂46 / 櫻坂46
 */

const GROUPS = [
  { id: "nogizaka", name: "乃木坂46", color: "#7b2d8e" },
  { id: "hinatazaka", name: "日向坂46", color: "#59c0e8" },
  { id: "sakurazaka", name: "櫻坂46", color: "#f0a0b8" },
];

const MEMBERS = [
  // ============================================================
  // 乃木坂46
  // ============================================================
  // --- 3期生 ---
  { name: "久保史緒里", kana: "くぼ しおり", romaji: "kubo_shiori", gen: 3, group: "nogizaka", ct: 36753 },
  { name: "山下美月", kana: "やました みづき", romaji: "yamashita_mizuki", gen: 3, group: "nogizaka", ct: 36758 },
  { name: "与田祐希", kana: "よだ ゆうき", romaji: "yoda_yuuki", gen: 3, group: "nogizaka", ct: 36760 },
  // --- 4期生 ---
  { name: "遠藤さくら", kana: "えんどう さくら", romaji: "endou_sakura", gen: 4, group: "nogizaka", ct: 48006 },
  { name: "賀喜遥香", kana: "かき はるか", romaji: "kaki_haruka", gen: 4, group: "nogizaka", ct: 48008 },
  { name: "金川紗耶", kana: "かながわ さや", romaji: "kanagawa_saya", gen: 4, group: "nogizaka", ct: 48010 },
  { name: "黒見明香", kana: "くろみ はるか", romaji: "kuromi_haruka", gen: 4, group: "nogizaka", ct: 55383 },
  { name: "佐藤璃果", kana: "さとう りか", romaji: "satou_rika", gen: 4, group: "nogizaka", ct: 55384 },
  { name: "清宮レイ", kana: "せいみや れい", romaji: "seimiya_rei", gen: 4, group: "nogizaka", ct: 48014 },
  { name: "田村真佑", kana: "たむら まゆ", romaji: "tamura_mayu", gen: 4, group: "nogizaka", ct: 48015 },
  { name: "筒井あやめ", kana: "つつい あやめ", romaji: "tsutsui_ayame", gen: 4, group: "nogizaka", ct: 48017 },
  { name: "早川聖来", kana: "はやかわ せいら", romaji: "hayakawa_seira", gen: 4, group: "nogizaka", ct: 48018 },
  { name: "矢久保美緒", kana: "やくぼ みお", romaji: "yakubo_mio", gen: 4, group: "nogizaka", ct: 48019 },
  // --- 5期生 ---
  { name: "五百城茉央", kana: "いおき まお", romaji: "ioki_mao", gen: 5, group: "nogizaka", ct: 55396 },
  { name: "池田瑛紗", kana: "いけだ てれさ", romaji: "ikeda_teresa", gen: 5, group: "nogizaka", ct: 55397 },
  { name: "一ノ瀬美空", kana: "いちのせ みく", romaji: "ichinose_miku", gen: 5, group: "nogizaka", ct: 55390 },
  { name: "井上和", kana: "いのうえ なぎ", romaji: "inoue_nagi", gen: 5, group: "nogizaka", ct: 55389 },
  { name: "岡本姫奈", kana: "おかもと ひな", romaji: "okamoto_hina", gen: 5, group: "nogizaka", ct: 55401 },
  { name: "小川彩", kana: "おがわ あや", romaji: "ogawa_aya", gen: 5, group: "nogizaka", ct: 55392 },
  { name: "奥田いろは", kana: "おくだ いろは", romaji: "okuda_iroha", gen: 5, group: "nogizaka", ct: 55394 },
  { name: "川﨑桜", kana: "かわさき さくら", romaji: "kawasaki_sakura", gen: 5, group: "nogizaka", ct: 55400 },
  { name: "菅原咲月", kana: "すがわら さつき", romaji: "sugawara_satsuki", gen: 5, group: "nogizaka", ct: 55391 },
  { name: "冨里奈央", kana: "とみさと なお", romaji: "tomisato_nao", gen: 5, group: "nogizaka", ct: 55393 },
  { name: "中西アルノ", kana: "なかにし あるの", romaji: "nakanishi_aruno", gen: 5, group: "nogizaka", ct: 55395 },

  // ============================================================
  // 日向坂46
  // ============================================================
  // --- 1期生 ---
  { name: "佐々木久美", kana: "ささき くみ", romaji: "sasaki_kumi", gen: 1, group: "hinatazaka", ct: 7 },
  { name: "佐々木美玲", kana: "ささき みれい", romaji: "sasaki_mirei", gen: 1, group: "hinatazaka", ct: 8 },
  { name: "高瀬愛奈", kana: "たかせ まな", romaji: "takase_mana", gen: 1, group: "hinatazaka", ct: 9 },
  { name: "高本彩花", kana: "たかもと あやか", romaji: "takamoto_ayaka", gen: 1, group: "hinatazaka", ct: 10 },
  { name: "東村芽依", kana: "ひがしむら めい", romaji: "higashimura_mei", gen: 1, group: "hinatazaka", ct: 11 },
  { name: "金村美玖", kana: "かねむら みく", romaji: "kanemura_miku", gen: 1, group: "hinatazaka", ct: 12 },
  // --- 2期生 ---
  { name: "河田陽菜", kana: "かわた ひな", romaji: "kawata_hina", gen: 2, group: "hinatazaka", ct: 13 },
  { name: "小坂菜緒", kana: "こさか なお", romaji: "kosaka_nao", gen: 2, group: "hinatazaka", ct: 14 },
  { name: "富田鈴花", kana: "とみた すずか", romaji: "tomita_suzuka", gen: 2, group: "hinatazaka", ct: 15 },
  { name: "丹生明里", kana: "にぶ あかり", romaji: "nibu_akari", gen: 2, group: "hinatazaka", ct: 16 },
  { name: "濱岸ひより", kana: "はまぎし ひより", romaji: "hamagishi_hiyori", gen: 2, group: "hinatazaka", ct: 17 },
  { name: "松田好花", kana: "まつだ このか", romaji: "matsuda_konoka", gen: 2, group: "hinatazaka", ct: 18 },
  { name: "宮田愛萌", kana: "みやた まなも", romaji: "miyata_manamo", gen: 2, group: "hinatazaka", ct: 19 },
  // --- 3期生 ---
  { name: "上村ひなの", kana: "かみむら ひなの", romaji: "kamimura_hinano", gen: 3, group: "hinatazaka", ct: 21 },
  { name: "髙橋未来虹", kana: "たかはし みくに", romaji: "takahashi_mikuni", gen: 3, group: "hinatazaka", ct: 22 },
  { name: "森本茉莉", kana: "もりもと まりぃ", romaji: "morimoto_marii", gen: 3, group: "hinatazaka", ct: 23 },
  { name: "山口陽世", kana: "やまぐち はるよ", romaji: "yamaguchi_haruyo", gen: 3, group: "hinatazaka", ct: 24 },
  // --- 4期生 ---
  { name: "石塚瑶季", kana: "いしづか たまき", romaji: "ishizuka_tamaki", gen: 4, group: "hinatazaka", ct: 25 },
  { name: "岸帆夏", kana: "きし ほのか", romaji: "kishi_honoka", gen: 4, group: "hinatazaka", ct: 26 },
  { name: "小西夏菜実", kana: "こにし ななみ", romaji: "konishi_nanami", gen: 4, group: "hinatazaka", ct: 27 },
  { name: "清水理央", kana: "しみず りお", romaji: "shimizu_rio", gen: 4, group: "hinatazaka", ct: 28 },
  { name: "正源司陽子", kana: "しょうげんじ ようこ", romaji: "shogenji_yoko", gen: 4, group: "hinatazaka", ct: 29 },
  { name: "竹内希来里", kana: "たけうち きらり", romaji: "takeuchi_kirari", gen: 4, group: "hinatazaka", ct: 30 },
  { name: "平尾帆夏", kana: "ひらお ほのか", romaji: "hirao_honoka", gen: 4, group: "hinatazaka", ct: 31 },
  { name: "平岡海月", kana: "ひらおか みづき", romaji: "hiraoka_mizuki", gen: 4, group: "hinatazaka", ct: 32 },
  { name: "藤嶌果歩", kana: "ふじしま かほ", romaji: "fujishima_kaho", gen: 4, group: "hinatazaka", ct: 33 },
  { name: "宮地すみれ", kana: "みやち すみれ", romaji: "miyachi_sumire", gen: 4, group: "hinatazaka", ct: 34 },
  { name: "山下葉留花", kana: "やました はるか", romaji: "yamashita_haruka", gen: 4, group: "hinatazaka", ct: 35 },
  { name: "渡辺莉奈", kana: "わたなべ りな", romaji: "watanabe_rina", gen: 4, group: "hinatazaka", ct: 36 },

  // ============================================================
  // 櫻坂46
  // ============================================================
  // --- 1期生 ---
  { name: "上村莉菜", kana: "うえむら りな", romaji: "uemura_rina", gen: 1, group: "sakurazaka", ct: 3 },
  { name: "小池美波", kana: "こいけ みなみ", romaji: "koike_minami", gen: 1, group: "sakurazaka", ct: 6 },
  { name: "小林由依", kana: "こばやし ゆい", romaji: "kobayashi_yui", gen: 1, group: "sakurazaka", ct: 7 },
  { name: "齋藤冬優花", kana: "さいとう ふゆか", romaji: "saitou_fuyuka", gen: 1, group: "sakurazaka", ct: 8 },
  // --- 2期生 ---
  { name: "井上梨名", kana: "いのうえ りな", romaji: "inoue_rina", gen: 2, group: "sakurazaka", ct: 43 },
  { name: "遠藤光莉", kana: "えんどう ひかり", romaji: "endou_hikari", gen: 2, group: "sakurazaka", ct: 53 },
  { name: "大園玲", kana: "おおぞの れい", romaji: "oozono_rei", gen: 2, group: "sakurazaka", ct: 54 },
  { name: "大沼晶保", kana: "おおぬま あきほ", romaji: "oonuma_akiho", gen: 2, group: "sakurazaka", ct: 55 },
  { name: "幸阪茉里乃", kana: "こうさか まりの", romaji: "kosaka_marino", gen: 2, group: "sakurazaka", ct: 56 },
  { name: "関有美子", kana: "せき ゆみこ", romaji: "seki_yumiko", gen: 2, group: "sakurazaka", ct: 44 },
  { name: "武元唯衣", kana: "たけもと ゆい", romaji: "takemoto_yui", gen: 2, group: "sakurazaka", ct: 45 },
  { name: "田村保乃", kana: "たむら ほの", romaji: "tamura_hono", gen: 2, group: "sakurazaka", ct: 46 },
  { name: "藤吉夏鈴", kana: "ふじよし かりん", romaji: "fujiyoshi_karin", gen: 2, group: "sakurazaka", ct: 47 },
  { name: "増本綺良", kana: "ますもと きら", romaji: "masumoto_kira", gen: 2, group: "sakurazaka", ct: 57 },
  { name: "森田ひかる", kana: "もりた ひかる", romaji: "morita_hikaru", gen: 2, group: "sakurazaka", ct: 50 },
  { name: "守屋麗奈", kana: "もりや れな", romaji: "moriya_rena", gen: 2, group: "sakurazaka", ct: 58 },
  { name: "山﨑天", kana: "やまさき てん", romaji: "yamasaki_ten", gen: 2, group: "sakurazaka", ct: 51 },
  // --- 3期生 ---
  { name: "遠藤理子", kana: "えんどう りこ", romaji: "endou_riko", gen: 3, group: "sakurazaka", ct: 60 },
  { name: "小田倉麗奈", kana: "おだくら れいな", romaji: "odakura_reina", gen: 3, group: "sakurazaka", ct: 61 },
  { name: "小島凪紗", kana: "こじま なぎさ", romaji: "kojima_nagisa", gen: 3, group: "sakurazaka", ct: 62 },
  { name: "谷口愛季", kana: "たにぐち あいき", romaji: "taniguchi_aiki", gen: 3, group: "sakurazaka", ct: 63 },
  { name: "中嶋優月", kana: "なかしま ゆづき", romaji: "nakashima_yuzuki", gen: 3, group: "sakurazaka", ct: 64 },
  { name: "的野美青", kana: "まとの みお", romaji: "matono_mio", gen: 3, group: "sakurazaka", ct: 65 },
  { name: "村井優", kana: "むらい ゆう", romaji: "murai_yuu", gen: 3, group: "sakurazaka", ct: 67 },
  { name: "村山美羽", kana: "むらやま みう", romaji: "murayama_miu", gen: 3, group: "sakurazaka", ct: 68 },
  { name: "山下瞳月", kana: "やました しづき", romaji: "yamashita_shizuki", gen: 3, group: "sakurazaka", ct: 69 },
  { name: "向井純葉", kana: "むかい いとは", romaji: "mukai_itoha", gen: 3, group: "sakurazaka", ct: 66 },
];

// グループ別ブログURL（一覧ページ = 全メンバーの最新投稿が画像付きで並ぶ）
const BLOG_LIST_URLS = {
  nogizaka: "https://www.nogizaka46.com/s/n46/diary/MEMBER/list",
  hinatazaka: "https://www.hinatazaka46.com/s/official/diary/member",
  sakurazaka: "https://sakurazaka46.com/s/s46/diary/blog?ima=0000",
};

// メンバー個別ブログURL（ct IDが設定されているメンバーのみ）
const BLOG_MEMBER_TEMPLATES = {
  nogizaka: "https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ct=",
  hinatazaka: "https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000&ct=",
  sakurazaka: "https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000&ct=",
};

// blogara.jp（ブログ更新まとめ - 画像サムネ付き）
const BLOGARA_URLS = {
  nogizaka: "https://blogara.jp/t/nogizaka46/",
  hinatazaka: "https://blogara.jp/t/hinatazaka46/",
  sakurazaka: "https://blogara.jp/t/sakurazaka46/",
};

// グループ別YouTubeチャンネル
const YOUTUBE_CHANNELS = {
  nogizaka: { id: "UCnSgMmHaG6-wjIxBBHqt7g", name: "乃木坂46" },
  hinatazaka: { id: "UCR0V48HmwLkTIjkPJmDTssQ", name: "日向坂46" },
  sakurazaka: { id: "UCy2EhOFCgakgp2Iu-NBLUIQ", name: "櫻坂46" },
};

function getGroupBlogListUrl(group) {
  return BLOG_LIST_URLS[group] || BLOG_LIST_URLS.nogizaka;
}

function getMemberBlogUrl(member) {
  if (!member.ct) return null;
  const template = BLOG_MEMBER_TEMPLATES[member.group] || BLOG_MEMBER_TEMPLATES.nogizaka;
  return template + member.ct;
}

function getGroupBlogaraUrl(group) {
  return BLOGARA_URLS[group] || BLOGARA_URLS.nogizaka;
}

function getGroupName(groupId) {
  const g = GROUPS.find(g => g.id === groupId);
  return g ? g.name : groupId;
}

function getGroupColor(groupId) {
  const g = GROUPS.find(g => g.id === groupId);
  return g ? g.color : "#888";
}

function searchMembers(query, gen, group) {
  let list = MEMBERS;
  if (group && group !== "all") {
    list = list.filter(m => m.group === group);
  }
  if (gen && gen !== "all") {
    list = list.filter(m => m.gen === parseInt(gen));
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(m =>
      m.name.includes(q) || m.kana.includes(q) || m.romaji.includes(q)
    );
  }
  return list;
}

function getGenerations(group) {
  const members = group && group !== "all"
    ? MEMBERS.filter(m => m.group === group)
    : MEMBERS;
  const gens = [...new Set(members.map(m => m.gen))].sort((a, b) => a - b);
  return gens;
}
