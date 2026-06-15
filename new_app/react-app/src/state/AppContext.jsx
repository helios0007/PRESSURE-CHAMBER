import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  fetchTranslations,
  fetchBiasExplanations,
  startSessionRequest,
  generateRequest,
  postLeaderboardScore,
  fetchLeaderboard,
} from "../lib/api.js";
import {
  BIAS_GAMES,
  BIAS_PREVIEW_IMAGES,
  getBiasTargetImage,
  getBiasTargetImageCandidates,
  getBiasCaption,
} from "../lib/biasGames.js";
// Bundled so the UI renders translated copy on first paint (the original served
// hardcoded English in index.html before applyTranslations ran). The init effect
// still re-fetches /data/translations.json to pick up any backend changes.
import bundledTranslations from "../data/translations.json";

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SCREENSAVER_DELAY = 30000;

export function AppProvider({ children }) {
  // --- Rendering state ---
  const [screen, setScreen] = useState("introVideo");
  const [translations, setTranslations] = useState(bundledTranslations);
  const [language, setLanguageState] = useState("en");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [biasGames, setBiasGames] = useState([]);
  const [promptMeta, setPromptMeta] = useState({ title: "", taskId: "", instruction: "", targetCandidates: [] });
  const [promptInput, setPromptInput] = useState("");
  const [result, setResult] = useState(null);
  const [finalData, setFinalData] = useState({ user: "", rows: [], total: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [challengePreview, setChallengePreview] = useState({ visible: false, src: "", fading: false });
  const [screensaverActive, setScreensaverActive] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedLang, setSelectedLang] = useState(null);

  // --- Mutable game state (read inside async actions) ---
  const appState = useRef({
    userName: "",
    tasks: [],
    completedTasks: [],
    scores: {},
    currentTask: null,
    currentBiasGame: null,
    total: 0,
    biasModeActive: false,
  });

  const biasExplanationData = useRef({});
  const introVideoRef = useRef(null);
  const instructionVideoRef = useRef(null);
  const generateController = useRef(null);
  const biasGameTransitionTimer = useRef(null);
  const cinematicTimer = useRef(null);

  const screenRef = useRef("introVideo");
  const languageRef = useRef("en");
  const translationsRef = useRef(bundledTranslations);
  const promptInputRef = useRef("");
  const loadingRef = useRef(false);

  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { translationsRef.current = translations; }, [translations]);
  useEffect(() => { promptInputRef.current = promptInput; }, [promptInput]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // --- i18n ---
  const t = useCallback(
    (key) => translations?.[language]?.[key] || key,
    [translations, language]
  );
  const tNow = useCallback(
    (key) => translationsRef.current?.[languageRef.current]?.[key] || key,
    []
  );

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    languageRef.current = lang;
    try { localStorage.setItem("pc_language", lang); } catch { /* ignore */ }
  }, []);

  // --- Navigation with cinematic transitions (ported from showLandscapeScreen) ---
  const showScreen = useCallback((name) => {
    const previousName = screenRef.current || "";
    document.body.classList.add("is-cinematic-transitioning");
    document.body.classList.toggle("is-entering-bias-chamber", name === "biasGames");

    setScreen(name);
    screenRef.current = name;

    document.body.classList.toggle("is-prompt-screen", name === "prompt");
    document.body.classList.toggle("is-bias-chamber-screen", name === "biasGames");

    window.dispatchEvent(new CustomEvent("cinematic-screen-change", {
      detail: { from: previousName, to: name },
    }));

    clearTimeout(cinematicTimer.current);
    cinematicTimer.current = setTimeout(() => {
      document.body.classList.remove("is-cinematic-transitioning", "is-entering-bias-chamber");
    }, name === "biasGames" ? 4600 : 2600);
  }, []);

  const updateProgressIndicator = useCallback(() => {
    setCompletedCount(appState.current.completedTasks.length);
  }, []);

  // --- Video helpers ---
  const pauseAllVideos = useCallback(() => {
    [introVideoRef.current, instructionVideoRef.current].forEach((video) => {
      if (video) video.pause();
    });
  }, []);

  const playVideo = useCallback(async (videoEl) => {
    if (!videoEl) return;
    try {
      videoEl.currentTime = 0;
      await videoEl.play();
    } catch (err) {
      console.warn("Video play blocked:", err);
    }
  }, []);

  // --- Session ---
  const startSession = useCallback(async () => {
    const tasks = await startSessionRequest();
    appState.current.tasks = tasks.slice(0, 3);
    appState.current.completedTasks = [];
    appState.current.scores = {};
    appState.current.currentTask = null;
    updateProgressIndicator();
  }, [updateProgressIndicator]);

  const loadBiasGames = useCallback(() => {
    appState.current.biasGames = BIAS_GAMES.slice();
    setBiasGames(BIAS_GAMES.slice());
  }, []);

  const enterBiasChamber = useCallback(async () => {
    pauseAllVideos();
    await startSession();
    loadBiasGames();
    showScreen("biasGames");
  }, [pauseAllVideos, startSession, loadBiasGames, showScreen]);

  // --- Bias game open + cinematic preview ---
  const openBiasGame = useCallback(async (game, index) => {
    const targetImagePath = getBiasTargetImage(game, index);
    const promptCaption = await getBiasCaption(game, index);

    const targetCandidates = getBiasTargetImageCandidates(game, index);
    appState.current.currentBiasGame = game;
    appState.current.currentTask = {
      ...game,
      id: game.mappedTaskId,
      category: "Bias Playground",
      target_image: targetImagePath,
      target_image_candidates: targetCandidates,
    };

    // currentTask.category is always "Bias Playground" in the landscape system.
    setPromptMeta({ title: tNow("biasTestTitle"), taskId: "", instruction: promptCaption, targetCandidates });
    setPromptInput("");

    setChallengePreview({ visible: true, src: BIAS_PREVIEW_IMAGES[index], fading: false });

    clearTimeout(biasGameTransitionTimer.current);
    biasGameTransitionTimer.current = setTimeout(() => {
      setChallengePreview((prev) => ({ ...prev, fading: true }));
      showScreen("prompt");
      setTimeout(() => setChallengePreview({ visible: false, src: "", fading: false }), 800);
    }, 4000);
  }, [tNow, showScreen]);

  // --- Generate / submit prompt ---
  const applyScoreColor = (score) => {
    if (score < 40) return "score-low";
    if (score < 70) return "score-mid";
    return "score-high";
  };

  const submitPrompt = useCallback(async () => {
    const task = appState.current.currentTask;
    if (!task) {
      showScreen("hub");
      return;
    }

    const prompt = promptInputRef.current.trim();
    if (!prompt) {
      alert(tNow("alertEmptyPrompt"));
      return;
    }

    setLoading(true);
    generateController.current = new AbortController();

    try {
      const [payload] = await Promise.all([
        generateRequest({ prompt, taskId: task.id, signal: generateController.current.signal }),
        delay(2000),
      ]);

      if (String(payload.task_id) !== String(task.id)) {
        throw new Error("Task response mismatch");
      }

      const score = Number(payload.score || 0);
      const generatedUrl = payload.generated_image_url || payload.generated_image;

      if (!appState.current.completedTasks.includes(task.id)) {
        appState.current.completedTasks.push(task.id);
      }
      appState.current.scores[task.id] = score;
      updateProgressIndicator();

      const isBiasPlay = task.category === "Bias Playground";

      const resultObj = {
        isBiasPlay,
        generatedSrc: isBiasPlay ? null : generatedUrl,
        promptLine: `${tNow("promptUsed")}: ${payload.user_prompt || prompt}`,
      };

      if (isBiasPlay) {
        resultObj.targetCandidates = task.target_image_candidates || [task.target_image];
        resultObj.targetSrc = null;
      } else {
        resultObj.targetCandidates = null;
        resultObj.targetSrc = payload.target_image || generatedUrl;
      }

      if (isBiasPlay) {
        resultObj.taskIdLine = `${tNow("biasModeResult")} — ${payload.task_title || task.title}`;
        resultObj.scoreBiasMode = true;
      } else {
        resultObj.taskIdLine = `${tNow("taskIdLabel")}: ${payload.task_id} - ${payload.task_title || task.title}`;
        resultObj.scoreBiasMode = false;
      }

      if (isBiasPlay) {
        resultObj.showScore = false;
        resultObj.score = null;
        resultObj.scoreColor = null;
        resultObj.scoreLine = null;
      } else {
        resultObj.showScore = true;
        resultObj.score = score;
        resultObj.scoreColor = applyScoreColor(score);
        resultObj.scoreLine = `${tNow("similarityScore")}: ${score}`;
      }

      if (isBiasPlay) {
        const data = biasExplanationData.current[task.filterType] || {
          title: task.bias || "Bias Pattern",
          description: "",
        };
        resultObj.biasLine = `${tNow("biasCategory")}: ${data.title}`;
        resultObj.explanationLine = data.description;
      } else {
        resultObj.biasLine = `${tNow("biasCategory")}: ${payload.bias || task.bias || "Bias Pattern"}`;
        resultObj.explanationLine = payload.explanation || "This output reflects embedded data bias patterns.";
      }

      setResult(resultObj);
      showScreen("result");
    } catch (err) {
      if (err.name !== "AbortError") {
        alert(err.message || tNow("alertGenerationFailed"));
      }
      showScreen("prompt");
    } finally {
      setLoading(false);
      generateController.current = null;
    }
  }, [showScreen, tNow, updateProgressIndicator]);

  // --- Final report ---
  const showFinal = useCallback(() => {
    const rows = appState.current.tasks
      .filter((task) => appState.current.completedTasks.includes(task.id))
      .map((task) => ({ title: task.title, score: appState.current.scores[task.id] || 0 }));

    const total = rows.length
      ? Math.round(rows.reduce((sum, item) => sum + item.score, 0) / rows.length)
      : 0;

    appState.current.total = total;
    setFinalData({ user: appState.current.userName, rows, total });
    showScreen("final");
  }, [showScreen]);

  const loadLeaderboard = useCallback(async () => {
    await postLeaderboardScore(appState.current.userName || "Guest", appState.current.total || 0);
    const board = await fetchLeaderboard();
    setLeaderboard(board);
  }, []);

  // --- "Back to Task Hub" handler from result screen (preserved behavior) ---
  const backToHubFromResult = useCallback(() => {
    if (appState.current.completedTasks.length >= 3) {
      showFinal();
      return;
    }
    clearTimeout(biasGameTransitionTimer.current);
    appState.current.currentBiasGame = null;
    appState.current.currentTask = null;
    showScreen("biasGames");
  }, [showFinal, showScreen]);

  // --- Screensaver ---
  const screensaverActiveRef = useRef(false);
  const screensaverReturnRef = useRef(null);
  const screensaverTimer = useRef(null);

  const scheduleScreensaver = useCallback(() => {
    clearTimeout(screensaverTimer.current);
    screensaverTimer.current = setTimeout(() => activateScreensaver(), SCREENSAVER_DELAY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activateScreensaver = useCallback(() => {
    const current = screenRef.current;
    if (current === "introVideo" || loadingRef.current) {
      scheduleScreensaver();
      return;
    }
    screensaverReturnRef.current = current;
    screensaverActiveRef.current = true;
    setScreensaverActive(true);
    if (introVideoRef.current) {
      introVideoRef.current.currentTime = 0;
      introVideoRef.current.play().catch(() => {});
    }
    showScreen("introVideo");
  }, [scheduleScreensaver, showScreen]);

  const dismissScreensaver = useCallback(() => {
    if (!screensaverActiveRef.current) return false;
    screensaverActiveRef.current = false;
    setScreensaverActive(false);
    if (introVideoRef.current) {
      introVideoRef.current.pause();
      introVideoRef.current.currentTime = 0;
    }
    const ret = screensaverReturnRef.current;
    if (ret) showScreen(ret);
    screensaverReturnRef.current = null;
    scheduleScreensaver();
    return true;
  }, [scheduleScreensaver, showScreen]);

  useEffect(() => {
    const onUserActivity = () => {
      if (screensaverActiveRef.current) {
        dismissScreensaver();
        return;
      }
      scheduleScreensaver();
    };
    const events = ["mousemove", "keydown", "touchmove", "touchstart", "scroll"];
    events.forEach((evt) => document.addEventListener(evt, onUserActivity, { passive: true }));
    scheduleScreensaver();
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, onUserActivity));
      clearTimeout(screensaverTimer.current);
    };
  }, [dismissScreensaver, scheduleScreensaver]);

  // --- Reset ---
  const resetApp = useCallback(() => {
    if (generateController.current) generateController.current.abort();
    pauseAllVideos();
    [introVideoRef.current, instructionVideoRef.current].forEach((v) => {
      if (!v) return;
      v.currentTime = 0;
      v.load();
      v.pause();
    });

    appState.current.userName = "";
    appState.current.tasks = [];
    appState.current.completedTasks = [];
    appState.current.scores = {};
    appState.current.currentTask = null;
    appState.current.currentBiasGame = null;
    appState.current.biasGames = [];
    appState.current.biasModeActive = false;
    appState.current.total = 0;

    setUsername("");
    setLanguageState("en");
    languageRef.current = "en";
    setSelectedLang(null);
    setResult(null);
    setBiasGames([]);
    updateProgressIndicator();
    showScreen("introVideo");
  }, [pauseAllVideos, updateProgressIndicator, showScreen]);

  // --- Start button ---
  const handleStart = useCallback(() => {
    const name = username.trim();
    if (!name) {
      alert(tNow("alertEmptyUsername"));
      return;
    }
    appState.current.userName = name;
    showScreen("instructionChoice");
  }, [username, tNow, showScreen]);

  // --- Init (DOMContentLoaded equivalent) ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tr = await fetchTranslations();
        if (!mounted) return;
        setTranslations(tr);
        translationsRef.current = tr;
        let saved = null;
        try { saved = localStorage.getItem("pc_language"); } catch { /* ignore */ }
        if (saved && tr?.[saved]) {
          setLanguageState(saved);
          languageRef.current = saved;
        }
      } catch { /* ignore */ }
    })();

    fetchBiasExplanations().then((data) => {
      biasExplanationData.current = data;
    });

    // Clean state identical to resetApp, then show the intro screen.
    appState.current = {
      userName: "",
      tasks: [],
      completedTasks: [],
      scores: {},
      currentTask: null,
      currentBiasGame: null,
      total: 0,
      biasModeActive: false,
    };
    updateProgressIndicator();
    showScreen("introVideo");

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    // state
    screen, translations, language, loading, username, biasGames,
    promptMeta, promptInput, result, finalData, leaderboard,
    challengePreview, screensaverActive, completedCount, selectedLang,
    // refs to video elements
    introVideoRef, instructionVideoRef,
    // setters
    setUsername, setPromptInput, setSelectedLang,
    // i18n
    t, setLanguage,
    // navigation + actions
    showScreen, pauseAllVideos, playVideo,
    startSession, enterBiasChamber, loadBiasGames, openBiasGame,
    submitPrompt, showFinal, loadLeaderboard, backToHubFromResult, resetApp,
    handleStart, dismissScreensaver,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
