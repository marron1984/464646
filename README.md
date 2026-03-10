# 乃木坂46メディアスクレイパー

乃木坂46（および関連グループ）の画像・動画を自動で収集するPythonツールです。

## 機能

- **ブログ画像収集** - 公式ブログから画像を自動ダウンロード（メンバー別フォルダに整理）
- **YouTube動画ダウンロード** - 公式チャンネルの動画をyt-dlp経由でダウンロード
- **Webページ画像収集** - 任意のWebページから画像を一括ダウンロード
- **重複排除** - SHA-256ハッシュによるコンテンツレベルの重複排除
- **レート制限** - サーバーへの負荷を軽減する自動待機機能
- **YAML設定** - 柔軟な設定ファイル対応

## インストール

```bash
pip install -e .
```

または依存パッケージのみ:

```bash
pip install -r requirements.txt
```

YouTube動画のダウンロードには `yt-dlp` が必要です:

```bash
pip install yt-dlp
```

## 使い方

### 初期設定

設定ファイルのテンプレートを生成:

```bash
nogizaka-scraper init
```

### ブログ画像の収集

```bash
# 全メンバーのブログ画像を収集
nogizaka-scraper blog

# 特定メンバーのみ
nogizaka-scraper blog --members 遠藤さくら 賀喜遥香

# ページ数を制限
nogizaka-scraper blog --max-pages 5
```

### YouTube動画のダウンロード

```bash
# 公式チャンネルから動画をダウンロード
nogizaka-scraper youtube

# キーワード検索でダウンロード
nogizaka-scraper youtube --search "乃木坂46 MV"

# 品質を指定
nogizaka-scraper youtube --quality 1080p --max-results 10
```

### Webページから画像収集

```bash
# 指定URLから画像をダウンロード
nogizaka-scraper images --urls https://example.com/gallery
```

### 全スクレイパーを一括実行

```bash
nogizaka-scraper all
```

### 共通オプション

```bash
# ダウンロード先を指定
nogizaka-scraper blog -o ./my_downloads

# 設定ファイルを指定
nogizaka-scraper blog -c config.yml

# リクエスト間隔を変更（秒）
nogizaka-scraper blog --delay 3.0

# 詳細ログ出力
nogizaka-scraper blog -v
```

## 設定ファイル (YAML)

`nogizaka-scraper init` で生成されるテンプレート:

```yaml
download_dir: ./downloads
max_concurrent_downloads: 3
request_delay: 2.0
max_retries: 3
timeout: 30
skip_existing: true

blog_base_url: https://blog.nogizaka46.com
blog_member_filter: []
blog_max_pages: 10

youtube_channel_ids:
  - UCnSgMmHaG6-wjIxBBHqt7g
youtube_max_results: 50
youtube_download_quality: 720p
```

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `YOUTUBE_API_KEY` | YouTube Data API キー |
| `NOGI_DOWNLOAD_DIR` | ダウンロードディレクトリ |

## プロジェクト構造

```
nogizaka_scraper/
├── __init__.py          # パッケージ初期化
├── __main__.py          # python -m 実行用
├── cli.py               # CLIインターフェース
├── config.py            # 設定管理
├── scrapers/
│   ├── base.py          # スクレイパー基底クラス
│   ├── blog_scraper.py  # ブログ画像スクレイパー
│   ├── youtube_scraper.py # YouTube動画ダウンローダー
│   └── web_image_scraper.py # Web画像スクレイパー
└── utils/
    ├── downloader.py    # ダウンロードマネージャー
    └── logger.py        # ロガー設定
```

## 注意事項

- 本ツールは個人利用目的です。収集したコンテンツの再配布は各権利者の規約に従ってください。
- サーバーに過度な負荷をかけないよう、`request_delay` を適切に設定してください（デフォルト: 2秒）。
- robots.txt を確認し、スクレイピングが許可されているかご確認ください。

## ライセンス

MIT License
