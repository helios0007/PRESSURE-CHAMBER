import React, { useEffect } from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx } from "../common.jsx";

export default function InstructionVideoScreen() {
  const { screen, t, instructionVideoRef, pauseAllVideos, playVideo, showScreen, enterBiasChamber } = useApp();
  const active = screen === "instructionVideo";

  useEffect(() => {
    const v = instructionVideoRef.current;
    if (!v || !active) return;
    v.currentTime = 0;
    v.load();
    v.play().catch(() => {});
  }, [active, instructionVideoRef]);

  return (
    <section className={cx("screen", active && "active")} id="screen-instruction-video">
      <div className="container">
        <div className="panel video-panel">
          <div className="panel-top">
            <button
              id="back-instruction-choice-btn"
              className="button btn ghost"
              type="button"
              onClick={() => { pauseAllVideos(); showScreen("instructionChoice"); }}
            >
              {t("back")}
            </button>
            <div className="progress-indicator">{t("phase2Progress")}</div>
          </div>

          <h2>{t("howToPlay")}</h2>
          <p className="helper-text">{t("instructionVideoHelper")}</p>

          <div className="video-shell">
            <video
              id="instruction-video"
              className="feature-video"
              ref={instructionVideoRef}
              playsInline
              preload="metadata"
              controls
              onEnded={() => enterBiasChamber()}
            >
              <source src="media/instruction-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="video-actions">
            <button
              id="replay-instruction-btn"
              className="button btn ghost"
              type="button"
              onClick={() => playVideo(instructionVideoRef.current)}
            >
              {t("replayInstruction")}
            </button>
            <button
              id="continue-to-language-btn"
              className="button btn primary-btn"
              type="button"
              onClick={() => enterBiasChamber()}
            >
              {t("enterChamber")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
