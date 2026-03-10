/**
 * 乃木坂46 メンバーデータベース
 * ブログURL・YouTube検索キーワードを含む
 */

const MEMBERS = [
  // --- 3期生 ---
  { name: "久保史緒里", kana: "くぼ しおり", romaji: "kubo_shiori", gen: 3, blogPath: "kuboshiori" },
  { name: "山下美月", kana: "やました みづき", romaji: "yamashita_mizuki", gen: 3, blogPath: "yamashitamizuki" },
  { name: "与田祐希", kana: "よだ ゆうき", romaji: "yoda_yuuki", gen: 3, blogPath: "yodayuuki" },
  // --- 4期生 ---
  { name: "遠藤さくら", kana: "えんどう さくら", romaji: "endou_sakura", gen: 4, blogPath: "endousakura" },
  { name: "賀喜遥香", kana: "かき はるか", romaji: "kaki_haruka", gen: 4, blogPath: "kakiharuka" },
  { name: "金川紗耶", kana: "かながわ さや", romaji: "kanagawa_saya", gen: 4, blogPath: "kanagawasaya" },
  { name: "黒見明香", kana: "くろみ はるか", romaji: "kuromi_haruka", gen: 4, blogPath: "kuromiharuka" },
  { name: "佐藤璃果", kana: "さとう りか", romaji: "satou_rika", gen: 4, blogPath: "satourika" },
  { name: "清宮レイ", kana: "せいみや れい", romaji: "seimiya_rei", gen: 4, blogPath: "seimiyarei" },
  { name: "田村真佑", kana: "たむら まゆ", romaji: "tamura_mayu", gen: 4, blogPath: "tamuramayu" },
  { name: "筒井あやめ", kana: "つつい あやめ", romaji: "tsutsui_ayame", gen: 4, blogPath: "tsutsuiayame" },
  { name: "早川聖来", kana: "はやかわ せいら", romaji: "hayakawa_seira", gen: 4, blogPath: "hayakawaseira" },
  { name: "矢久保美緒", kana: "やくぼ みお", romaji: "yakubo_mio", gen: 4, blogPath: "yakubomio" },
  // --- 5期生 ---
  { name: "五百城茉央", kana: "いおき まお", romaji: "ioki_mao", gen: 5, blogPath: "iokimao" },
  { name: "池田瑛紗", kana: "いけだ てれさ", romaji: "ikeda_teresa", gen: 5, blogPath: "ikedateresa" },
  { name: "一ノ瀬美空", kana: "いちのせ みく", romaji: "ichinose_miku", gen: 5, blogPath: "ichinosemiku" },
  { name: "井上和", kana: "いのうえ なぎ", romaji: "inoue_nagi", gen: 5, blogPath: "inouenagi" },
  { name: "岡本姫奈", kana: "おかもと ひな", romaji: "okamoto_hina", gen: 5, blogPath: "okamotohina" },
  { name: "小川彩", kana: "おがわ あや", romaji: "ogawa_aya", gen: 5, blogPath: "ogawaaya" },
  { name: "奥田いろは", kana: "おくだ いろは", romaji: "okuda_iroha", gen: 5, blogPath: "okudairoha" },
  { name: "川﨑桜", kana: "かわさき さくら", romaji: "kawasaki_sakura", gen: 5, blogPath: "kawasakisakura" },
  { name: "菅原咲月", kana: "すがわら さつき", romaji: "sugawara_satsuki", gen: 5, blogPath: "sugawarasatsuki" },
  { name: "冨里奈央", kana: "とみさと なお", romaji: "tomisato_nao", gen: 5, blogPath: "tomisatonao" },
  { name: "中西アルノ", kana: "なかにし あるの", romaji: "nakanishi_aruno", gen: 5, blogPath: "nakanishiaruno" },
];

const BLOG_BASE = "https://blog.nogizaka46.com/s/n46/diary/MEMBER";
const YOUTUBE_CHANNEL_ID = "UCnSgMmHaG6-wjIxBBHqt7g";

function getMemberBlogUrl(member) {
  return BLOG_BASE.replace("MEMBER", member.blogPath || "");
}

function searchMembers(query, gen) {
  let list = MEMBERS;
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
