"""推し管理 / Oshi (Favorite Member) Management"""

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path

from nogizaka_scraper.members import MEMBERS, Member

logger = logging.getLogger(__name__)

OSHI_FILE = "oshi_config.json"


@dataclass
class OshiConfig:
    """推し設定"""

    # 推しメンバー名リスト（最推し順）
    oshi_members: list[str] = field(default_factory=list)

    # 推しの収集頻度倍率（通常メンバーの何倍）
    oshi_priority_multiplier: int = 3

    # 推し以外も収集するか
    collect_non_oshi: bool = True

    # 推し以外の最大ページ数（推しより少なく）
    non_oshi_max_pages: int = 2

    # 推しの最大ページ数
    oshi_max_pages: int = 20

    # YouTube検索時の推しキーワード追加
    oshi_youtube_search: bool = True

    def is_oshi(self, member_name: str) -> bool:
        """推しメンバーかどうか"""
        return any(
            oshi in member_name or member_name in oshi
            for oshi in self.oshi_members
        )

    def get_oshi_rank(self, member_name: str) -> int:
        """推しの順位を返す（0始まり、推しでなければ-1）"""
        for i, oshi in enumerate(self.oshi_members):
            if oshi in member_name or member_name in oshi:
                return i
        return -1

    def get_max_pages(self, member_name: str) -> int:
        """メンバーに応じたページ数を返す"""
        if self.is_oshi(member_name):
            return self.oshi_max_pages
        return self.non_oshi_max_pages if self.collect_non_oshi else 0

    def save(self, path: str | None = None) -> None:
        """設定をJSONファイルに保存"""
        save_path = Path(path or OSHI_FILE)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(asdict(self), f, ensure_ascii=False, indent=2)
        logger.info("推し設定を保存: %s", save_path)

    @classmethod
    def load(cls, path: str | None = None) -> "OshiConfig":
        """設定をJSONファイルから読み込み"""
        load_path = Path(path or OSHI_FILE)
        if not load_path.exists():
            return cls()
        try:
            with open(load_path, encoding="utf-8") as f:
                data = json.load(f)
            return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning("推し設定の読み込みに失敗: %s", e)
            return cls()
