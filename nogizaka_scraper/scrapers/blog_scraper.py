"""乃木坂46公式ブログスクレイパー / Nogizaka46 Official Blog Scraper"""

import re
import logging
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from nogizaka_scraper.config import ScraperConfig
from nogizaka_scraper.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)


class BlogScraper(BaseScraper):
    """乃木坂46公式ブログから画像を収集"""

    def __init__(self, config: ScraperConfig):
        super().__init__(config)
        self.base_url = config.blog_base_url
        self.member_filter = config.blog_member_filter
        self.max_pages = config.blog_max_pages

    def _get_member_list(self) -> list[dict]:
        """メンバー一覧を取得

        Returns:
            [{"name": "メンバー名", "url": "ブログURL"}, ...]
        """
        html = self.downloader.fetch_page(self.base_url)
        if not html:
            self.logger.error("メンバー一覧の取得に失敗しました")
            return []

        soup = BeautifulSoup(html, "html.parser")
        members = []

        # メンバーリンクを探索
        for link in soup.select("a[href*='member']"):
            href = link.get("href", "")
            name = link.get_text(strip=True)
            if name and href:
                full_url = urljoin(self.base_url, href)
                members.append({"name": name, "url": full_url})

        if self.member_filter:
            members = [
                m for m in members
                if any(f in m["name"] for f in self.member_filter)
            ]

        self.logger.info("対象メンバー数: %d", len(members))
        return members

    def _scrape_blog_page(self, url: str) -> tuple[list[str], Optional[str]]:
        """ブログページから画像URLと次ページURLを取得

        Returns:
            (画像URLリスト, 次ページURL or None)
        """
        html = self.downloader.fetch_page(url)
        if not html:
            return [], None

        soup = BeautifulSoup(html, "html.parser")
        image_urls = []

        # ブログ記事内の画像を取得
        for article in soup.select("article, .blog-entry, .entry, .post"):
            for img in article.find_all("img"):
                src = img.get("src") or img.get("data-src") or ""
                if src and self._is_valid_image_url(src):
                    image_urls.append(urljoin(url, src))

        # 記事セレクタがヒットしない場合、ページ全体から取得
        if not image_urls:
            for img in soup.find_all("img"):
                src = img.get("src") or img.get("data-src") or ""
                if src and self._is_valid_image_url(src):
                    image_urls.append(urljoin(url, src))

        # 次ページリンク
        next_link = (
            soup.select_one("a.next, a[rel='next'], .pagination a:last-child")
        )
        next_url = None
        if next_link and next_link.get("href"):
            next_url = urljoin(url, next_link["href"])

        return image_urls, next_url

    def _is_valid_image_url(self, url: str) -> bool:
        """有効な画像URLかチェック"""
        parsed = urlparse(url)
        path_lower = parsed.path.lower()

        # 拡張子チェック
        has_valid_ext = any(
            path_lower.endswith(ext)
            for ext in self.config.image_extensions
        )

        # アイコンや小さい画像を除外
        exclude_patterns = [
            "icon", "logo", "banner", "ad_", "ads/",
            "sprite", "favicon", "thumb_s", "emoji",
            "pixel", "spacer", "button",
        ]
        is_excluded = any(p in path_lower for p in exclude_patterns)

        # dcimg や img ドメインの画像も許可
        is_blog_image = bool(re.search(r"(dcimg|img|image)", parsed.netloc))

        return (has_valid_ext or is_blog_image) and not is_excluded

    def _sanitize_dirname(self, name: str) -> str:
        """ディレクトリ名として安全な文字列に変換"""
        return re.sub(r'[<>:"/\\|?*]', "_", name).strip()

    def scrape(self) -> list[Path]:
        """ブログから画像をスクレイピング"""
        self.logger.info("=== 乃木坂46ブログスクレイパー開始 ===")

        members = self._get_member_list()
        if not members:
            self.logger.warning("メンバーが見つかりませんでした")
            return []

        downloaded_files: list[Path] = []

        for member in members:
            member_name = member["name"]
            member_dir = self._sanitize_dirname(member_name)
            self.logger.info("メンバー: %s のブログを処理中...", member_name)

            url: Optional[str] = member["url"]
            page_count = 0

            while url and page_count < self.max_pages:
                page_count += 1
                self.logger.info(
                    "  ページ %d/%d: %s", page_count, self.max_pages, url
                )

                image_urls, next_url = self._scrape_blog_page(url)
                self.logger.info("  画像数: %d", len(image_urls))

                for img_url in image_urls:
                    result = self.downloader.download_file(
                        img_url,
                        subdir=f"blog/{member_dir}",
                    )
                    self._results.append(result)
                    if result:
                        downloaded_files.append(result)

                url = next_url

        self.logger.info(
            "=== ブログスクレイピング完了: %d ファイルダウンロード ===",
            len(downloaded_files),
        )
        return downloaded_files


class BlogArticleScraper(BaseScraper):
    """特定のブログ記事URLから画像を一括ダウンロード"""

    def __init__(self, config: ScraperConfig, urls: list[str]):
        super().__init__(config)
        self.urls = urls

    def scrape(self) -> list[Path]:
        """指定された記事URLから画像をダウンロード"""
        downloaded_files: list[Path] = []

        for url in self.urls:
            self.logger.info("記事を処理中: %s", url)
            html = self.downloader.fetch_page(url)
            if not html:
                continue

            soup = BeautifulSoup(html, "html.parser")
            for img in soup.find_all("img"):
                src = img.get("src") or img.get("data-src") or ""
                if not src:
                    continue
                full_url = urljoin(url, src)
                parsed = urlparse(full_url)
                path_lower = parsed.path.lower()
                if any(path_lower.endswith(ext) for ext in self.config.image_extensions):
                    result = self.downloader.download_file(
                        full_url, subdir="blog/articles"
                    )
                    self._results.append(result)
                    if result:
                        downloaded_files.append(result)

        return downloaded_files
