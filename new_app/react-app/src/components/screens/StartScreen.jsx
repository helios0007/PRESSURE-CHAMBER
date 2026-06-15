import React from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx } from "../common.jsx";

export default function StartScreen() {
  const { screen, t, username, setUsername, handleStart } = useApp();
  const active = screen === "start";

  return (
    <section className={cx("screen", active && "active")} id="screen-start">
      <div className="container">
        <div className="panel hero-panel">
          <p className="phase-label">{t("welcomePhase")}</p>
          <h1>{t("title")}</h1>
          <p className="subtitle">{t("subtitle")}</p>
          <p className="helper-text hero-copy">{t("heroCopy")}</p>

          <label htmlFor="username">{t("username")}</label>
          <input
            id="username"
            aria-label="Username"
            maxLength={30}
            autoComplete="off"
            placeholder={t("usernamePlaceholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="start-actions">
            <button id="start-btn" className="button btn primary-btn" type="button" onClick={handleStart}>
              {t("start")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
