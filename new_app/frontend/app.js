const appState = {
  userName: "",
  language: "en",
  translations: {},
  tasks: [],
  completedTasks: [],
  scores: {},
  currentTask: null,
  total: 0,
  showOverlayUI: true,
};

const screens = {
  start: document.getElementById("screen-start"),
  introVideo: document.getElementById("screen-intro-video"),
  instructionChoice: document.getElementById("screen-instruction-choice"),
  instructionVideo: document.getElementById("screen-instruction-video"),
  language: document.getElementById("screen-language"),
  hub: document.getElementById("screen-hub"),
  biasGames: document.getElementById("screen-bias-games"),
  biasPlay: document.getElementById("screen-bias-play"),
  prompt: document.getElementById("screen-prompt"),
  result: document.getElementById("screen-result"),
  final: document.getElementById("screen-final"),
  leaderboard: document.getElementById("screen-leaderboard"),
};

const els = {
  username: document.getElementById("username"),
  startBtn: document.getElementById("start-btn"),

  cinematicToggleBtn: document.getElementById("cinematic-toggle-btn"),
  toggleIcon: document.getElementById("toggle-icon"),

  skipIntroBtn: document.getElementById("skip-intro-btn"),
  replayIntroBtn: document.getElementById("replay-intro-btn"),
  continueFromIntroBtn: document.getElementById("continue-from-intro-btn"),
  introVideo: document.getElementById("intro-video"),

  playInstructionBtn: document.getElementById("play-instruction-btn"),
  skipToSetupBtn: document.getElementById("skip-to-setup-btn"),

  backInstructionChoiceBtn: document.getElementById("back-instruction-choice-btn"),
  replayInstructionBtn: document.getElementById("replay-instruction-btn"),
  continueToLanguageBtn: document.getElementById("continue-to-language-btn"),
  instructionVideo: document.getElementById("instruction-video"),

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
  openBiasPreviewBtn: document.getElementById("open-bias-preview-btn"),
  openBiasPlaygroundBtn: document.getElementById("open-bias-playground-btn"),
  backBiasGamesBtn: document.getElementById("back-bias-games-btn"),
  backBiasPlayBtn: document.getElementById("back-bias-play-btn"),
  biasGamesGrid: document.getElementById("bias-games-grid"),
  biasPlayTitle: document.getElementById("bias-play-title"),
  biasPlayPrompt: document.getElementById("bias-play-prompt"),
  toggleBiasBtn: document.getElementById("toggle-bias-btn"),
  biasVideo: document.getElementById("bias-video"),
  biasCanvas: document.getElementById("bias-canvas"),
  biasFallbackImage: document.getElementById("bias-fallback-image"),
  biasExplanation: document.getElementById("bias-explanation"),
  biasFeedback: document.getElementById("bias-feedback"),
  biasExplainBtn: document.getElementById("bias-explain-btn"),
  biasInfoOverlay: document.getElementById("bias-info-overlay"),
  biasInfoWhat: document.getElementById("bias-info-what"),
  biasInfoWhy: document.getElementById("bias-info-why"),
  biasInfoImpact: document.getElementById("bias-info-impact"),
  closeBiasInfoBtn: document.getElementById("close-bias-info-btn"),

  loadingOverlay: document.getElementById("loading-overlay"),
};

let currentGenerateController = null;
let biasExplanationData = {};

async function loadBiasExplanations() {
  try {
    const res = await fetch("/data/bias_explanations.json");
    biasExplanationData = await res.json();
  } catch {
    biasExplanationData = {};
  }
}

// === BIAS PLAYGROUND ADDITION START ===
const PLACEHOLDER_IMAGE = "/images/placeholder.png";
const BIAS_DATA_PATH = "/data/tasks_2.json";

appState.biasGames = [];
appState.currentBiasGame = null;
appState.biasModeActive = false;
appState.cameraStream = null;
appState.renderLoopId = null;

function safeLoadImage(imgEl, src) {
  if (!imgEl) return;
  const source = src || PLACEHOLDER_IMAGE;
  imgEl.onerror = () => {
    if (imgEl.src !== PLACEHOLDER_IMAGE) {
      imgEl.src = PLACEHOLDER_IMAGE;
    }
  };
  imgEl.src = source;
}

async function loadBiasGames() {
  try {
    const res = await fetch(BIAS_DATA_PATH);
    const payload = await res.json();
    const loadedGames = Array.isArray(payload)
      ? payload.map((game) => ({
          ...game,
          instruction: game.instruction || game.prompt || "Write a prompt for this bias scenario.",
          bias: game.bias || "Bias Playground",
          category: game.category || "Bias Playground",
        }))
      : [];

    appState.biasGames = loadedGames
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  } catch {
    appState.biasGames = [];
  }
  renderBiasGames();
}

function renderBiasGames() {
  els.biasGamesGrid.innerHTML = "";
  if (!appState.biasGames.length) {
    const message = document.createElement("p");
    message.className = "helper-text";
    message.textContent = "Bias games are not available right now.";
    els.biasGamesGrid.appendChild(message);
    return;
  }

  appState.biasGames.forEach((game) => {
    const card = document.createElement("article");
    card.className = "card bias-card";
    card.innerHTML = `
      <div class="task-card-top">
        <div class="task-meta">
          <h3>${game.title}</h3>
          <p class="task-category">${game.instruction}</p>
          <p class="task-bias">Bias: ${game.bias}</p>
        </div>
      </div>
      <button class="button btn primary-btn" type="button">Play</button>
    `;

    card.querySelector("button").addEventListener("click", () => openBiasGame(game));
    els.biasGamesGrid.appendChild(card);
  });
}

const BIAS_TASK_ID_MAP = {
  bias_1: "bias_1",
  bias_2: "bias_2",
  bias_3: "bias_3",
  bias_4: "bias_4",
  bias_5: "bias_5",
  bias_6: "bias_6",
};

function getBiasTaskId(game) {
  return game.mappedTaskId || BIAS_TASK_ID_MAP[game.id] || game.id;
}

function openBiasGame(game) {
  appState.currentBiasGame = game;
  const biasTaskId = getBiasTaskId(game);
  appState.currentTask = {
    ...game,
    id: biasTaskId,
    instruction: game.instruction || game.prompt || "Write a prompt for this bias game.",
    category: game.category || "Bias Playground",
    bias: game.bias || "Bias Playground",
  };

  els.promptTitle.textContent = game.title;
  els.promptTaskId.textContent = `Bias Task: ${biasTaskId}`;
  els.promptInstruction.textContent = appState.currentTask.instruction;
  els.promptInput.value = "";
  els.charCounter.textContent = "0/200";
  if (els.openBiasPreviewBtn) {
    els.openBiasPreviewBtn.hidden = false;
  }

  showScreen("prompt");
}

function getBiasImpactText(filterType) {
  switch (filterType) {
    case "occlusion":
      return "Missing data bias can make the model overlook important context when part of the input is hidden.";
    case "overlay":
      return "Identity overlay bias makes some attributes feel more important than others, shaping judgment.";
    case "color":
      return "A cultural tint can shift meaning and push outputs toward narrow visual stereotypes.";
    case "blur":
      return "Idealization bias removes texture, creating outputs that feel unrealistic and less nuanced.";
    case "spotlight":
      return "Authority framing biases attention and can make certain ideas seem more valid than others.";
    case "contrast":
      return "Simplification bias smooths away noise and complexity, creating a world that feels too easy.";
    default:
      return "This bias effect highlights how subtle changes can shape what AI decides is important.";
  }
}

function setExplainOverlay(visible) {
  if (!els.biasInfoOverlay) return;
  els.biasInfoOverlay.classList.toggle("active", visible);
  els.biasInfoOverlay.setAttribute("aria-hidden", visible ? "false" : "true");

  if (visible && appState.currentBiasGame) {
    els.biasInfoWhat.textContent = `What happened: the system is applying ${appState.currentBiasGame.title.toLowerCase()}.`;
    els.biasInfoWhy.textContent = `Why it happened: ${appState.currentBiasGame.explanation}`;
    els.biasInfoImpact.textContent = `Real-world impact: ${getBiasImpactText(appState.currentBiasGame.filter_type)}`;
  }
}

function updateBiasVisual() {
  const hasCamera = Boolean(appState.cameraStream && els.biasVideo.srcObject);
  els.biasVideo.style.opacity = "0";
  els.biasVideo.style.position = "absolute";

  if (hasCamera) {
    els.biasFallbackImage.style.opacity = "0";
    els.biasCanvas.style.opacity = "1";
    if (!appState.renderLoopId) {
      startRenderLoop();
    }
    return;
  }

  if (appState.biasModeActive && appState.currentBiasGame) {
    els.biasFallbackImage.style.opacity = "0";
    els.biasCanvas.style.opacity = "1";
    drawStaticBiasFallback(
      appState.currentBiasGame.biased_image_path || appState.currentBiasGame.neutral_image_path || PLACEHOLDER_IMAGE,
      appState.currentBiasGame.filter_type
    );
    return;
  }

  els.biasCanvas.style.opacity = "0";
  els.biasFallbackImage.style.opacity = "1";
  const source = appState.currentBiasGame?.neutral_image_path;
  safeLoadImage(els.biasFallbackImage, source || PLACEHOLDER_IMAGE);
}

function drawStaticBiasFallback(src, filterType) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = els.biasCanvas;
    const ctx = canvas.getContext("2d");
    canvas.width = img.naturalWidth || 640;
    canvas.height = img.naturalHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = getCanvasFilterForType(filterType);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    if (appState.biasModeActive) {
      drawBiasOverlay(ctx, canvas.width, canvas.height, filterType);
    }
  };
  img.onerror = () => {
    els.biasCanvas.style.opacity = "0";
    els.biasFallbackImage.style.opacity = "1";
    safeLoadImage(els.biasFallbackImage, src || PLACEHOLDER_IMAGE);
  };
  img.src = src;
}

async function startCamera() {
  stopCamera(false);
  if (!navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false,
    });

    appState.cameraStream = stream;
    els.biasVideo.srcObject = stream;
    els.biasVideo.style.opacity = "0";
    els.biasVideo.style.position = "absolute";
    els.biasFallbackImage.style.opacity = "0";
    els.biasCanvas.style.opacity = "1";

    await els.biasVideo.play();
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        els.biasVideo.onloadedmetadata = null;
        els.biasVideo.onerror = null;
      };

      const done = () => {
        cleanup();
        resolve();
      };

      els.biasVideo.onloadedmetadata = done;
      els.biasVideo.onerror = (error) => {
        cleanup();
        reject(error);
      };

      if (els.biasVideo.readyState >= 1) {
        done();
      }
    });

    els.biasCanvas.width = els.biasVideo.videoWidth || 640;
    els.biasCanvas.height = els.biasVideo.videoHeight || 480;
    startRenderLoop();
    return true;
  } catch (err) {
    stopCamera(false);
    updateBiasVisual();
    els.biasFeedback.textContent =
      "Camera access is unavailable. Use localhost/HTTPS and allow camera permission to view the bias preview.";
    console.warn("Bias preview camera failed:", err);
    return false;
  }
}

function stopCamera(clearBiasMode = true) {
  if (appState.renderLoopId) {
    cancelAnimationFrame(appState.renderLoopId);
    appState.renderLoopId = null;
  }

  if (appState.cameraStream) {
    appState.cameraStream.getTracks().forEach((track) => track.stop());
    appState.cameraStream = null;
  }

  if (els.biasVideo) {
    els.biasVideo.srcObject = null;
    els.biasVideo.style.opacity = "0";
    els.biasVideo.style.position = "absolute";
  }

  if (clearBiasMode) {
    appState.biasModeActive = false;
  }
}

function startRenderLoop() {
  const canvas = els.biasCanvas;
  const video = els.biasVideo;
  if (!canvas || !video) return;

  const ctx = canvas.getContext("2d");
  let isRendering = false;

  function renderFrame() {
    if (!video.videoWidth || !video.videoHeight) {
      appState.renderLoopId = requestAnimationFrame(renderFrame);
      return;
    }

    if (!isRendering) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      isRendering = true;
    }

    const filter = appState.biasModeActive
      ? getCanvasFilterForType(appState.currentBiasGame?.filter_type)
      : "none";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = filter;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";

    if (appState.biasModeActive) {
      drawBiasOverlay(ctx, canvas.width, canvas.height, appState.currentBiasGame?.filter_type);
    }

    appState.renderLoopId = requestAnimationFrame(renderFrame);
  }

  if (appState.renderLoopId) {
    cancelAnimationFrame(appState.renderLoopId);
  }

  appState.renderLoopId = requestAnimationFrame(renderFrame);
}

function getCanvasFilterForType(type) {
  switch (type) {
    case "occlusion":
      return "contrast(0.92) brightness(0.92)";
    case "overlay":
      return "saturate(0.9) contrast(0.95)";
    case "color":
      return "sepia(0.16) saturate(1.2)";
    case "blur":
      return "blur(6px)";
    case "spotlight":
      return "brightness(0.88) contrast(1.1)";
    case "contrast":
      return "contrast(1.35) saturate(1.15)";
    default:
      return "none";
  }
}

function drawBiasOverlay(ctx, width, height, filterType) {
  ctx.save();

  switch (filterType) {
    case "occlusion":
      ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
      for (let i = 0; i < 5; i += 1) {
        const x = Math.random() * width * 0.5;
        const y = Math.random() * height * 0.8;
        ctx.fillRect(x, y, width * 0.2, height * 0.08);
      }
      break;
    case "overlay":
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 14;
      ctx.strokeRect(12, 12, width - 24, height - 24);
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(0, 0, width, height);
      break;
    case "color":
      ctx.fillStyle = "rgba(240, 160, 80, 0.14)";
      ctx.fillRect(0, 0, width, height);
      break;
    case "spotlight": {
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        width * 0.08,
        width * 0.5,
        height * 0.35,
        width * 0.85
      );
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.7, "rgba(0,0,0,0.35)");
      gradient.addColorStop(1, "rgba(0,0,0,0.78)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      break;
    }
    case "blur":
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(0, 0, width, height);
      break;
    case "contrast":
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += width / 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += height / 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;
    default:
      break;
  }

  ctx.restore();
}

async function toggleBiasMode() {
  const enableBias = !appState.biasModeActive;
  if (enableBias) {
    appState.biasModeActive = true;
    els.toggleBiasBtn.disabled = true;
    els.toggleBiasBtn.textContent = "Bias OFF";
    const started = await startCamera();
    els.toggleBiasBtn.disabled = false;

    if (!started) {
      els.biasFeedback.textContent =
        "Camera access is unavailable. Showing a preview image with the bias effect instead.";
      updateBiasVisual();
    }
    updateBiasFeedback();
    return;
  }

  appState.biasModeActive = false;
  els.toggleBiasBtn.textContent = "Bias ON";
  stopCamera();
  updateBiasVisual();
  updateBiasFeedback();
}

function updateBiasFeedback() {
  if (!appState.currentBiasGame) {
    els.biasFeedback.textContent = "";
    return;
  }

  els.biasFeedback.textContent = appState.biasModeActive
    ? "Bias filter active. Notice how assumptions change the result."
    : "Bias filter inactive. This is the baseline view.";
}

function initializeBiasPlayground() {
  els.openBiasPlaygroundBtn?.addEventListener("click", () => {
    loadBiasGames();
    showScreen("biasGames");
  });

  els.backBiasGamesBtn?.addEventListener("click", () => {
    showScreen("hub");
  });

  els.backBiasPlayBtn?.addEventListener("click", () => {
    stopCamera();
    showScreen("biasGames");
  });

  els.openBiasPreviewBtn?.addEventListener("click", () => {
    if (!appState.currentTask?.category || appState.currentTask.category !== "Bias Playground") {
      return;
    }
    appState.currentBiasGame = appState.currentTask;
    els.biasPlayTitle.textContent = appState.currentTask.title;
    els.biasPlayPrompt.textContent = appState.currentTask.instruction || appState.currentTask.prompt;
    els.biasExplanation.textContent = appState.currentTask.explanation || "Explore the bias overlay and how it changes the image.";
    els.biasFeedback.textContent = "Press Bias ON to start the camera bias preview.";
    els.toggleBiasBtn.textContent = "Bias ON";
    els.biasInfoWhat.textContent = "";
    els.biasInfoWhy.textContent = "";
    els.biasInfoImpact.textContent = "";
    updateBiasVisual();
    showScreen("biasPlay");
    // Ensure overlay UI is visible by default
    appState.showOverlayUI = true;
    const overlayElements = document.querySelectorAll('.overlay-ui');
    overlayElements.forEach(el => el.classList.remove('hidden'));
    els.toggleIcon.textContent = 'Hide UI';
    els.cinematicToggleBtn.title = 'Hide UI Overlay';
  });

  els.toggleBiasBtn?.addEventListener("click", toggleBiasMode);
  els.biasExplainBtn?.addEventListener("click", () => setExplainOverlay(true));
  els.closeBiasInfoBtn?.addEventListener("click", () => setExplainOverlay(false));

  els.cinematicToggleBtn?.addEventListener("click", toggleOverlayUI);

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
      event.preventDefault();
      setExplainOverlay(true);
    }
  });

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      stopCamera();
    }
  });
}

initializeBiasPlayground();
// === BIAS PLAYGROUND ADDITION END ===

function showScreen(name) {
  Object.values(screens).forEach((screen) => {
    if (screen) screen.classList.remove("active");
  });
  if (screens[name]) screens[name].classList.add("active");
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
    const fallbackRes = await fetch("/data/tasks_2.json");
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
  if (els.taskGrid) {
    els.taskGrid.style.display = "none";
  }
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

    if (String(payload.task_id) !== String(appState.currentTask.id)) {
      throw new Error("Task response mismatch");
    }

    const score = Number(payload.score || 0);
    const generatedUrl = payload.generated_image_url || payload.generated_image;

    if (!appState.completedTasks.includes(appState.currentTask.id)) {
      appState.completedTasks.push(appState.currentTask.id);
    }

    appState.scores[appState.currentTask.id] = score;
    updateProgressIndicator();

    const isBiasPlay = appState.currentTask?.category === "Bias Playground";

    els.generatedImage.loading = "lazy";
    els.targetImage.loading = "lazy";
    if (isBiasPlay) {
      els.generatedImage.removeAttribute("src");
      els.generatedImage.style.display = "none";
    } else {
      els.generatedImage.style.display = "block";
      els.generatedImage.src = generatedUrl;
    }

    if (isBiasPlay) {
      const targetSources = appState.currentTask.target_image_candidates || [appState.currentTask.target_image];
      let targetSourceIndex = 0;

      els.targetImage.onerror = () => {
        targetSourceIndex += 1;
        if (targetSourceIndex < targetSources.length) {
          els.targetImage.src = targetSources[targetSourceIndex];
          return;
        }

        els.targetImage.removeAttribute("src");
        els.targetImage.style.display = "none";
      };

      els.targetImage.onload = () => {
        els.targetImage.style.display = "block";
      };

      els.targetImage.src = targetSources[targetSourceIndex];
    } else {
      els.targetImage.onerror = null;
      els.targetImage.onload = null;
      els.targetImage.style.display = "block";
      els.targetImage.src = payload.target_image || generatedUrl;
    }

    if (isBiasPlay) {
      els.resultTaskId.textContent = `Bias Mode Result — ${payload.task_title || appState.currentTask.title}`;
      els.resultScore.classList.add("score-bias-mode");
    } else {
      els.resultTaskId.textContent = `Task ID: ${payload.task_id} - ${payload.task_title || appState.currentTask.title}`;
      els.resultScore.classList.remove("score-bias-mode");
    }

    if (isBiasPlay) {
      els.resultScore.style.display = "none";
      els.scoreLine.style.display = "none";
    } else {
      els.resultScore.style.display = "block";
      els.scoreLine.style.display = "block";
      els.resultScore.textContent = `${score}`;
      applyScoreColor(score);
      els.scoreLine.textContent = `Similarity Score: ${score}`;
    }
    if (isBiasPlay) {
      const data = biasExplanationData[appState.currentTask.filterType] || {
        title: appState.currentTask.bias || "Bias Pattern",
        description: "",
      };

      els.biasLine.textContent = `Bias Category: ${data.title}`;
      els.explanationLine.textContent = data.description;
    } else {
      els.biasLine.textContent = `Bias Category: ${payload.bias || appState.currentTask.bias || "Bias Pattern"}`;
      els.explanationLine.textContent = payload.explanation || "This output reflects embedded data bias patterns.";
    }
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

function pauseAllVideos() {
  [els.introVideo, els.instructionVideo].forEach((video) => {
    if (!video) return;
    video.pause();
  });
}

async function playVideo(videoEl) {
  if (!videoEl) return;
  try {
    videoEl.currentTime = 0;
    await videoEl.play();
  } catch (err) {
    console.warn("Video play blocked:", err);
  }
}

async function enterBiasChamber() {
  pauseAllVideos();
  await startSession();
  loadBiasGames();
  showScreen("biasGames");
}

function resetApp() {
  if (currentGenerateController) currentGenerateController.abort();
  pauseAllVideos();

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
  document.querySelectorAll(".lang-btn").forEach((btn) => btn.classList.remove("is-selected"));
  showScreen("language");
}

els.startBtn.addEventListener("click", async () => {
  const name = els.username.value.trim();
  if (!name) {
    alert("Username must not be empty.");
    return;
  }

  appState.userName = name;
  showScreen("introVideo");
  await playVideo(els.introVideo);
});

els.skipIntroBtn.addEventListener("click", () => {
  pauseAllVideos();
  showScreen("instructionVideo");
  playVideo(els.instructionVideo);
});

els.replayIntroBtn.addEventListener("click", async () => {
  await playVideo(els.introVideo);
});

els.continueFromIntroBtn.addEventListener("click", () => {
  pauseAllVideos();
  showScreen("instructionVideo");
  playVideo(els.instructionVideo);
});

els.introVideo.addEventListener("ended", () => {
  showScreen("instructionVideo");
  playVideo(els.instructionVideo);
});

els.playInstructionBtn.addEventListener("click", async () => {
  showScreen("instructionVideo");
  await playVideo(els.instructionVideo);
});

els.skipToSetupBtn.addEventListener("click", async () => {
  await enterBiasChamber();
});

els.backInstructionChoiceBtn.addEventListener("click", () => {
  pauseAllVideos();
  showScreen("introVideo");
});

els.replayInstructionBtn.addEventListener("click", async () => {
  await playVideo(els.instructionVideo);
});

els.continueToLanguageBtn.addEventListener("click", async () => {
  await enterBiasChamber();
});

els.instructionVideo.addEventListener("ended", async () => {
  await enterBiasChamber();
});

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    document.querySelectorAll(".lang-btn").forEach((item) => item.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    appState.language = btn.dataset.lang;
    applyTranslations();
    await delay(260);
    showScreen("start");
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

els.backLanguage.addEventListener("click", () => showScreen("language"));
els.backHub.addEventListener("click", () => showScreen("biasGames"));
els.backPrompt.addEventListener("click", () => showScreen("hub"));
els.backResult.addEventListener("click", () => showScreen("hub"));
els.backFinal.addEventListener("click", () => showScreen("hub"));
els.backLeaderboard.addEventListener("click", () => showScreen("final"));

function initBackgroundBlobs() {
  const cursorGlow = document.getElementById("cursor-glow");
  const mainBlob = document.querySelector(".blob-main");
  const floatingNodes = Array.from(document.querySelectorAll(".blob-floating"));

  if (!cursorGlow || !mainBlob || !floatingNodes.length) return;

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
loadBiasExplanations();
updateProgressIndicator();
initBackgroundBlobs();

// === BIAS LANDSCAPE SYSTEM START ===
const BIAS_GAMES = [
  {
    id: "bias_right",
    title: "Right-Hand Bias",
    instruction: "Write a prompt without assuming handedness.",
    bias: "Default Assumption Bias",
    mappedTaskId: 1,
    filterType: "right_hand",
    target_image: "/images/targets/task_01.png",
    explanation: "Bias appears as missing information: the system loses parts of the scene instead of seeing the full input.",
  },
  {
    id: "bias_gender",
    title: "Gender Bias",
    instruction: "Write a prompt without assuming gender roles.",
    bias: "Misrepresentation Bias",
    mappedTaskId: 8,
    filterType: "gender",
    target_image: "/images/targets/task_08.png",
    explanation: "Bias appears as projection: the system stamps an assumption onto the scene before judging it.",
  },
  {
    id: "bias_language",
    title: "Language Bias",
    instruction: "Write a prompt without assuming language or culture.",
    bias: "Cultural Misalignment Bias",
    mappedTaskId: 4,
    filterType: "language",
    target_image: "/images/targets/task_04.png",
    explanation: "Bias appears as misalignment: duplicated signals make the input harder to read cleanly.",
  },
  {
    id: "bias_architecture",
    title: "Architecture Bias",
    instruction: "Write a prompt that preserves local architectural detail.",
    bias: "Detail Loss Bias",
    mappedTaskId: 5,
    filterType: "architecture",
    target_image: "/images/targets/task_05.png",
    explanation: "Bias appears as lost texture: repeated copying collapses detail into a flatter image.",
  },
  {
    id: "bias_authority",
    title: "Authority Bias",
    instruction: "Write a prompt that does not over-focus on authority.",
    bias: "Focus Collapse Bias",
    mappedTaskId: 7,
    filterType: "authority",
    target_image: "/images/targets/task_07.png",
    explanation: "Bias appears as narrowed attention: most information is suppressed around one over-important center.",
  },
  {
    id: "bias_friction",
    title: "Frictionless World Bias",
    instruction: "Write a prompt that keeps complexity, friction, and context.",
    bias: "Flattening Bias",
    mappedTaskId: 10,
    filterType: "friction",
    target_image: "/images/targets/task_10.png",
    explanation: "Bias appears as flattening: color and nuance are stripped away until the scene feels simplified.",
  },
];

let biasModeActive = false;
let currentFilter = null;
let isRendering = false;
let biasCameraStream = null;
let biasAnimationFrame = null;

const biasLandscapeShowScreen = showScreen;
showScreen = function showLandscapeScreen(name) {
  const previousName = Object.entries(screens).find(([, screen]) => screen?.classList.contains("active"))?.[0] || "";
  document.body.classList.add("is-cinematic-transitioning");
  document.body.classList.toggle("is-entering-bias-chamber", name === "biasGames");

  biasLandscapeShowScreen(name);
  document.body.classList.toggle("is-prompt-screen", name === "prompt");
  document.body.classList.toggle("is-bias-chamber-screen", name === "biasGames");

  window.dispatchEvent(new CustomEvent("cinematic-screen-change", {
    detail: { from: previousName, to: name },
  }));

  window.clearTimeout(window.__cinematicTransitionTimer);
  window.__cinematicTransitionTimer = window.setTimeout(() => {
    document.body.classList.remove("is-cinematic-transitioning", "is-entering-bias-chamber");
  }, name === "biasGames" ? 4600 : 2600);

  if (name === "prompt") {
    updatePromptTargetImage();
  }
};

function updatePromptTargetImage() {
  const targetImg = document.getElementById("prompt-target-image");
  if (!targetImg) return;

  const promptScreen = document.getElementById("screen-prompt");
  const sources = appState.currentTask?.target_image_candidates || [appState.currentTask?.target_image || ""];
  let sourceIndex = 0;

  targetImg.onerror = () => {
    sourceIndex += 1;
    if (sourceIndex < sources.length) {
      if (promptScreen) {
        promptScreen.style.setProperty("--prompt-bg-image", `url("${sources[sourceIndex]}")`);
      }
      targetImg.src = sources[sourceIndex];
      return;
    }

    targetImg.removeAttribute("src");
    targetImg.style.display = "none";
    if (promptScreen) {
      promptScreen.style.removeProperty("--prompt-bg-image");
    }
  };

  targetImg.onload = () => {
    targetImg.style.display = "block";
    if (promptScreen && targetImg.currentSrc) {
      promptScreen.style.setProperty("--prompt-bg-image", `url("${targetImg.currentSrc}")`);
    }
  };

  if (promptScreen && sources[sourceIndex]) {
    promptScreen.style.setProperty("--prompt-bg-image", `url("${sources[sourceIndex]}")`);
  }
  targetImg.src = sources[sourceIndex] || "";
}

// === BIAS TARGET IMAGE RESOLVER START ===
function getBiasTargetImage(game, index) {
  const fileName = `bias_${index + 1}.png`;
  return `/images/new_test_target/${fileName}`;
}

function getBiasTargetImageCandidates(game, index) {
  const baseName = `bias_${index + 1}`;
  return [
    `/images/new_test_target/${baseName}.png`,
    `/images/new_test_target/${baseName}.jpeg`,
    `/images/new_test_target/${baseName}.jpg`,
    `/images/new_test_target/${baseName}.AVIF`,
    `/images/new_test_target/${baseName}.avif`,
    `/images/new_test_target/${baseName}.webp`,
  ];
}
// === BIAS TARGET IMAGE RESOLVER END ===

// === BIAS CAPTION RESOLVER START ===
let biasCaptionCache = null;

async function getBiasCaptions() {
  if (biasCaptionCache) return biasCaptionCache;

  try {
    const res = await fetch("/backend/captions.md");
    const text = await res.text();
    biasCaptionCache = {};

    text.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^(bias_\d+)\s*=\s*(.*)$/);
      if (!match) return;

      biasCaptionCache[match[1]] = match[2].trim();
    });
  } catch {
    biasCaptionCache = {};
  }

  return biasCaptionCache;
}

async function getBiasCaption(game, index) {
  const captions = await getBiasCaptions();
  return captions[`bias_${index + 1}`] || "Try to recreate the target image.";
}
// === BIAS CAPTION RESOLVER END ===

function loadBiasGames() {
  appState.biasGames = BIAS_GAMES.slice();
  renderBiasGames();
}

function renderBiasGames() {
  if (!els.biasGamesGrid) return;

  els.biasGamesGrid.innerHTML = "";
  BIAS_GAMES.forEach((game, index) => {
    const card = document.createElement("article");
    card.className = "card bias-card";
    card.style.setProperty("--card-rotate", `${(index - 1) * 12}deg`);
    card.style.setProperty("--card-depth", index === 1 ? "52px" : "-34px");
    card.style.setProperty("--card-offset", `${(index - 1) * -10}px`);
    card.style.setProperty("--card-scale", index === 1 ? "1.04" : "0.96");
    card.innerHTML = `
      <div class="task-card-top">
        <div class="task-meta">
          <h3>Challenge ${index + 1}</h3>
          <p class="task-category">Generate the target image.</p>
        </div>
      </div>
      <button class="button btn primary-btn">Play</button>
    `;

    card.querySelector("button").addEventListener("click", () => openBiasGame(game, index));
    els.biasGamesGrid.appendChild(card);
  });
}

async function openBiasGame(game, index) {
  const targetImagePath = getBiasTargetImage(game, index);
  const promptCaption = await getBiasCaption(game, index);

  appState.currentBiasGame = game;
  currentFilter = game.filterType;
  appState.currentTask = {
    ...game,
    id: game.mappedTaskId,
    category: "Bias Playground",
    target_image: targetImagePath,
    target_image_candidates: getBiasTargetImageCandidates(game, index),
  };

  if (appState.currentTask.category === "Bias Playground") {
    els.promptTitle.textContent = "Bias Test";
    els.promptTaskId.textContent = "";
    els.promptInstruction.textContent = promptCaption;
  } else {
    els.promptTitle.textContent = game.title;
    els.promptTaskId.textContent = `Task ID: ${game.mappedTaskId}`;
    els.promptInstruction.textContent = game.instruction;
  }
  els.promptInput.value = "";
  els.charCounter.textContent = "0/200";
  if (els.openBiasPreviewBtn) {
    els.openBiasPreviewBtn.hidden = false;
  }

  updatePromptTargetImage();
  showScreen("prompt");
}

async function startCamera() {
  stopCamera(false);

  const video = els.biasVideo;
  const canvas = els.biasCanvas;
  if (!video || !canvas || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    biasCameraStream = stream;
    appState.cameraStream = stream;
    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    video.style.opacity = 0;
    canvas.style.opacity = 1;
    if (els.biasFallbackImage) {
      els.biasFallbackImage.style.opacity = 0;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    await video.play();
    startRenderLoop();
    return true;
  } catch (err) {
    stopCamera(false);
    if (els.biasFeedback) {
      els.biasFeedback.textContent = "Camera access is unavailable. Allow camera permission to view the bias disturbance.";
    }
    console.warn("Bias camera failed:", err);
    return false;
  }
}

function stopCamera(resetBiasMode = true) {
  isRendering = false;

  if (biasAnimationFrame) {
    cancelAnimationFrame(biasAnimationFrame);
    biasAnimationFrame = null;
  }

  if (biasCameraStream) {
    biasCameraStream.getTracks().forEach((track) => track.stop());
    biasCameraStream = null;
  }

  if (appState.cameraStream) {
    appState.cameraStream.getTracks().forEach((track) => track.stop());
    appState.cameraStream = null;
  }

  if (els.biasVideo) {
    els.biasVideo.srcObject = null;
    els.biasVideo.style.opacity = 0;
  }

  if (els.biasCanvas && resetBiasMode) {
    els.biasCanvas.style.opacity = 0;
  }

  if (els.biasFallbackImage && resetBiasMode) {
    els.biasFallbackImage.style.opacity = 1;
  }

  if (resetBiasMode) {
    biasModeActive = false;
    appState.biasModeActive = false;
  }
}

function startRenderLoop() {
  if (isRendering) return;

  const video = els.biasVideo;
  const canvas = els.biasCanvas;
  if (!video || !canvas) return;

  const ctx = canvas.getContext("2d");
  isRendering = true;

  function render() {
    if (!isRendering) return;

    if (video.videoWidth && video.videoHeight) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (biasModeActive) {
        applyBiasFilter(ctx, canvas.width, canvas.height, currentFilter);
      }
    }

    biasAnimationFrame = requestAnimationFrame(render);
  }

  render();
}

function toggleBias() {
  biasModeActive = !biasModeActive;
  appState.biasModeActive = biasModeActive;

  if (biasModeActive) {
    if (els.toggleBiasBtn) els.toggleBiasBtn.textContent = "Bias OFF";
    startCamera();
  } else {
    if (els.toggleBiasBtn) els.toggleBiasBtn.textContent = "Bias ON";
    stopCamera();
  }
}

function toggleBiasMode() {
  toggleBias();
}

function toggleOverlayUI() {
  appState.showOverlayUI = !appState.showOverlayUI;
  const overlayElements = document.querySelectorAll('.overlay-ui');
  overlayElements.forEach(el => {
    if (appState.showOverlayUI) {
      el.classList.remove('hidden');
      els.toggleIcon.textContent = 'Hide UI';
      els.cinematicToggleBtn.title = 'Hide UI Overlay';
    } else {
      el.classList.add('hidden');
      els.toggleIcon.textContent = 'Show UI';
      els.cinematicToggleBtn.title = 'Show UI Overlay';
    }
  });
}

function rightHandBias(ctx, w, h) {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(Math.random() * w * 0.5, Math.random() * h, 60, 40);
  }
}

function genderBias(ctx, w, h) {
  ctx.drawImage(ctx.canvas, 0, 0, w, h, 20, 10, w * 0.95, h * 0.95);
  ctx.fillStyle = "red";
  ctx.font = "32px Inter, sans-serif";
  ctx.fillText("ASSUMED", 20, 40);
}

function languageBias(ctx, w, h) {
  ctx.globalAlpha = 0.6;
  ctx.drawImage(ctx.canvas, 15, 0);
  ctx.drawImage(ctx.canvas, -15, 0);
  ctx.globalAlpha = 1;
}

function architectureBias(ctx, w, h) {
  for (let i = 0; i < 3; i += 1) {
    ctx.drawImage(ctx.canvas, 0, 0, w, h);
  }
}

function authorityBias(ctx, w, h) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
}

function frictionlessBias(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
    d[i] = avg;
    d[i + 1] = avg;
    d[i + 2] = avg;
  }

  ctx.putImageData(img, 0, 0);
}

function applyBiasFilter(ctx, w, h, type) {
  switch (type) {
    case "right_hand":
      rightHandBias(ctx, w, h);
      break;
    case "gender":
      genderBias(ctx, w, h);
      break;
    case "language":
      languageBias(ctx, w, h);
      break;
    case "architecture":
      architectureBias(ctx, w, h);
      break;
    case "authority":
      authorityBias(ctx, w, h);
      break;
    case "friction":
      frictionlessBias(ctx, w, h);
      break;
    default:
      break;
  }

  if (Math.random() > 0.7) {
    ctx.drawImage(
      ctx.canvas,
      0,
      0,
      w,
      h,
      Math.random() * 10,
      Math.random() * 10,
      w,
      h
    );
  }
}

els.openBiasPreviewBtn?.addEventListener("click", () => {
  if (appState.currentTask?.category !== "Bias Playground") return;

  appState.currentBiasGame = appState.currentTask;
  currentFilter = appState.currentTask.filterType;
  if (els.biasPlayTitle) els.biasPlayTitle.textContent = appState.currentTask.title;
  if (els.biasPlayPrompt) els.biasPlayPrompt.textContent = appState.currentTask.instruction;
  if (els.biasExplanation) els.biasExplanation.textContent = appState.currentTask.explanation;
  if (els.biasFeedback) els.biasFeedback.textContent = "Press Bias ON to start the camera disturbance.";
  if (els.toggleBiasBtn) els.toggleBiasBtn.textContent = "Bias ON";

  showScreen("biasPlay");
});
// === BIAS LANDSCAPE SYSTEM END ===

// === 3D CINEMATIC BACKGROUND SYSTEM ===
let scene, camera, renderer, globe, particles, mouse, targetRotation;

function init3DScene() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040d);
  scene.fog = new THREE.Fog(0x02040d, 8, 18);

  // Camera - positioned to see the large globe
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 8;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '-1';
  renderer.domElement.style.pointerEvents = 'none';
  document.body.style.backgroundColor = '#00050e';
  document.body.style.backgroundImage = 'radial-gradient(circle at 40% 30%, rgba(59,130,246,0.18), transparent 16%), radial-gradient(circle at 60% 55%, rgba(99,102,241,0.12), transparent 12%), radial-gradient(circle at 50% 70%, rgba(15,23,42,0.28), transparent 22%), radial-gradient(circle at 15% 25%, rgba(0, 0, 0, 0.32), transparent 18%)';
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundSize = 'cover';
  document.body.style.overflow = 'hidden';
  document.body.appendChild(renderer.domElement);

  // MAIN GLOBE - Large, visible, dominant
  const globeGeometry = new THREE.SphereGeometry(5, 128, 128);
  const globeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      mouse: { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform float time;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        vec3 pos = position;
        pos += normal * sin(time + position.x * 5.0 + position.y * 4.0) * 0.03;
        pos += normal * cos(time * 0.4 + position.z * 3.5) * 0.02;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform float time;
      void main() {
            vec3 base = vec3(0.04, 0.12, 0.35);
        float fresnel = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 2.2);
        vec3 rim = vec3(0.4, 0.7, 1.0) * fresnel * 1.2;

        float waves = sin(vPosition.x * 4.5 + time * 0.8) * cos(vPosition.y * 3.8 + time * 0.75) * 0.18;
        float rings = abs(sin(vUv.x * 60.0) * cos(vUv.y * 35.0));
        float ringMask = smoothstep(0.75, 0.78, rings) * 0.42;
        vec3 color = base + rim + vec3(0.02, 0.18, 0.44) * waves + vec3(0.18, 0.4, 0.95) * ringMask;
        float alpha = 0.98;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  globe = new THREE.Mesh(globeGeometry, globeMaterial);
  globe.scale.set(2.0, 2.0, 2.0);
  scene.add(globe);

  // Inner core glow
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x0b1220,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(4.6, 64, 64), coreMaterial);
  scene.add(core);

  // NETWORK NODES - surface points and holes
  const nodeGeometry = new THREE.SphereGeometry(0.02, 10, 10);
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x7C3AED,
    transparent: true,
    opacity: 0.92
  });
  const ringGeometry = new THREE.RingGeometry(0.02, 0.045, 24);
  const holeMaterial = new THREE.MeshBasicMaterial({
    color: 0xC084FC,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const holeFillMaterial = new THREE.MeshBasicMaterial({
    color: 0x8B5CF6,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const nodes = [];
  const holeMeshes = [];
  const holeFills = [];
  const nodeCount = 120;

  for (let i = 0; i < nodeCount; i++) {
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    const radius = 5.08;

    const position = new THREE.Vector3(
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.cos(theta),
      radius * Math.sin(theta) * Math.sin(phi)
    );

    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    node.position.copy(position);
    node.userData.phase = Math.random() * Math.PI * 2;
    node.userData.speed = 0.8 + Math.random() * 0.6;
    globe.add(node);
    nodes.push(node);

    if (i % 2 === 0) {
      const hole = new THREE.Mesh(ringGeometry, holeMaterial.clone());
      hole.position.copy(position);
      hole.lookAt(position.clone().multiplyScalar(2));
      hole.userData.phase = Math.random() * Math.PI * 2;
      globe.add(hole);
      holeMeshes.push(hole);

      const fill = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), holeFillMaterial.clone());
      fill.position.copy(position).add(position.clone().normalize().multiplyScalar(0.01));
      fill.lookAt(position.clone().multiplyScalar(2));
      fill.userData.phase = Math.random() * Math.PI * 2;
      globe.add(fill);
      holeFills.push(fill);
    }
  }

  // STRUCTURED CONNECTIONS - curved paths along the globe
  const connectionMaterial = new THREE.MeshBasicMaterial({
    color: 0x60A5FA,
    transparent: true,
    opacity: 0.22
  });
  const connections = [];
  const connectionCount = Math.min(20, nodes.length);

  for (let i = 0; i < connectionCount; i++) {
    const startNode = nodes[i];
    const endNode = nodes[(i * 7 + 13) % nodes.length];
    if (startNode === endNode) continue;

    const start = startNode.position.clone();
    const end = endNode.position.clone();
    const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(5.4 + start.distanceTo(end) * 0.08);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const arcGeometry = new THREE.TubeGeometry(curve, 28, 0.012, 8, false);
    const arc = new THREE.Mesh(arcGeometry, connectionMaterial.clone());
    scene.add(arc);
    connections.push({ arc, startNode, endNode, phase: Math.random() * Math.PI * 2 });
  }

  // ATMOSPHERIC PARTICLES - depth around globe
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 280;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleDepths = [];

  for (let i = 0; i < particleCount; i++) {
    const shellRadius = 6.2 + Math.random() * 4.0;
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI;
    particlePositions[i * 3] = shellRadius * Math.sin(theta) * Math.cos(phi);
    particlePositions[i * 3 + 1] = shellRadius * Math.cos(theta);
    particlePositions[i * 3 + 2] = shellRadius * Math.sin(theta) * Math.sin(phi);
    particleDepths.push(shellRadius);
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x7DD3FC,
    size: 0.016,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true
  });
  particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Mouse interaction - slow cinematic influence
  mouse = new THREE.Vector2();
  targetRotation = new THREE.Vector2();

  document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    targetRotation.x = mouse.x * 0.28;
    targetRotation.y = mouse.y * 0.28;
  });

  function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001;

    const targetPosX = mouse.x * 0.8;
    const targetPosY = mouse.y * 0.5;
    globe.position.x = THREE.MathUtils.lerp(globe.position.x, targetPosX, 0.06);
    globe.position.y = THREE.MathUtils.lerp(globe.position.y, targetPosY, 0.06);
    core.position.copy(globe.position);

    globe.rotation.y += 0.0018;
    globe.rotation.x = THREE.MathUtils.lerp(globe.rotation.x, targetRotation.y, 0.04);
    globe.rotation.y += THREE.MathUtils.lerp(0, targetRotation.x, 0.04);

    globe.material.uniforms.time.value = time;
    globe.material.uniforms.mouse.value = mouse;
    core.rotation.copy(globe.rotation);

    nodes.forEach((node) => {
      const pulse = Math.sin(time * node.userData.speed + node.userData.phase) * 0.5 + 0.5;
      const intensity = 0.5 + pulse * 0.5;
      node.material.opacity = intensity;
      node.scale.setScalar(1 + pulse * 0.35);
    });

    holeMeshes.forEach((hole, index) => {
      hole.material.opacity = 0.35 + Math.sin(time * 1.2 + hole.userData.phase) * 0.14;
      hole.scale.setScalar(0.95 + Math.sin(time * 0.6 + hole.userData.phase) * 0.04);
    });

    holeFills.forEach((fill) => {
      fill.material.opacity = 0.35 + Math.sin(time * 1.1 + fill.userData.phase) * 0.14;
      fill.scale.setScalar(1 + Math.sin(time * 0.5 + fill.userData.phase) * 0.04);
    });

    connections.forEach((connection, idx) => {
      const flow = 0.2 + Math.sin(time * 1.4 + connection.phase + idx * 0.24) * 0.12;
      connection.arc.material.opacity = 0.18 + flow * 0.22;
      connection.arc.rotation.y += 0.00045;
    });

    particles.rotation.y += 0.0006;
    particles.rotation.x += 0.0002;
    const positionsArray = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      positionsArray[i * 3 + 1] += Math.sin(time * 0.5 + i * 0.12) * 0.0008;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function initBiasGamesParallax() {
  const chamberScreen = screens.biasGames;
  if (!chamberScreen) return;

  document.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    chamberScreen.style.setProperty("--bias-parallax-x", `${x * 18}px`);
    chamberScreen.style.setProperty("--bias-parallax-y", `${y * 14}px`);
    chamberScreen.style.setProperty("--bias-tilt-x", `${y * -4}deg`);
    chamberScreen.style.setProperty("--bias-tilt-y", `${x * 6}deg`);
  });
}

// Initialize 3D scene when DOM is ready
document.addEventListener('DOMContentLoaded', init3DScene);
document.addEventListener("DOMContentLoaded", initBiasGamesParallax);
// === 3D CINEMATIC BACKGROUND SYSTEM END ===
