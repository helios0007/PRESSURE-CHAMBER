// Thin wrappers around the Flask backend endpoints. Paths are identical to the
// original app.js so the same backend serves both frontends unchanged.

export async function fetchTranslations() {
  const res = await fetch("/data/translations.json");
  return res.json();
}

export async function fetchBiasExplanations() {
  try {
    const res = await fetch("/data/bias_explanations.json");
    return await res.json();
  } catch {
    return {};
  }
}

export async function startSessionRequest() {
  try {
    const res = await fetch("/start", { method: "POST" });
    const payload = await res.json();
    return (payload.tasks || []).slice(0, 3);
  } catch {
    const fallbackRes = await fetch("/data/tasks_2.json");
    let tasks = await fallbackRes.json();
    tasks = (tasks || []).sort(() => Math.random() - 0.5).slice(0, 3);
    return tasks;
  }
}

export async function generateRequest({ prompt, taskId, signal }) {
  const res = await fetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, task_id: taskId }),
    signal,
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.error || "Image generation failed.");
  }
  return payload;
}

export async function postLeaderboardScore(name, score) {
  await fetch("/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name || "Guest", score: score || 0 }),
  });
}

export async function fetchLeaderboard() {
  const res = await fetch("/leaderboard");
  const payload = await res.json();
  return payload.leaderboard || [];
}
