import React from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx } from "../common.jsx";

export default function InstructionChoiceScreen() {
  const { screen, t, showScreen, enterBiasChamber } = useApp();
  const active = screen === "instructionChoice";

  return (
    <section className={cx("screen", active && "active")} id="screen-instruction-choice">
      <div className="container">
        <div className="panel">
          <p className="phase-label">{t("phase2Label")}</p>
          <h2>{t("beforeYouEnter")}</h2>
          <p className="helper-text">{t("instructionChoiceHelper")}</p>

          <div className="stack-actions">
            <button
              id="play-instruction-btn"
              className="button btn primary-btn"
              type="button"
              onClick={() => showScreen("instructionVideo")}
            >
              {t("playInstructionVideo")}
            </button>
            <button
              id="skip-to-setup-btn"
              className="button btn ghost"
              type="button"
              onClick={() => enterBiasChamber()}
            >
              {t("skipToSetup")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
