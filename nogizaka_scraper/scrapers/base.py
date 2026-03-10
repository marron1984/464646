"""スクレイパー基底クラス / Base Scraper"""

import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from nogizaka_scraper.config import ScraperConfig
from nogizaka_scraper.utils.downloader import DownloadManager


class BaseScraper(ABC):
    """全スクレイパーの基底クラス"""

    def __init__(self, config: ScraperConfig):
        self.config = config
        self.downloader = DownloadManager(
            download_dir=config.download_dir,
            max_retries=config.max_retries,
            timeout=config.timeout,
            request_delay=config.request_delay,
            user_agent=config.user_agent,
            skip_existing=config.skip_existing,
        )
        self.logger = logging.getLogger(self.__class__.__name__)
        self._results: list[Optional[Path]] = []

    @abstractmethod
    def scrape(self) -> list[Path]:
        """スクレイピングを実行し、ダウンロードしたファイルパスを返す"""

    @property
    def downloaded_count(self) -> int:
        """ダウンロード成功数"""
        return len([r for r in self._results if r is not None])

    @property
    def skipped_count(self) -> int:
        """スキップ数"""
        return len([r for r in self._results if r is None])
