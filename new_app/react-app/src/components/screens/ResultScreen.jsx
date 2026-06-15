import React from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx, ProgressIndicator } from "../common.jsx";
import FallbackImage from "../FallbackImage.jsx";

export default function ResultScreen() {
  const { screen, t, showScreen, result, backToHubFromResult } = useApp();
  const active = screen === "result";
  const r = result || {};

  return (
    <section className={cx("screen", active && "active")} id="screen-result">
      <div className="container">
        <div className="panel">
          <div className="panel-top">
            <button id="back-result" className="button btn ghost" type="button" onClick={() => showScreen("hub")}>
              {t("back")}
            </button>
            <ProgressIndicator />
          </div>
          <h2>{t("result")}</h2>
          <p id="result-task-id">{r.taskIdLine || ""}</p>
          <p
            id="result-score"
            className={cx("score", r.scoreColor || "score-mid", r.scoreBiasMode && "score-bias-mode")}
            style={{ display: r.showScore ? "block" : "none" }}
          >
            {r.score != null ? `${r.score}` : "0"}
          </p>
          <div className="result-split">
            <div className="result-left">
              <h3>{t("targetLabel")}</h3>
              {r.isBiasPlay ? (
                <FallbackImage id="target-image" alt="Target image" loading="lazy" candidates={r.targetCandidates} />
              ) : (
                <img id="target-image" alt="Target image" loading="lazy" src={r.targetSrc || undefined} style={{ display: "block" }} />
              )}
            </div>
            <div className="result-right">
              <h3>{t("generatedLabel")}</h3>
              <div className="generated-placeholder">
                <img
                  id="generated-image"
                  alt="Generated image"
                  loading="lazy"
                  src={r.isBiasPlay ? undefined : r.generatedSrc || undefined}
                  style={{ display: r.isBiasPlay ? "none" : "block" }}
                />
              </div>
            </div>
          </div>
          <p id="score-line" style={{ display: r.showScore ? "block" : "none" }}>{r.scoreLine || ""}</p>
          <p id="bias-line">{r.biasLine || ""}</p>
          <p id="explanation-line">{r.explanationLine || ""}</p>
          <p id="prompt-line">{r.promptLine || ""}</p>
          <div style={{ textAlign: "center", marginTop: 16, width: "100%" }}>
            <button
              id="back-hub-btn"
              className="button btn primary-btn"
              type="button"
              onClick={backToHubFromResult}
              style={{
                minWidth: 200,
                height: 52,
                padding: "0 32px",
                alignSelf: "center",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {t("backToHub")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
