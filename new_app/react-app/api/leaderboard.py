"""GET/POST /leaderboard  (mapped from /leaderboard via vercel.json rewrites)

Persists to Vercel KV (Upstash Redis REST) when its env vars are present, else
falls back to ephemeral /tmp so the endpoint still works before KV is connected.
Connect a KV/Upstash store to the Vercel project to make scores durable.
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile
import urllib.request

DATA_DIR = os.path.join(os.path.dirname(__file__), "_data")
LEADERBOARD_KEY = "pressure_chamber:leaderboard"
# On Vercel (Linux) this resolves to /tmp, the only writable path; cross-platform
# for local runs. Only used as a fallback when Vercel KV isn't configured.
TMP_LEADERBOARD = os.path.join(tempfile.gettempdir(), "pc_leaderboard.json")


def load_seed():
    try:
        with open(os.path.join(DATA_DIR, "leaderboard.json"), "r", encoding="utf-8-sig") as f:
            return json.load(f)
    except Exception:
        return []


def _kv_config():
    url = os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
    token = os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    return url, token


def kv_command(*command):
    url, token = _kv_config()
    if not url or not token:
        return None, False
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(list(command)).encode("utf-8"),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8")).get("result"), True
    except Exception:
        return None, False


def get_board():
    url, token = _kv_config()
    if url and token:
        result, ok = kv_command("GET", LEADERBOARD_KEY)
        if ok:
            if result:
                try:
                    return json.loads(result)
                except Exception:
                    return []
            return load_seed()
    try:
        with open(TMP_LEADERBOARD, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return load_seed()


def save_board(board):
    url, token = _kv_config()
    if url and token:
        kv_command("SET", LEADERBOARD_KEY, json.dumps(board))
        return
    try:
        with open(TMP_LEADERBOARD, "w", encoding="utf-8") as f:
            json.dump(board, f)
    except Exception:
        pass


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        board = get_board()
        top_10 = sorted(board, key=lambda x: x.get("score", 0), reverse=True)[:10]
        self._send(200, {"leaderboard": top_10})

    def do_POST(self):
        try:
            length = int(self.headers.get("content-length", 0) or 0)
        except (TypeError, ValueError):
            length = 0
        raw = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(raw or b"{}")
        except Exception:
            payload = {}

        name = (payload.get("name") or "").strip()
        score = payload.get("score")
        if not name:
            return self._send(400, {"error": "Name is required."})
        if not isinstance(score, (int, float)):
            return self._send(400, {"error": "Score must be a number."})

        board = get_board()
        board.append({"name": name[:24], "score": int(round(score))})
        save_board(board)
        self._send(200, {"ok": True})

    def _send(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
