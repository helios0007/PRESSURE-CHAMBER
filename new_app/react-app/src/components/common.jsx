import React from "react";
import { useApp } from "../state/AppContext.jsx";

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// Reproduces updateProgressIndicator(): "● ● ○" style dots driven by the
// number of completed tasks.
export function ProgressIndicator() {
  const { completedCount } = useApp();
  const dots = [0, 1, 2].map((idx) => (idx < completedCount ? "●" : "○")).join(" ");
  return <div className="progress-indicator" data-progress>{dots}</div>;
}

export function LoadingOverlay() {
  const { loading, t } = useApp();
  return (
    <div
      id="loading-overlay"
      className={cx("loading-overlay", loading && "active")}
      aria-hidden={loading ? "false" : "true"}
    >
      <div className="panel loading-panel">
        <p>
          <span>{t("thinking")}</span>
          <span className="thinking-dots" aria-hidden="true"></span>
        </p>
        <div className="thinking-bar"><span></span></div>
      </div>
    </div>
  );
}

export function LangSwitcher() {
  const { language, setLanguage } = useApp();
  const langs = ["en", "es", "ca"];
  return (
    <div id="lang-switcher" className="lang-switcher" aria-label="Language switcher" role="group">
      {langs.map((lang) => (
        <button
          key={lang}
          className={cx("lang-pill", language === lang && "active")}
          data-lang={lang}
          type="button"
          onClick={() => setLanguage(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function ChallengePreview() {
  const { challengePreview } = useApp();
  const { visible, src, fading } = challengePreview;
  return (
    <div
      id="challenge-preview"
      aria-hidden="true"
      style={{
        display: visible ? "block" : "none",
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "#000",
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 800ms ease" : undefined,
      }}
    >
      <img id="challenge-preview-img" alt="" src={src || undefined} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}
