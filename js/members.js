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
  { name: "久保史緒里", kana: "くぼ しおり", romaji: "kubo_shiori", gen: 3, group: "nogizaka", blogPath: "kuboshiori" },
  { name: "山下美月", kana: "やました みづき", romaji: "yamashita_mizuki", gen: 3, group: "nogizaka", blogPath: "yamashitamizuki" },
  { name: "与田祐希", kana: "よだ ゆうき", romaji: "yoda_yuuki", gen: 3, group: "nogizaka", blogPath: "yodayuuki" },
  // --- 4期生 ---
  { name: "遠藤さくら", kana: "えんどう さくら", romaji: "endou_sakura", gen: 4, group: "nogizaka", blogPath: "endousakura" },
  { name: "賀喜遥香", kana: "かき はるか", romaji: "kaki_haruka", gen: 4, group: "nogizaka", blogPath: "kakiharuka" },
  { name: "金川紗耶", kana: "かながわ さや", romaji: "kanagawa_saya", gen: 4, group: "nogizaka", blogPath: "kanagawasaya" },
  { name: "黒見明香", kana: "くろみ はるか", romaji: "kuromi_haruka", gen: 4, group: "nogizaka", blogPath: "kuromiharuka" },
  { name: "佐藤璃果", kana: "さとう りか", romaji: "satou_rika", gen: 4, group: "nogizaka", blogPath: "satourika" },
  { name: "清宮レイ", kana: "せいみや れい", romaji: "seimiya_rei", gen: 4, group: "nogizaka", blogPath: "seimiyarei" },
  { name: "田村真佑", kana: "たむら まゆ", romaji: "tamura_mayu", gen: 4, group: "nogizaka", blogPath: "tamuramayu" },
  { name: "筒井あやめ", kana: "つつい あやめ", romaji: "tsutsui_ayame", gen: 4, group: "nogizaka", blogPath: "tsutsuiayame" },
  { name: "早川聖来", kana: "はやかわ せいら", romaji: "hayakawa_seira", gen: 4, group: "nogizaka", blogPath: "hayakawaseira" },
  { name: "矢久保美緒", kana: "やくぼ みお", romaji: "yakubo_mio", gen: 4, group: "nogizaka", blogPath: "yakubomio" },
  // --- 5期生 ---
  { name: "五百城茉央", kana: "いおき まお", romaji: "ioki_mao", gen: 5, group: "nogizaka", blogPath: "iokimao" },
  { name: "池田瑛紗", kana: "いけだ てれさ", romaji: "ikeda_teresa", gen: 5, group: "nogizaka", blogPath: "ikedateresa" },
  { name: "一ノ瀬美空", kana: "いちのせ みく", romaji: "ichinose_miku", gen: 5, group: "nogizaka", blogPath: "ichinosemiku" },
  { name: "井上和", kana: "いのうえ なぎ", romaji: "inoue_nagi", gen: 5, group: "nogizaka", blogPath: "inouenagi" },
  { name: "岡本姫奈", kana: "おかもと ひな", romaji: "okamoto_hina", gen: 5, group: "nogizaka", blogPath: "okamotohina" },
  { name: "小川彩", kana: "おがわ あや", romaji: "ogawa_aya", gen: 5, group: "nogizaka", blogPath: "ogawaaya" },
  { name: "奥田いろは", kana: "おくだ いろは", romaji: "okuda_iroha", gen: 5, group: "nogizaka", blogPath: "okudairoha" },
  { name: "川﨑桜", kana: "かわさき さくら", romaji: "kawasaki_sakura", gen: 5, group: "nogizaka", blogPath: "kawasakisakura" },
  { name: "菅原咲月", kana: "すがわら さつき", romaji: "sugawara_satsuki", gen: 5, group: "nogizaka", blogPath: "sugawarasatsuki" },
  { name: "冨里奈央", kana: "とみさと なお", romaji: "tomisato_nao", gen: 5, group: "nogizaka", blogPath: "tomisatonao" },
  { name: "中西アルノ", kana: "なかにし あるの", romaji: "nakanishi_aruno", gen: 5, group: "nogizaka", blogPath: "nakanishiaruno" },

  // ============================================================
  // 日向坂46
  // ============================================================
  // --- 1期生 ---
  { name: "佐々木久美", kana: "ささき くみ", romaji: "sasaki_kumi", gen: 1, group: "hinatazaka", blogPath: "sasakikumi" },
  { name: "佐々木美玲", kana: "ささき みれい", romaji: "sasaki_mirei", gen: 1, group: "hinatazaka", blogPath: "sasakimirei" },
  { name: "高瀬愛奈", kana: "たかせ まな", romaji: "takase_mana", gen: 1, group: "hinatazaka", blogPath: "takasemana" },
  { name: "高本彩花", kana: "たかもと あやか", romaji: "takamoto_ayaka", gen: 1, group: "hinatazaka", blogPath: "takamotoayaka" },
  { name: "東村芽依", kana: "ひがしむら めい", romaji: "higashimura_mei", gen: 1, group: "hinatazaka", blogPath: "higashimuramei" },
  { name: "金村美玖", kana: "かねむら みく", romaji: "kanemura_miku", gen: 1, group: "hinatazaka", blogPath: "kanemuramiku" },
  // --- 2期生 ---
  { name: "河田陽菜", kana: "かわた ひな", romaji: "kawata_hina", gen: 2, group: "hinatazaka", blogPath: "kawatahina" },
  { name: "小坂菜緒", kana: "こさか なお", romaji: "kosaka_nao", gen: 2, group: "hinatazaka", blogPath: "kosakanao" },
  { name: "富田鈴花", kana: "とみた すずか", romaji: "tomita_suzuka", gen: 2, group: "hinatazaka", blogPath: "tomitasuzuka" },
  { name: "丹生明里", kana: "にぶ あかり", romaji: "nibu_akari", gen: 2, group: "hinatazaka", blogPath: "nibuakari" },
  { name: "濱岸ひより", kana: "はまぎし ひより", romaji: "hamagishi_hiyori", gen: 2, group: "hinatazaka", blogPath: "hamagishihiyori" },
  { name: "松田好花", kana: "まつだ このか", romaji: "matsuda_konoka", gen: 2, group: "hinatazaka", blogPath: "matsudakonoka" },
  { name: "宮田愛萌", kana: "みやた まなも", romaji: "miyata_manamo", gen: 2, group: "hinatazaka", blogPath: "miyatamanamo" },
  // --- 3期生 ---
  { name: "上村ひなの", kana: "かみむら ひなの", romaji: "kamimura_hinano", gen: 3, group: "hinatazaka", blogPath: "kamimurahinano" },
  { name: "髙橋未来虹", kana: "たかはし みくに", romaji: "takahashi_mikuni", gen: 3, group: "hinatazaka", blogPath: "takahashimikuni" },
  { name: "森本茉莉", kana: "もりもと まりぃ", romaji: "morimoto_marii", gen: 3, group: "hinatazaka", blogPath: "morimotomarii" },
  { name: "山口陽世", kana: "やまぐち はるよ", romaji: "yamaguchi_haruyo", gen: 3, group: "hinatazaka", blogPath: "yamaguchiharuyo" },
  // --- 4期生 ---
  { name: "石塚瑶季", kana: "いしづか たまき", romaji: "ishizuka_tamaki", gen: 4, group: "hinatazaka", blogPath: "ishizukatamaki" },
  { name: "岸帆夏", kana: "きし ほのか", romaji: "kishi_honoka", gen: 4, group: "hinatazaka", blogPath: "kishihonoka" },
  { name: "小西夏菜実", kana: "こにし ななみ", romaji: "konishi_nanami", gen: 4, group: "hinatazaka", blogPath: "konishinanami" },
  { name: "清水理央", kana: "しみず りお", romaji: "shimizu_rio", gen: 4, group: "hinatazaka", blogPath: "shimizurio" },
  { name: "正源司陽子", kana: "しょうげんじ ようこ", romaji: "shogenji_yoko", gen: 4, group: "hinatazaka", blogPath: "shogenjiyoko" },
  { name: "竹内希来里", kana: "たけうち きらり", romaji: "takeuchi_kirari", gen: 4, group: "hinatazaka", blogPath: "takeuchikirari" },
  { name: "平尾帆夏", kana: "ひらお ほのか", romaji: "hirao_honoka", gen: 4, group: "hinatazaka", blogPath: "hiraohonoka" },
  { name: "平岡海月", kana: "ひらおか みづき", romaji: "hiraoka_mizuki", gen: 4, group: "hinatazaka", blogPath: "hiraokamizuki" },
  { name: "藤嶌果歩", kana: "ふじしま かほ", romaji: "fujishima_kaho", gen: 4, group: "hinatazaka", blogPath: "fujishimakaho" },
  { name: "宮地すみれ", kana: "みやち すみれ", romaji: "miyachi_sumire", gen: 4, group: "hinatazaka", blogPath: "miyachisumire" },
  { name: "山下葉留花", kana: "やました はるか", romaji: "yamashita_haruka", gen: 4, group: "hinatazaka", blogPath: "yamashitaharuka" },
  { name: "渡辺莉奈", kana: "わたなべ りな", romaji: "watanabe_rina", gen: 4, group: "hinatazaka", blogPath: "watanaberina" },

  // ============================================================
  // 櫻坂46
  // ============================================================
  // --- 1期生 ---
  { name: "上村莉菜", kana: "うえむら りな", romaji: "uemura_rina", gen: 1, group: "sakurazaka", blogPath: "uemurarina" },
  { name: "小池美波", kana: "こいけ みなみ", romaji: "koike_minami", gen: 1, group: "sakurazaka", blogPath: "koikeminami" },
  { name: "小林由依", kana: "こばやし ゆい", romaji: "kobayashi_yui", gen: 1, group: "sakurazaka", blogPath: "kobayashiyui" },
  { name: "齋藤冬優花", kana: "さいとう ふゆか", romaji: "saitou_fuyuka", gen: 1, group: "sakurazaka", blogPath: "saitoufuyuka" },
  // --- 2期生 ---
  { name: "井上梨名", kana: "いのうえ りな", romaji: "inoue_rina", gen: 2, group: "sakurazaka", blogPath: "inouerinasakura" },
  { name: "遠藤光莉", kana: "えんどう ひかり", romaji: "endou_hikari", gen: 2, group: "sakurazaka", blogPath: "endouhikari" },
  { name: "大園玲", kana: "おおぞの れい", romaji: "oozono_rei", gen: 2, group: "sakurazaka", blogPath: "oozonoreisakura" },
  { name: "大沼晶保", kana: "おおぬま あきほ", romaji: "oonuma_akiho", gen: 2, group: "sakurazaka", blogPath: "oonumaakiho" },
  { name: "幸阪茉里乃", kana: "こうさか まりの", romaji: "kosaka_marino", gen: 2, group: "sakurazaka", blogPath: "kosakamarino" },
  { name: "関有美子", kana: "せき ゆみこ", romaji: "seki_yumiko", gen: 2, group: "sakurazaka", blogPath: "sekiyumiko" },
  { name: "武元唯衣", kana: "たけもと ゆい", romaji: "takemoto_yui", gen: 2, group: "sakurazaka", blogPath: "takemotoyui" },
  { name: "田村保乃", kana: "たむら ほの", romaji: "tamura_hono", gen: 2, group: "sakurazaka", blogPath: "tamurahono" },
  { name: "藤吉夏鈴", kana: "ふじよし かりん", romaji: "fujiyoshi_karin", gen: 2, group: "sakurazaka", blogPath: "fujiyoshikarin" },
  { name: "増本綺良", kana: "ますもと きら", romaji: "masumoto_kira", gen: 2, group: "sakurazaka", blogPath: "masumotokira" },
  { name: "森田ひかる", kana: "もりた ひかる", romaji: "morita_hikaru", gen: 2, group: "sakurazaka", blogPath: "moritahikaru" },
  { name: "守屋麗奈", kana: "もりや れな", romaji: "moriya_rena", gen: 2, group: "sakurazaka", blogPath: "moriyarena" },
  { name: "山﨑天", kana: "やまさき てん", romaji: "yamasaki_ten", gen: 2, group: "sakurazaka", blogPath: "yamasakiten" },
  // --- 3期生 ---
  { name: "遠藤理子", kana: "えんどう りこ", romaji: "endou_riko", gen: 3, group: "sakurazaka", blogPath: "endouriko" },
  { name: "小田倉麗奈", kana: "おだくら れいな", romaji: "odakura_reina", gen: 3, group: "sakurazaka", blogPath: "odakurareina" },
  { name: "小島凪紗", kana: "こじま なぎさ", romaji: "kojima_nagisa", gen: 3, group: "sakurazaka", blogPath: "kojimanagisa" },
  { name: "谷口愛季", kana: "たにぐち あいき", romaji: "taniguchi_aiki", gen: 3, group: "sakurazaka", blogPath: "taniguchiaiki" },
  { name: "中嶋優月", kana: "なかしま ゆづき", romaji: "nakashima_yuzuki", gen: 3, group: "sakurazaka", blogPath: "nakashimayuzuki" },
  { name: "的野美青", kana: "まとの みお", romaji: "matono_mio", gen: 3, group: "sakurazaka", blogPath: "matonomio" },
  { name: "村井優", kana: "むらい ゆう", romaji: "murai_yuu", gen: 3, group: "sakurazaka", blogPath: "muraiyuu" },
  { name: "村山美羽", kana: "むらやま みう", romaji: "murayama_miu", gen: 3, group: "sakurazaka", blogPath: "murayamamiu" },
  { name: "山下瞳月", kana: "やました しづき", romaji: "yamashita_shizuki", gen: 3, group: "sakurazaka", blogPath: "yamashitashizuki" },
  { name: "向井純葉", kana: "むかい いとは", romaji: "mukai_itoha", gen: 3, group: "sakurazaka", blogPath: "mukaiitoha" },
];

// グループ別ブログURL
const BLOG_URLS = {
  nogizaka: "https://blog.nogizaka46.com/s/n46/diary/MEMBER",
  hinatazaka: "https://blog.hinatazaka46.com/s/official/diary/detail/MEMBER",
  sakurazaka: "https://sakurazaka46.com/s/s46/diary/detail/MEMBER",
};

// グループ別YouTubeチャンネル
const YOUTUBE_CHANNELS = {
  nogizaka: { id: "UCnSgMmHaG6-wjIxBBHqt7g", name: "乃木坂46" },
  hinatazaka: { id: "UCR0V48HmwLkTIjkPJmDTssQ", name: "日向坂46" },
  sakurazaka: { id: "UCy2EhOFCgakgp2Iu-NBLUIQ", name: "櫻坂46" },
};

function getMemberBlogUrl(member) {
  const template = BLOG_URLS[member.group] || BLOG_URLS.nogizaka;
  return template.replace("MEMBER", member.blogPath || "");
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
