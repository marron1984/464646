"""CLI インターフェース / Command Line Interface"""

import argparse
import sys
from pathlib import Path

from nogizaka_scraper import __version__
from nogizaka_scraper.config import ScraperConfig
from nogizaka_scraper.utils.logger import setup_logger


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="nogizaka-scraper",
        description="乃木坂46メディアスクレイパー - 画像・動画自動収集ツール",
    )
    parser.add_argument(
        "--version", action="version", version=f"%(prog)s {__version__}"
    )
    parser.add_argument(
        "-c", "--config",
        help="設定ファイルのパス (YAML)",
        default=None,
    )
    parser.add_argument(
        "-o", "--output",
        help="ダウンロード先ディレクトリ",
        default="./downloads",
    )
    parser.add_argument(
        "--delay",
        help="リクエスト間の待機時間（秒）",
        type=float,
        default=2.0,
    )
    parser.add_argument(
        "-v", "--verbose",
        help="詳細ログ出力",
        action="store_true",
    )

    subparsers = parser.add_subparsers(dest="command", help="実行するコマンド")

    # blog コマンド
    blog_parser = subparsers.add_parser("blog", help="公式ブログから画像を収集")
    blog_parser.add_argument(
        "--members",
        nargs="*",
        help="対象メンバー名（部分一致）",
        default=[],
    )
    blog_parser.add_argument(
        "--max-pages",
        type=int,
        help="1メンバーあたりの最大ページ数",
        default=10,
    )

    # youtube コマンド
    yt_parser = subparsers.add_parser("youtube", help="YouTube動画をダウンロード")
    yt_parser.add_argument(
        "--channels",
        nargs="*",
        help="チャンネルID",
        default=[],
    )
    yt_parser.add_argument(
        "--search",
        help="検索キーワード",
        default=None,
    )
    yt_parser.add_argument(
        "--quality",
        choices=["360p", "480p", "720p", "1080p", "best"],
        help="動画品質",
        default="720p",
    )
    yt_parser.add_argument(
        "--max-results",
        type=int,
        help="最大ダウンロード数",
        default=50,
    )

    # images コマンド
    img_parser = subparsers.add_parser("images", help="Webページから画像を収集")
    img_parser.add_argument(
        "--urls",
        nargs="+",
        help="対象ページのURL",
        required=True,
    )

    # init コマンド
    subparsers.add_parser(
        "init", help="設定ファイルのテンプレートを生成"
    )

    # all コマンド
    subparsers.add_parser("all", help="全スクレイパーを実行")

    return parser


def cmd_blog(config: ScraperConfig, args: argparse.Namespace) -> None:
    from nogizaka_scraper.scrapers.blog_scraper import BlogScraper

    if args.members:
        config.blog_member_filter = args.members
    config.blog_max_pages = args.max_pages

    scraper = BlogScraper(config)
    files = scraper.scrape()
    print(f"\nダウンロード完了: {len(files)} ファイル")


def cmd_youtube(config: ScraperConfig, args: argparse.Namespace) -> None:
    from nogizaka_scraper.scrapers.youtube_scraper import YouTubeScraper

    if args.channels:
        config.youtube_channel_ids = args.channels
    config.youtube_download_quality = args.quality
    config.youtube_max_results = args.max_results

    scraper = YouTubeScraper(config)

    if args.search:
        files = scraper.download_by_search(args.search, args.max_results)
    else:
        files = scraper.scrape()
    print(f"\nダウンロード完了: {len(files)} ファイル")


def cmd_images(config: ScraperConfig, args: argparse.Namespace) -> None:
    from nogizaka_scraper.scrapers.web_image_scraper import WebImageScraper

    scraper = WebImageScraper(config, target_urls=args.urls)
    files = scraper.scrape()
    print(f"\nダウンロード完了: {len(files)} ファイル")


def cmd_init(config: ScraperConfig, _args: argparse.Namespace) -> None:
    config_path = "nogizaka_scraper.yml"
    config.save_yaml(config_path)
    print(f"設定ファイルを生成しました: {config_path}")
    print("お好みに合わせて編集してください。")


def cmd_all(config: ScraperConfig, _args: argparse.Namespace) -> None:
    from nogizaka_scraper.scrapers.blog_scraper import BlogScraper
    from nogizaka_scraper.scrapers.youtube_scraper import YouTubeScraper

    total = 0

    print("\n--- ブログ画像収集 ---")
    blog_scraper = BlogScraper(config)
    blog_files = blog_scraper.scrape()
    total += len(blog_files)

    print("\n--- YouTube動画ダウンロード ---")
    yt_scraper = YouTubeScraper(config)
    yt_files = yt_scraper.scrape()
    total += len(yt_files)

    print(f"\n=== 全収集完了: {total} ファイル ===")


def main() -> None:
    parser = create_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    # 設定読み込み
    if args.config:
        config = ScraperConfig.from_yaml(args.config)
    else:
        config = ScraperConfig.from_env()

    config.download_dir = args.output
    config.request_delay = args.delay
    if args.verbose:
        config.log_level = "DEBUG"

    setup_logger(config.log_level)

    commands = {
        "blog": cmd_blog,
        "youtube": cmd_youtube,
        "images": cmd_images,
        "init": cmd_init,
        "all": cmd_all,
    }

    handler = commands.get(args.command)
    if handler:
        handler(config, args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
