"""Web画像スクレイパー / Web Image Scraper

検索エンジン経由で乃木坂46関連の画像を収集する汎用スクレイパー。
"""

import logging
import re
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse, quote_plus

from bs4 import BeautifulSoup

from nogizaka_scraper.config import ScraperConfig
from nogizaka_scraper.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)


# 乃木坂46メンバー名（現役・卒業生代表）
NOGIZAKA_SEARCH_KEYWORDS = [
    "乃木坂46",
    "乃木坂46 公式写真",
    "乃木坂46 グラビア",
]


class WebImageScraper(BaseScraper):
    """Web上の画像を収集するスクレイパー"""

    def __init__(
        self,
        config: ScraperConfig,
        keywords: Optional[list[str]] = None,
        target_urls: Optional[list[str]] = None,
    ):
        super().__init__(config)
        self.keywords = keywords or NOGIZAKA_SEARCH_KEYWORDS
        self.target_urls = target_urls or []

    def _extract_images_from_page(self, url: str) -> list[str]:
        """ページから画像URLを抽出"""
        html = self.downloader.fetch_page(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        image_urls = []

        for img in soup.find_all("img"):
            src = (
                img.get("data-src")
                or img.get("data-original")
                or img.get("src")
                or ""
            )
            if not src or src.startswith("data:"):
                continue

            full_url = urljoin(url, src)
            if self._is_quality_image(full_url, img):
                image_urls.append(full_url)

        # og:image メタタグ
        for meta in soup.find_all("meta", property="og:image"):
            content = meta.get("content", "")
            if content:
                image_urls.append(urljoin(url, content))

        return list(set(image_urls))

    def _is_quality_image(self, url: str, img_tag=None) -> bool:
        """高品質な画像かどうかを判定"""
        parsed = urlparse(url)
        path_lower = parsed.path.lower()

        # 拡張子チェック
        valid_ext = any(
            path_lower.endswith(ext) for ext in self.config.image_extensions
        )
        if not valid_ext:
            return False

        # 小さいアイコン等を除外
        exclude_patterns = [
            "icon", "logo", "sprite", "favicon", "emoji",
            "pixel", "spacer", "button", "arrow", "ad_",
            "1x1", "tracking",
        ]
        if any(p in path_lower for p in exclude_patterns):
            return False

        # サイズ属性チェック（小さい画像を除外）
        if img_tag:
            try:
                width = int(img_tag.get("width", 0))
                height = int(img_tag.get("height", 0))
                if 0 < width < 100 or 0 < height < 100:
                    return False
            except (ValueError, TypeError):
                pass

        return True

    def _sanitize_filename(self, name: str) -> str:
        """ファイル名として安全な文字列に変換"""
        return re.sub(r'[<>:"/\\|?*\s]+', "_", name).strip("_")[:50]

    def scrape(self) -> list[Path]:
        """指定URLから画像を収集"""
        self.logger.info("=== Web画像スクレイパー開始 ===")
        downloaded_files: list[Path] = []

        # 直接指定されたURLから収集
        for url in self.target_urls:
            self.logger.info("ページ処理中: %s", url)
            image_urls = self._extract_images_from_page(url)
            self.logger.info("  発見した画像数: %d", len(image_urls))

            domain = urlparse(url).netloc
            subdir = f"web/{self._sanitize_filename(domain)}"

            for img_url in image_urls:
                result = self.downloader.download_file(img_url, subdir=subdir)
                self._results.append(result)
                if result:
                    downloaded_files.append(result)

        self.logger.info(
            "=== Web画像スクレイピング完了: %d ファイル ===",
            len(downloaded_files),
        )
        return downloaded_files
