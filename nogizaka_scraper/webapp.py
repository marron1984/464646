"""Flask Webアプリケーション / Web Application"""

import json
import logging
import queue
import threading
import time
import uuid
from dataclasses import asdict
from pathlib import Path

from flask import Flask, jsonify, render_template, request, Response

from nogizaka_scraper.config import ScraperConfig
from nogizaka_scraper.members import MEMBERS, get_active_members, search_members
from nogizaka_scraper.oshi import OshiConfig

logger = logging.getLogger(__name__)

app = Flask(
    __name__,
    template_folder=str(Path(__file__).parent / "templates"),
    static_folder=str(Path(__file__).parent / "static"),
)

# グローバルステート
oshi_config = OshiConfig.load()
scraper_config = ScraperConfig.from_env()

# ジョブ管理
jobs: dict[str, dict] = {}
event_queues: dict[str, queue.Queue] = {}


def _send_event(job_id: str, event_type: str, data: dict) -> None:
    """SSEイベントを送信"""
    if job_id in event_queues:
        event_queues[job_id].put({"type": event_type, "data": data})


def _run_scrape_job(job_id: str, targets: list[str], mode: str) -> None:
    """スクレイピングジョブをバックグラウンドで実行"""
    from nogizaka_scraper.scrapers.blog_scraper import BlogScraper
    from nogizaka_scraper.scrapers.youtube_scraper import YouTubeScraper
    from nogizaka_scraper.scrapers.web_image_scraper import WebImageScraper

    job = jobs[job_id]
    job["status"] = "running"
    total_files = 0

    try:
        if mode in ("blog", "all"):
            _send_event(job_id, "status", {"message": "ブログ画像を収集中..."})

            config = ScraperConfig.from_env()
            config.download_dir = scraper_config.download_dir

            # 推し優先: 推しメンバーを先に、ページ数も多く
            for member_name in targets:
                is_oshi = oshi_config.is_oshi(member_name)
                max_pages = oshi_config.get_max_pages(member_name)

                if max_pages == 0:
                    continue

                config.blog_member_filter = [member_name]
                config.blog_max_pages = max_pages

                label = "⭐推し" if is_oshi else ""
                _send_event(job_id, "progress", {
                    "member": member_name,
                    "is_oshi": is_oshi,
                    "message": f"{label} {member_name} のブログを処理中 (最大{max_pages}ページ)",
                })

                scraper = BlogScraper(config)
                files = scraper.scrape()
                total_files += len(files)

                _send_event(job_id, "progress", {
                    "member": member_name,
                    "downloaded": len(files),
                    "message": f"{member_name}: {len(files)}枚ダウンロード",
                })

        if mode in ("youtube", "all"):
            _send_event(job_id, "status", {"message": "YouTube動画を検索中..."})
            config = ScraperConfig.from_env()
            config.download_dir = scraper_config.download_dir

            yt_scraper = YouTubeScraper(config)

            # 推しメンバーのYouTube検索
            if oshi_config.oshi_youtube_search:
                for oshi_name in oshi_config.oshi_members:
                    _send_event(job_id, "progress", {
                        "message": f"YouTube検索: 乃木坂46 {oshi_name}",
                    })
                    files = yt_scraper.download_by_search(
                        f"乃木坂46 {oshi_name}", max_results=5
                    )
                    total_files += len(files)
            else:
                files = yt_scraper.scrape()
                total_files += len(files)

        if mode == "images":
            _send_event(job_id, "status", {"message": "Web画像を収集中..."})
            config = ScraperConfig.from_env()
            config.download_dir = scraper_config.download_dir
            # targets にはURLが入る
            img_scraper = WebImageScraper(config, target_urls=targets)
            files = img_scraper.scrape()
            total_files += len(files)

        job["status"] = "completed"
        job["total_files"] = total_files
        _send_event(job_id, "complete", {
            "message": f"完了！ {total_files}ファイルをダウンロードしました",
            "total": total_files,
        })

    except Exception as e:
        logger.exception("ジョブ実行エラー")
        job["status"] = "error"
        job["error"] = str(e)
        _send_event(job_id, "error", {"message": f"エラー: {e}"})

    finally:
        _send_event(job_id, "done", {})


# --- API Routes ---


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/members")
def api_members():
    """メンバー一覧"""
    q = request.args.get("q", "")
    members = search_members(q) if q else get_active_members()
    return jsonify([
        {
            "name": m.name,
            "name_kana": m.name_kana,
            "name_romaji": m.name_romaji,
            "generation": m.generation,
            "is_oshi": oshi_config.is_oshi(m.name),
            "oshi_rank": oshi_config.get_oshi_rank(m.name),
        }
        for m in members
    ])


@app.route("/api/oshi", methods=["GET"])
def api_get_oshi():
    """推し設定を取得"""
    return jsonify(asdict(oshi_config))


@app.route("/api/oshi", methods=["POST"])
def api_set_oshi():
    """推し設定を更新"""
    global oshi_config
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data"}), 400

    oshi_config = OshiConfig(
        oshi_members=data.get("oshi_members", []),
        oshi_priority_multiplier=data.get("oshi_priority_multiplier", 3),
        collect_non_oshi=data.get("collect_non_oshi", True),
        non_oshi_max_pages=data.get("non_oshi_max_pages", 2),
        oshi_max_pages=data.get("oshi_max_pages", 20),
        oshi_youtube_search=data.get("oshi_youtube_search", True),
    )
    oshi_config.save()
    return jsonify({"status": "ok", "oshi": asdict(oshi_config)})


@app.route("/api/oshi/add", methods=["POST"])
def api_add_oshi():
    """推しを追加"""
    global oshi_config
    data = request.get_json()
    name = data.get("name", "")
    if name and name not in oshi_config.oshi_members:
        oshi_config.oshi_members.append(name)
        oshi_config.save()
    return jsonify({"status": "ok", "oshi_members": oshi_config.oshi_members})


@app.route("/api/oshi/remove", methods=["POST"])
def api_remove_oshi():
    """推しを削除"""
    global oshi_config
    data = request.get_json()
    name = data.get("name", "")
    if name in oshi_config.oshi_members:
        oshi_config.oshi_members.remove(name)
        oshi_config.save()
    return jsonify({"status": "ok", "oshi_members": oshi_config.oshi_members})


@app.route("/api/oshi/reorder", methods=["POST"])
def api_reorder_oshi():
    """推し順序を変更"""
    global oshi_config
    data = request.get_json()
    new_order = data.get("oshi_members", [])
    oshi_config.oshi_members = new_order
    oshi_config.save()
    return jsonify({"status": "ok", "oshi_members": oshi_config.oshi_members})


@app.route("/api/scrape/start", methods=["POST"])
def api_start_scrape():
    """スクレイピングジョブを開始"""
    data = request.get_json() or {}
    mode = data.get("mode", "blog")  # blog, youtube, images, all
    targets = data.get("targets", [])

    # ターゲットが空の場合は推しメンバーを優先
    if not targets and mode != "images":
        # 推しを先頭に、それ以外を後ろに
        oshi_names = list(oshi_config.oshi_members)
        if oshi_config.collect_non_oshi:
            other_names = [
                m.name for m in MEMBERS
                if m.name not in oshi_names
            ]
            targets = oshi_names + other_names
        else:
            targets = oshi_names

    if not targets:
        return jsonify({"error": "対象が指定されていません"}), 400

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "id": job_id,
        "mode": mode,
        "targets": targets,
        "status": "queued",
        "total_files": 0,
    }
    event_queues[job_id] = queue.Queue()

    thread = threading.Thread(
        target=_run_scrape_job, args=(job_id, targets, mode), daemon=True
    )
    thread.start()

    return jsonify({"job_id": job_id, "status": "started"})


@app.route("/api/scrape/status/<job_id>")
def api_scrape_status(job_id: str):
    """ジョブステータス"""
    if job_id not in jobs:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(jobs[job_id])


@app.route("/api/scrape/events/<job_id>")
def api_scrape_events(job_id: str):
    """SSEイベントストリーム"""
    if job_id not in event_queues:
        return jsonify({"error": "Job not found"}), 404

    def generate():
        q = event_queues[job_id]
        while True:
            try:
                event = q.get(timeout=30)
                yield f"event: {event['type']}\ndata: {json.dumps(event['data'], ensure_ascii=False)}\n\n"
                if event["type"] == "done":
                    break
            except queue.Empty:
                yield f"event: ping\ndata: {{}}\n\n"

    return Response(generate(), mimetype="text/event-stream")


@app.route("/api/config", methods=["GET"])
def api_get_config():
    """スクレイパー設定を取得"""
    return jsonify({
        "download_dir": scraper_config.download_dir,
        "request_delay": scraper_config.request_delay,
        "max_retries": scraper_config.max_retries,
        "skip_existing": scraper_config.skip_existing,
        "youtube_download_quality": scraper_config.youtube_download_quality,
    })


@app.route("/api/config", methods=["POST"])
def api_set_config():
    """スクレイパー設定を更新"""
    global scraper_config
    data = request.get_json() or {}
    if "download_dir" in data:
        scraper_config.download_dir = data["download_dir"]
    if "request_delay" in data:
        scraper_config.request_delay = float(data["request_delay"])
    if "youtube_download_quality" in data:
        scraper_config.youtube_download_quality = data["youtube_download_quality"]
    if "skip_existing" in data:
        scraper_config.skip_existing = bool(data["skip_existing"])
    return jsonify({"status": "ok"})


def run_webapp(host: str = "0.0.0.0", port: int = 5000, debug: bool = False):
    """Webアプリを起動"""
    app.run(host=host, port=port, debug=debug, threaded=True)
