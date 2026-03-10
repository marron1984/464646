"""ダウンロードマネージャーのテスト"""

import tempfile
from pathlib import Path

from nogizaka_scraper.utils.downloader import DownloadManager


def test_get_filename_from_url():
    dm = DownloadManager(download_dir=tempfile.mkdtemp())
    assert dm._get_filename_from_url("https://example.com/img/photo.jpg") == "photo.jpg"
    assert dm._get_filename_from_url("https://example.com/path/image.png") == "image.png"


def test_compute_hash():
    dm = DownloadManager(download_dir=tempfile.mkdtemp())
    h1 = dm._compute_hash(b"test data")
    h2 = dm._compute_hash(b"test data")
    h3 = dm._compute_hash(b"other data")
    assert h1 == h2
    assert h1 != h3


def test_download_dir_creation():
    with tempfile.TemporaryDirectory() as tmpdir:
        download_dir = Path(tmpdir) / "new_subdir"
        dm = DownloadManager(download_dir=str(download_dir))
        assert download_dir.exists()
