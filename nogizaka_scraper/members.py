"""乃木坂46メンバーデータベース / Member Database"""

from dataclasses import dataclass, field


@dataclass
class Member:
    name: str
    name_kana: str
    name_romaji: str
    generation: int
    blog_path: str = ""
    active: bool = True
    tags: list[str] = field(default_factory=list)


# 乃木坂46 現役メンバー (5期生まで)
MEMBERS: list[Member] = [
    # --- 3期生 ---
    Member("久保史緒里", "くぼ しおり", "kubo_shiori", 3, blog_path="kuboshiori"),
    Member("山下美月", "やました みづき", "yamashita_mizuki", 3, blog_path="yamashitamizuki"),
    Member("与田祐希", "よだ ゆうき", "yoda_yuuki", 3, blog_path="yodayuuki"),
    # --- 4期生 ---
    Member("遠藤さくら", "えんどう さくら", "endou_sakura", 4, blog_path="endousakura"),
    Member("賀喜遥香", "かき はるか", "kaki_haruka", 4, blog_path="kakiharuka"),
    Member("金川紗耶", "かながわ さや", "kanagawa_saya", 4, blog_path="kanagawasaya"),
    Member("黒見明香", "くろみ はるか", "kuromi_haruka", 4, blog_path="kuromiharuka"),
    Member("佐藤璃果", "さとう りか", "satou_rika", 4, blog_path="satourika"),
    Member("清宮レイ", "せいみや れい", "seimiya_rei", 4, blog_path="seimiyarei"),
    Member("田村真佑", "たむら まゆ", "tamura_mayu", 4, blog_path="tamuramayu"),
    Member("筒井あやめ", "つつい あやめ", "tsutsui_ayame", 4, blog_path="tsutsuiayame"),
    Member("早川聖来", "はやかわ せいら", "hayakawa_seira", 4, blog_path="hayakawaseira"),
    Member("矢久保美緒", "やくぼ みお", "yakubo_mio", 4, blog_path="yakubomio"),
    # --- 5期生 ---
    Member("五百城茉央", "いおき まお", "ioki_mao", 5, blog_path="iokimao"),
    Member("池田瑛紗", "いけだ てれさ", "ikeda_teresa", 5, blog_path="ikedateresa"),
    Member("一ノ瀬美空", "いちのせ みく", "ichinose_miku", 5, blog_path="ichinosemiku"),
    Member("井上和", "いのうえ なぎ", "inoue_nagi", 5, blog_path="inouenagi"),
    Member("岡本姫奈", "おかもと ひな", "okamoto_hina", 5, blog_path="okamotohina"),
    Member("小川彩", "おがわ あや", "ogawa_aya", 5, blog_path="ogawaaya"),
    Member("奥田いろは", "おくだ いろは", "okuda_iroha", 5, blog_path="okudairoha"),
    Member("川﨑桜", "かわさき さくら", "kawasaki_sakura", 5, blog_path="kawasakisakura"),
    Member("菅原咲月", "すがわら さつき", "sugawara_satsuki", 5, blog_path="sugawarasatsuki"),
    Member("冨里奈央", "とみさと なお", "tomisato_nao", 5, blog_path="tomisatonao"),
    Member("中西アルノ", "なかにし あるの", "nakanishi_aruno", 5, blog_path="nakanishiaruno"),
]


def get_member_by_name(name: str) -> Member | None:
    """名前（部分一致）でメンバーを検索"""
    for m in MEMBERS:
        if name in m.name or name in m.name_kana or name in m.name_romaji:
            return m
    return None


def search_members(query: str) -> list[Member]:
    """クエリでメンバーを検索（部分一致）"""
    if not query:
        return MEMBERS.copy()
    query_lower = query.lower()
    return [
        m for m in MEMBERS
        if query_lower in m.name.lower()
        or query_lower in m.name_kana.lower()
        or query_lower in m.name_romaji.lower()
        or query_lower in str(m.generation)
    ]


def get_members_by_generation(gen: int) -> list[Member]:
    """期別にメンバーを取得"""
    return [m for m in MEMBERS if m.generation == gen]


def get_active_members() -> list[Member]:
    """現役メンバーを取得"""
    return [m for m in MEMBERS if m.active]
