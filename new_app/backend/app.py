import json
import random
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from similarity import calculate_similarity_score

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
TASKS_PATH = DATA_DIR / "tasks.json"
TASKS_2_PATH = DATA_DIR / "tasks_2.json"
LEADERBOARD_PATH = DATA_DIR / "leaderboard.json"
PROMPT_LOGS_PATH = DATA_DIR / "prompt_logs.json"

# Active demo tasks for current exhibition dataset (keep full tasks.json unchanged).
# Update this set if you want to temporarily limit task IDs.
ACTIVE_TASK_IDS = set(range(1, 28))

app = Flask(__name__)


def load_json(path: Path, default):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8-sig") as f:
        return json.load(f)


def save_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)


def get_tasks():
    return load_json(TASKS_PATH, [])


def get_bias_tasks():
    return load_json(TASKS_2_PATH, [])


def get_active_tasks():
    tasks = get_tasks()
    return [task for task in tasks if int(task.get("id", -1)) in ACTIVE_TASK_IDS]


def resolve_local_image_path(web_path: str) -> Path:
    # Convert "/images/tasks/1/generated.jpg" -> BASE_DIR / "images/tasks/1/generated.jpg"
    return BASE_DIR / web_path.lstrip("/")


def pick_generated_image_for_task(task: dict) -> str:
    task_id = int(task.get("id", 0))
    if not task_id:
        return ""

    # Prefer custom user_input image if present; otherwise fallback to generated.jpg
    user_input_web = f"/images/tasks/{task_id}/user_input.png"
    if resolve_local_image_path(user_input_web).exists():
        return user_input_web

    return f"/images/tasks/{task_id}/generated.jpg"


def pick_target_image_for_task(task: dict) -> str:
    task_id = int(task.get("id", 0))
    if not task_id:
        return ""
    # Strict target path by task ID.
    return f"/images/targets/task_{task_id:02d}.png"


def log_prompt(task_id, prompt: str):
    logs = load_json(PROMPT_LOGS_PATH, [])
    logs.append(
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "task_id": task_id,
            "prompt": prompt,
        }
    )
    # Keep file bounded for kiosk reliability.
    logs = logs[-500:]
    save_json(PROMPT_LOGS_PATH, logs)


@app.route("/", methods=["GET"])
def index():
    return send_from_directory(BASE_DIR / "frontend", "index.html")


@app.route("/<path:filename>", methods=["GET"])
def frontend_files(filename):
    frontend_file = BASE_DIR / "frontend" / filename
    if frontend_file.exists():
        return send_from_directory(BASE_DIR / "frontend", filename)

    workspace_file = BASE_DIR / filename
    if workspace_file.exists():
        return send_from_directory(BASE_DIR, filename)

    return jsonify({"error": "Not found"}), 404


@app.route("/start", methods=["POST"])
def start_session():
    bias_tasks = get_bias_tasks()
    if len(bias_tasks) >= 3:
        selected = random.sample(bias_tasks, 3)
        return jsonify({"tasks": selected})

    tasks = get_active_tasks()
    if len(tasks) < 3:
        return jsonify({"error": "Not enough tasks configured."}), 500

    selected = random.sample(tasks, 3)
    return jsonify({"tasks": selected})


@app.route("/generate", methods=["POST"])
def generate():
    payload = request.get_json(silent=True) or {}
    prompt = (payload.get("prompt") or "").strip() or "Untitled prompt"
    raw_task_id = payload.get("task_id")
    task_id = str(raw_task_id or "").strip()
    if not task_id:
        return jsonify({"error": "Invalid task_id."}), 400

    if len(prompt) > 200:
        prompt = prompt[:200]

    tasks = get_active_tasks()
    bias_tasks = get_bias_tasks()
    task = next((t for t in tasks if str(t.get("id", "")) == task_id), None)
    if task is None:
        task = next((t for t in bias_tasks if str(t.get("id", "")) == task_id), None)

    if task is None:
        return jsonify({"error": "Invalid task_id."}), 400

    if task.get("biased_image_path") and task.get("neutral_image_path"):
        generated_image = task["biased_image_path"]
        target_image = task["neutral_image_path"]
    else:
        generated_image = pick_generated_image_for_task(task)
        target_image = pick_target_image_for_task(task)

    generated_path = resolve_local_image_path(generated_image)
    if not generated_path.exists():
        generated_image = "/images/placeholder.png"
        generated_path = resolve_local_image_path(generated_image)

    target_path = resolve_local_image_path(target_image)
    if not target_path.exists():
        target_image = generated_image
        target_path = resolve_local_image_path(target_image)

    log_prompt(task_id, prompt)

    try:
        score = calculate_similarity_score(generated_path, target_path)
    except Exception:
        score = 65

    return jsonify(
        {
            "task_id": task_id,
            "task_title": task.get("title", ""),
            "generated_image": generated_image,
            "generated_image_url": generated_image,
            "target_image": target_image,
            "score": int(score),
            "explanation": task.get("explanation", ""),
            "bias": task.get("bias", ""),
            "user_prompt": prompt,
            "meta": {"provider": "demo", "mode": "offline-static"},
        }
    )


@app.route("/config/status", methods=["GET"])
def config_status():
    return jsonify({"configured": True, "source": "demo-mode"})


@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    board = load_json(LEADERBOARD_PATH, [])
    top_10 = sorted(board, key=lambda x: x.get("score", 0), reverse=True)[:10]
    return jsonify({"leaderboard": top_10})


@app.route("/leaderboard", methods=["POST"])
def add_leaderboard_score():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    score = payload.get("score")

    if not name:
        return jsonify({"error": "Name is required."}), 400
    if not isinstance(score, (int, float)):
        return jsonify({"error": "Score must be a number."}), 400

    board = load_json(LEADERBOARD_PATH, [])
    board.append({"name": name[:24], "score": int(round(score))})
    save_json(LEADERBOARD_PATH, board)

    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)
