"""YouTube動画ダウンローダー / YouTube Video Downloader

yt-dlpを使用して乃木坂46関連のYouTube動画をダウンロードする。
"""

import logging
import re
import subprocess
import shutil
from pathlib import Path
from typing import Optional

from nogizaka_scraper.config import ScraperConfig
from nogizaka_scraper.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)


class YouTubeScraper(BaseScraper):
    """YouTube動画をダウンロード"""

    QUALITY_MAP = {
        "360p": "bestvideo[height<=360]+bestaudio/best[height<=360]",
        "480p": "bestvideo[height<=480]+bestaudio/best[height<=480]",
        "720p": "bestvideo[height<=720]+bestaudio/best[height<=720]",
        "1080p": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "best": "bestvideo+bestaudio/best",
    }

    def __init__(self, config: ScraperConfig):
        super().__init__(config)
        self.channel_ids = config.youtube_channel_ids
        self.max_results = config.youtube_max_results
        self.quality = config.youtube_download_quality
        self.api_key = config.youtube_api_key
        self.download_dir = Path(config.download_dir) / "youtube"
        self.download_dir.mkdir(parents=True, exist_ok=True)

    def _check_ytdlp(self) -> bool:
        """yt-dlpがインストールされているかチェック"""
        return shutil.which("yt-dlp") is not None

    def _get_channel_video_urls(self, channel_id: str) -> list[str]:
        """チャンネルの動画URL一覧を取得（yt-dlp使用）"""
        channel_url = f"https://www.youtube.com/channel/{channel_id}/videos"

        try:
            result = subprocess.run(
                [
                    "yt-dlp",
                    "--flat-playlist",
                    "--print", "url",
                    "--playlist-end", str(self.max_results),
                    channel_url,
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode != 0:
                self.logger.error("動画一覧の取得に失敗: %s", result.stderr)
                return []

            urls = [
                line.strip() for line in result.stdout.strip().split("\n")
                if line.strip()
            ]
            self.logger.info(
                "チャンネル %s から %d 件の動画を取得", channel_id, len(urls)
            )
            return urls

        except subprocess.TimeoutExpired:
            self.logger.error("タイムアウト: チャンネル %s", channel_id)
            return []
        except FileNotFoundError:
            self.logger.error("yt-dlpが見つかりません")
            return []

    def _download_video(self, url: str) -> Optional[Path]:
        """動画をダウンロード"""
        format_spec = self.QUALITY_MAP.get(self.quality, self.QUALITY_MAP["720p"])
        output_template = str(self.download_dir / "%(title)s [%(id)s].%(ext)s")

        try:
            result = subprocess.run(
                [
                    "yt-dlp",
                    "-f", format_spec,
                    "--merge-output-format", "mp4",
                    "-o", output_template,
                    "--no-overwrites",
                    "--write-thumbnail",
                    "--convert-thumbnails", "jpg",
                    "--embed-metadata",
                    "--progress",
                    url,
                ],
                capture_output=True,
                text=True,
                timeout=600,
            )

            if result.returncode != 0:
                if "has already been downloaded" in result.stderr:
                    self.logger.debug("スキップ（既存）: %s", url)
                    return None
                self.logger.error("ダウンロード失敗: %s\n%s", url, result.stderr)
                return None

            # ダウンロードされたファイルパスを取得
            for line in result.stdout.split("\n"):
                match = re.search(r"Destination: (.+\.mp4)", line)
                if match:
                    return Path(match.group(1))
                merge_match = re.search(r'\[Merger\] Merging formats into "(.+)"', line)
                if merge_match:
                    return Path(merge_match.group(1))

            self.logger.info("ダウンロード完了: %s", url)
            return self.download_dir

        except subprocess.TimeoutExpired:
            self.logger.error("タイムアウト: %s", url)
            return None
        except FileNotFoundError:
            self.logger.error("yt-dlpが見つかりません")
            return None

    def download_by_search(self, query: str, max_results: int = 10) -> list[Path]:
        """検索キーワードで動画をダウンロード"""
        self.logger.info("YouTube検索: '%s'", query)

        try:
            result = subprocess.run(
                [
                    "yt-dlp",
                    "--flat-playlist",
                    "--print", "url",
                    "--playlist-end", str(max_results),
                    f"ytsearch{max_results}:{query}",
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode != 0:
                self.logger.error("検索失敗: %s", result.stderr)
                return []

            urls = [
                line.strip() for line in result.stdout.strip().split("\n")
                if line.strip()
            ]
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            self.logger.error("検索エラー: %s", e)
            return []

        downloaded = []
        for url in urls:
            path = self._download_video(url)
            self._results.append(path)
            if path:
                downloaded.append(path)

        return downloaded

    def scrape(self) -> list[Path]:
        """チャンネルから動画をダウンロード"""
        self.logger.info("=== YouTube動画ダウンロード開始 ===")

        if not self._check_ytdlp():
            self.logger.error(
                "yt-dlpがインストールされていません。"
                "'pip install yt-dlp' でインストールしてください。"
            )
            return []

        downloaded_files: list[Path] = []

        for channel_id in self.channel_ids:
            self.logger.info("チャンネル処理中: %s", channel_id)
            video_urls = self._get_channel_video_urls(channel_id)

            for url in video_urls:
                path = self._download_video(url)
                self._results.append(path)
                if path:
                    downloaded_files.append(path)

        self.logger.info(
            "=== YouTube動画ダウンロード完了: %d 件 ===",
            len(downloaded_files),
        )
        return downloaded_files
