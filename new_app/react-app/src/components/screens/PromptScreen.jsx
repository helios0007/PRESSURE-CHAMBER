import React, { useRef } from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx, ProgressIndicator } from "../common.jsx";
import FallbackImage from "../FallbackImage.jsx";

export default function PromptScreen() {
  const { screen, t, showScreen, promptMeta, promptInput, setPromptInput, submitPrompt } = useApp();
  const active = screen === "prompt";
  const sectionRef = useRef(null);

  const setBgImage = (src) => {
    const el = sectionRef.current;
    if (el) el.style.setProperty("--prompt-bg-image", `url("${src}")`);
  };
  const clearBgImage = () => {
    const el = sectionRef.current;
    if (el) el.style.removeProperty("--prompt-bg-image");
  };

  return (
    <section className={cx("screen", active && "active")} id="screen-prompt" ref={sectionRef}>
      <div className="container">
        <div className="panel overlay-ui">
          <div className="panel-top">
            <button id="back-prompt" className="button btn ghost" type="button" onClick={() => showScreen("biasGames")}>
              {t("back")}
            </button>
            <ProgressIndicator />
          </div>
          <div className="prompt-layout">
            <div className="prompt-left">
              <FallbackImage
                id="prompt-target-image"
                alt="Target image for this prompt"
                candidates={promptMeta.targetCandidates}
                onResolvedSrc={setBgImage}
                onAllFailed={clearBgImage}
              />
            </div>
            <div className="prompt-right">
              <h2 id="prompt-title">{promptMeta.title}</h2>
              <p id="prompt-task-id">{promptMeta.taskId}</p>
              <p id="prompt-instruction">{promptMeta.instruction}</p>
              <textarea
                id="prompt-input"
                maxLength={200}
                aria-label="Prompt input"
                placeholder={t("promptPlaceholder")}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitPrompt();
                  }
                }}
              />
              <div className="row">
                <small id="char-counter">{promptInput.length}/200</small>
                <button id="generate-btn" className="button btn primary-btn" type="button" onClick={submitPrompt}>
                  {t("generate")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
