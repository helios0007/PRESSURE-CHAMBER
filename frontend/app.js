const appState = {
  userName: "",
  language: "en",
  translations: {},
  tasks: [],
  completedTasks: [],
  scores: {},
  currentTask: null,
  total: 0,
};

const screens = {
  start: document.getElementById("screen-start"),
  language: document.getElementById("screen-language"),
  hub: document.getElementById("screen-hub"),
  prompt: document.getElementById("screen-prompt"),
  result: document.getElementById("screen-result"),
  final: document.getElementById("screen-final"),
  leaderboard: document.getElementById("screen-leaderboard"),
};

const els = {
  username: document.getElementById("username"),
  startBtn: document.getElementById("start-btn"),
  taskGrid: document.getElementById("task-grid"),
  promptTitle: document.getElementById("prompt-title"),
  promptTaskId: document.getElementById("prompt-task-id"),
  promptInstruction: document.getElementById("prompt-instruction"),
  promptInput: document.getElementById("prompt-input"),
  charCounter: document.getElementById("char-counter"),
  generateBtn: document.getElementById("generate-btn"),
  generatedImage: document.getElementById("generated-image"),
  targetImage: document.getElementById("target-image"),
  scoreLine: document.getElementById("score-line"),
  resultTaskId: document.getElementById("result-task-id"),
  resultScore: document.getElementById("result-score"),
  biasLine: document.getElementById("bias-line"),
  explanationLine: document.getElementById("explanation-line"),
  promptLine: document.getElementById("prompt-line"),
  backHubBtn: document.getElementById("back-hub-btn"),
  finalUser: document.getElementById("final-user"),
  finalList: document.getElementById("final-list"),
  finalTotal: document.getElementById("final-total"),
  viewLeaderboardBtn: document.getElementById("view-leaderboard-btn"),
  leaderboardList: document.getElementById("leaderboard-list"),
  resetBtn: document.getElementById("reset-btn"),
  backLanguage: document.getElementById("back-language"),
  backHub: document.getElementById("back-hub"),
  backPrompt: document.getElementById("back-prompt"),
  backResult: document.getElementById("back-result"),
  backFinal: document.getElementById("back-final"),
  backLeaderboard: document.getElementById("back-leaderboard"),
  loadingOverlay: document.getElementById("loading-overlay"),
};

let currentGenerateController = null;

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function showLoading(active) {
  els.loadingOverlay.classList.toggle("active", active);
  els.loadingOverlay.setAttribute("aria-hidden", active ? "false" : "true");
}

function t(key) {
  return appState.translations?.[appState.language]?.[key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-t]").forEach((el) => {
    el.textContent = t(el.dataset.t);
  });
}

function updateProgressIndicator() {
  const completed = appState.completedTasks.length;
  const dots = [0, 1, 2].map((idx) => (idx < completed ? "●" : "○")).join(" ");
  document.querySelectorAll("[data-progress]").forEach((el) => {
    el.textContent = dots;
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadTranslations() {
  const res = await fetch("/data/translations.json");
  appState.translations = await res.json();
  applyTranslations();
}

async function startSession() {
  let tasks = [];
  try {
    const res = await fetch("/start", { method: "POST" });
    const payload = await res.json();
    tasks = payload.tasks || [];
  } catch {
    const fallbackRes = await fetch("/data/tasks.json");
    tasks = await fallbackRes.json();
    tasks = (tasks || []).sort(() => Math.random() - 0.5).slice(0, 3);
  }

  appState.tasks = tasks.slice(0, 3);
  appState.completedTasks = [];
  appState.scores = {};
  appState.currentTask = null;
  updateProgressIndicator();
  renderTaskHub();
}

function renderTaskHub() {
  els.taskGrid.innerHTML = "";
  appState.tasks.forEach((task) => {
    const done = appState.completedTasks.includes(task.id);

    const card = document.createElement("article");
    card.className = `card task-card ${done ? "completed" : ""}`;
    card.innerHTML = `
      <div class="task-card-top">
        <div class="task-meta">
          <h3>Task ${task.id}: ${task.title}</h3>
          <p class="task-category">${task.category || "Bias Task"}</p>
          <p class="task-bias">${task.bias}</p>
        </div>
      </div>
      <button class="button btn" ${done ? "disabled" : ""}>${done ? "Completed" : "Select"}</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      if (done) return;
      appState.currentTask = task;
      els.promptTitle.textContent = task.title;
      els.promptTaskId.textContent = `Task ID: ${task.id}`;
      els.promptInstruction.textContent = task.instruction;
      els.promptInput.value = "";
      els.charCounter.textContent = "0/200";
      showScreen("prompt");
    });

    els.taskGrid.appendChild(card);
  });
}

function updateCounter() {
  els.charCounter.textContent = `${els.promptInput.value.length}/200`;
}

function applyScoreColor(score) {
  els.resultScore.classList.remove("score-low", "score-mid", "score-high");
  if (score < 40) {
    els.resultScore.classList.add("score-low");
  } else if (score < 70) {
    els.resultScore.classList.add("score-mid");
  } else {
    els.resultScore.classList.add("score-high");
  }
}

async function submitPrompt() {
  if (!appState.currentTask) {
    showScreen("hub");
    return;
  }

  const prompt = els.promptInput.value.trim();
  if (!prompt) {
    alert("Prompt cannot be empty.");
    return;
  }

  showLoading(true);
  currentGenerateController = new AbortController();

  try {
    const [res] = await Promise.all([
      fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, task_id: appState.currentTask.id }),
        signal: currentGenerateController.signal,
      }),
      delay(2000),
    ]);

    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload.error || "Image generation failed.");
    }
    if (Number(payload.task_id) !== Number(appState.currentTask.id)) {
      throw new Error("Task response mismatch");
    }
    const score = Number(payload.score || 0);
    const generatedUrl = payload.generated_image_url || payload.generated_image;

    if (!appState.completedTasks.includes(appState.currentTask.id)) {
      appState.completedTasks.push(appState.currentTask.id);
    }

    appState.scores[appState.currentTask.id] = score;
    updateProgressIndicator();

    els.generatedImage.loading = "lazy";
    els.targetImage.loading = "lazy";
    els.generatedImage.src = generatedUrl;
    els.targetImage.src = payload.target_image || generatedUrl;
    els.resultTaskId.textContent = `Task ID: ${payload.task_id} - ${payload.task_title || appState.currentTask.title}`;
    els.resultScore.textContent = `${score}`;
    applyScoreColor(score);
    els.scoreLine.textContent = `Similarity Score: ${score}`;
    els.biasLine.textContent = `Bias Category: ${payload.bias || appState.currentTask.bias || "Bias Pattern"}`;
    els.explanationLine.textContent = payload.explanation || "This output reflects embedded data bias patterns.";
    els.promptLine.textContent = `Prompt used: ${payload.user_prompt || prompt}`;

    showScreen("result");
  } catch (err) {
    if (err.name !== "AbortError") {
      alert(err.message || "Image generation failed. Please try again.");
    }
    showScreen("prompt");
  } finally {
    showLoading(false);
    currentGenerateController = null;
  }
}

function showFinal() {
  const rows = appState.tasks
    .filter((task) => appState.completedTasks.includes(task.id))
    .map((task) => ({ title: task.title, score: appState.scores[task.id] || 0 }));

  const total = rows.length
    ? Math.round(rows.reduce((sum, item) => sum + item.score, 0) / rows.length)
    : 0;

  appState.total = total;
  els.finalUser.textContent = appState.userName;
  els.finalList.innerHTML = rows.map((row) => `<p>${row.title}: ${row.score}</p>`).join("");
  els.finalTotal.textContent = `Total Score: ${total}`;
  showScreen("final");
}

async function loadLeaderboard() {
  await fetch("/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: appState.userName || "Guest", score: appState.total || 0 }),
  });

  const res = await fetch("/leaderboard");
  const payload = await res.json();
  els.leaderboardList.innerHTML = (payload.leaderboard || [])
    .map((entry) => `<li>${entry.name} - ${entry.score}</li>`)
    .join("");
}

function resetApp() {
  if (currentGenerateController) currentGenerateController.abort();
  appState.userName = "";
  appState.language = "en";
  appState.tasks = [];
  appState.completedTasks = [];
  appState.scores = {};
  appState.currentTask = null;
  appState.total = 0;
  els.username.value = "";
  updateProgressIndicator();
  applyTranslations();
  showScreen("start");
}

els.startBtn.addEventListener("click", () => {
  const name = els.username.value.trim();
  if (!name) {
    alert("Username must not be empty.");
    return;
  }
  appState.userName = name;
  showScreen("language");
});

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    appState.language = btn.dataset.lang;
    applyTranslations();
    await startSession();
    showScreen("hub");
  });
});

els.promptInput.addEventListener("input", updateCounter);
els.promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    submitPrompt();
  }
});
els.generateBtn.addEventListener("click", submitPrompt);

els.backHubBtn.addEventListener("click", () => {
  if (appState.completedTasks.length >= 3) {
    showFinal();
    return;
  }
  renderTaskHub();
  showScreen("hub");
});

els.viewLeaderboardBtn.addEventListener("click", async () => {
  await loadLeaderboard();
  showScreen("leaderboard");
});

els.resetBtn.addEventListener("click", resetApp);

els.backLanguage.addEventListener("click", () => showScreen("start"));
els.backHub.addEventListener("click", () => showScreen("language"));
els.backPrompt.addEventListener("click", () => showScreen("hub"));
els.backResult.addEventListener("click", () => showScreen("hub"));
els.backFinal.addEventListener("click", () => showScreen("hub"));
els.backLeaderboard.addEventListener("click", () => showScreen("final"));

function initBackgroundBlobs() {
  const cursorGlow = document.getElementById("cursor-glow");
  const mainBlob = document.querySelector(".blob-main");
  const floatingNodes = Array.from(document.querySelectorAll(".blob-floating"));

  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;
  let smoothX = mouseX;
  let smoothY = mouseY;
  let glowX = mouseX;
  let glowY = mouseY;

  const floating = floatingNodes.map((node) => {
    const size = Number(node.dataset.size) || 700;
    const speed = 0.05 + Math.random() * 0.1;
    const angle = Math.random() * Math.PI * 2;
    return {
      node,
      size,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      maxSpeed: 0.16,
    };
  });

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    smoothX += (mouseX - smoothX) * 0.08;
    smoothY += (mouseY - smoothY) * 0.08;
    glowX += (mouseX - glowX) * 0.05;
    glowY += (mouseY - glowY) * 0.05;

    const mainSize = Number(mainBlob.dataset.size) || 900;
    mainBlob.style.transform = `translate3d(${smoothX - mainSize / 2}px, ${smoothY - mainSize / 2}px, 0)`;
    cursorGlow.style.transform = `translate3d(${glowX - 320}px, ${glowY - 320}px, 0)`;

    floating.forEach((blob) => {
      blob.vx += (Math.random() - 0.5) * 0.01;
      blob.vy += (Math.random() - 0.5) * 0.01;

      const dx = mouseX - blob.x;
      const dy = mouseY - blob.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 500) {
        blob.vx += dx * 0.00005;
        blob.vy += dy * 0.00005;
      }

      const speed = Math.hypot(blob.vx, blob.vy);
      if (speed > blob.maxSpeed) {
        blob.vx = (blob.vx / speed) * blob.maxSpeed;
        blob.vy = (blob.vy / speed) * blob.maxSpeed;
      }

      blob.x += blob.vx;
      blob.y += blob.vy;

      if (blob.x < -200 || blob.x > w + 200) blob.vx *= -1;
      if (blob.y < -200 || blob.y > h + 200) blob.vy *= -1;

      blob.node.style.transform = `translate3d(${blob.x - blob.size / 2}px, ${blob.y - blob.size / 2}px, 0)`;
    });

    requestAnimationFrame(animate);
  }

  animate();
}

loadTranslations();
updateProgressIndicator();
initBackgroundBlobs();
