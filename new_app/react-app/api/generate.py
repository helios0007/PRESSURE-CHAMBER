"""POST /generate  (mapped from /generate via vercel.json rewrites)

Stdlib-only port of the Flask /generate endpoint. Returns the same JSON shape.
Image similarity is not recomputed here (the bias-playground UI hides the score,
and the heavy PIL/numpy scoring isn't worth bundling) — score falls back to the
same value the original used when scoring failed.
"""
from http.server import BaseHTTPRequestHandler
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "_data")


def load_data(name, default):
    try:
        with open(os.path.join(DATA_DIR, name), "r", encoding="utf-8-sig") as f:
            return json.load(f)
    except Exception:
        return default


class handler(BaseHTTPRequestHandler):
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

        prompt = (payload.get("prompt") or "").strip() or "Untitled prompt"
        if len(prompt) > 200:
            prompt = prompt[:200]

        task_id = str(payload.get("task_id") or "").strip()
        if not task_id:
            return self._send(400, {"error": "Invalid task_id."})

        tasks = load_data("tasks.json", [])
        bias_tasks = load_data("tasks_2.json", [])
        task = next((t for t in tasks if str(t.get("id", "")) == task_id), None)
        if task is None:
            task = next((t for t in bias_tasks if str(t.get("id", "")) == task_id), None)
        if task is None:
            return self._send(400, {"error": "Invalid task_id."})

        if task.get("biased_image_path") and task.get("neutral_image_path"):
            generated_image = task["biased_image_path"]
            target_image = task["neutral_image_path"]
        else:
            try:
                tid = int(task.get("id", 0) or 0)
            except (TypeError, ValueError):
                tid = 0
            generated_image = f"/images/tasks/{tid}/user_input.png"
            target_image = f"/images/targets/task_{tid:02d}.png"

        self._send(200, {
            "task_id": task_id,
            "task_title": task.get("title", ""),
            "generated_image": generated_image,
            "generated_image_url": generated_image,
            "target_image": target_image,
            "score": 65,
            "explanation": task.get("explanation", ""),
            "bias": task.get("bias", ""),
            "user_prompt": prompt,
            "meta": {"provider": "demo", "mode": "vercel-static"},
        })

    def _send(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
