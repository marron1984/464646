"""設定クラスのテスト"""

import tempfile
from pathlib import Path

from nogizaka_scraper.config import ScraperConfig


def test_default_config():
    config = ScraperConfig()
    assert config.download_dir == "./downloads"
    assert config.request_delay == 2.0
    assert config.max_retries == 3
    assert config.skip_existing is True


def test_yaml_roundtrip():
    config = ScraperConfig(
        download_dir="/tmp/test",
        request_delay=5.0,
        blog_member_filter=["遠藤さくら"],
    )
    with tempfile.NamedTemporaryFile(suffix=".yml", delete=False) as f:
        config.save_yaml(f.name)
        loaded = ScraperConfig.from_yaml(f.name)

    assert loaded.download_dir == "/tmp/test"
    assert loaded.request_delay == 5.0
    assert loaded.blog_member_filter == ["遠藤さくら"]


def test_from_yaml_missing_file():
    config = ScraperConfig.from_yaml("/nonexistent/config.yml")
    assert config.download_dir == "./downloads"
