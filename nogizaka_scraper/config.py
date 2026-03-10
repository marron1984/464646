"""スクレイパー設定 / Scraper Configuration"""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import yaml


@dataclass
class ScraperConfig:
    """メインの設定クラス"""

    # ダウンロード先ディレクトリ
    download_dir: str = "./downloads"

    # 同時ダウンロード数
    max_concurrent_downloads: int = 3

    # リクエスト間の待機時間（秒）- サーバー負荷軽減
    request_delay: float = 2.0

    # リトライ回数
    max_retries: int = 3

    # タイムアウト（秒）
    timeout: int = 30

    # User-Agent
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

    # ブログ設定
    blog_base_url: str = "https://blog.nogizaka46.com"
    blog_member_filter: list[str] = field(default_factory=list)
    blog_max_pages: int = 10

    # YouTube設定
    youtube_channel_ids: list[str] = field(default_factory=lambda: [
        "UCnSgMmHaG6-wjIxBBHqt7g",  # 乃木坂46 OFFICIAL
    ])
    youtube_max_results: int = 50
    youtube_download_quality: str = "720p"
    youtube_api_key: Optional[str] = None

    # ファイルフィルター
    image_extensions: list[str] = field(default_factory=lambda: [
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    ])
    video_extensions: list[str] = field(default_factory=lambda: [
        ".mp4", ".webm", ".mkv"
    ])

    # 重複スキップ
    skip_existing: bool = True

    # ログレベル
    log_level: str = "INFO"

    @classmethod
    def from_yaml(cls, path: str) -> "ScraperConfig":
        """YAMLファイルから設定を読み込む"""
        config_path = Path(path)
        if not config_path.exists():
            return cls()
        with open(config_path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})

    @classmethod
    def from_env(cls) -> "ScraperConfig":
        """環境変数から設定を読み込む"""
        config = cls()
        if api_key := os.environ.get("YOUTUBE_API_KEY"):
            config.youtube_api_key = api_key
        if download_dir := os.environ.get("NOGI_DOWNLOAD_DIR"):
            config.download_dir = download_dir
        return config

    def save_yaml(self, path: str) -> None:
        """設定をYAMLファイルに保存"""
        from dataclasses import asdict

        config_path = Path(path)
        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(asdict(self), f, default_flow_style=False, allow_unicode=True)
