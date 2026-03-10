"""ロガー設定 / Logger Setup"""

import logging
import sys


def setup_logger(level: str = "INFO") -> logging.Logger:
    """アプリケーションロガーを設定"""
    logger = logging.getLogger("nogizaka_scraper")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s - %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger
