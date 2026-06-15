"""POST /start  (mapped from /start via vercel.json rewrites)

Returns 3 random tasks, mirroring the Flask /start endpoint. The React frontend
falls back to the static /data/tasks_2.json if this ever fails, so it is best-effort.
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import random

DATA_DIR = os.path.join(os.path.dirname(__file__), "_data")


def load_data(name, default):
    try:
        with open(os.path.join(DATA_DIR, name), "r", encoding="utf-8-sig") as f:
            return json.load(f)
    except Exception:
        return default


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        bias_tasks = load_data("tasks_2.json", [])
        if len(bias_tasks) >= 3:
            return self._send(200, {"tasks": random.sample(bias_tasks, 3)})

        tasks = load_data("tasks.json", [])
        if len(tasks) < 3:
            return self._send(500, {"error": "Not enough tasks configured."})
        return self._send(200, {"tasks": random.sample(tasks, 3)})

    # Allow GET too, harmless for quick checks.
    do_GET = do_POST

    def _send(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
