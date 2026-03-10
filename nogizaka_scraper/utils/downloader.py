"""ダウンロードマネージャー / Download Manager"""

import hashlib
import logging
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse, unquote

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class DownloadManager:
    """ファイルダウンロードを管理するクラス"""

    def __init__(
        self,
        download_dir: str = "./downloads",
        max_retries: int = 3,
        timeout: int = 30,
        request_delay: float = 2.0,
        user_agent: str = "",
        skip_existing: bool = True,
    ):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)
        self.timeout = timeout
        self.request_delay = request_delay
        self.skip_existing = skip_existing
        self._last_request_time = 0.0

        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": user_agent or (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        })

        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        self._downloaded_hashes: set[str] = set()

    def _wait_for_rate_limit(self) -> None:
        """レート制限のための待機"""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.request_delay:
            time.sleep(self.request_delay - elapsed)
        self._last_request_time = time.time()

    def _get_filename_from_url(self, url: str) -> str:
        """URLからファイル名を取得"""
        parsed = urlparse(url)
        path = unquote(parsed.path)
        filename = Path(path).name
        if not filename or filename == "/":
            filename = hashlib.md5(url.encode()).hexdigest()
        return filename

    def _compute_hash(self, data: bytes) -> str:
        """コンテンツのハッシュを計算"""
        return hashlib.sha256(data).hexdigest()

    def download_file(
        self,
        url: str,
        subdir: str = "",
        filename: Optional[str] = None,
    ) -> Optional[Path]:
        """ファイルをダウンロード

        Args:
            url: ダウンロードURL
            subdir: ダウンロード先のサブディレクトリ
            filename: 保存ファイル名（省略時はURLから自動取得）

        Returns:
            保存先パス（スキップ・エラー時はNone）
        """
        if not filename:
            filename = self._get_filename_from_url(url)

        save_dir = self.download_dir / subdir if subdir else self.download_dir
        save_dir.mkdir(parents=True, exist_ok=True)
        save_path = save_dir / filename

        if self.skip_existing and save_path.exists():
            logger.debug("スキップ（既存）: %s", save_path)
            return None

        self._wait_for_rate_limit()

        try:
            response = self.session.get(url, timeout=self.timeout, stream=True)
            response.raise_for_status()

            content = response.content
            content_hash = self._compute_hash(content)

            if content_hash in self._downloaded_hashes:
                logger.debug("スキップ（重複）: %s", url)
                return None

            self._downloaded_hashes.add(content_hash)

            with open(save_path, "wb") as f:
                f.write(content)

            size_kb = len(content) / 1024
            logger.info("ダウンロード完了: %s (%.1f KB)", save_path, size_kb)
            return save_path

        except requests.RequestException as e:
            logger.error("ダウンロード失敗: %s - %s", url, e)
            return None

    def fetch_page(self, url: str, **kwargs) -> Optional[str]:
        """ページHTMLを取得

        Args:
            url: ページURL

        Returns:
            HTML文字列（エラー時はNone）
        """
        self._wait_for_rate_limit()

        try:
            response = self.session.get(url, timeout=self.timeout, **kwargs)
            response.raise_for_status()
            response.encoding = response.apparent_encoding
            return response.text
        except requests.RequestException as e:
            logger.error("ページ取得失敗: %s - %s", url, e)
            return None

    @property
    def stats(self) -> dict:
        """ダウンロード統計"""
        return {
            "unique_files": len(self._downloaded_hashes),
        }
