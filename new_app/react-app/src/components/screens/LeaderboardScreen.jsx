import React from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx, ProgressIndicator } from "../common.jsx";

export default function LeaderboardScreen() {
  const { screen, t, showScreen, leaderboard, resetApp } = useApp();
  const active = screen === "leaderboard";

  return (
    <section className={cx("screen", active && "active")} id="screen-leaderboard">
      <div className="container">
        <div className="panel">
          <div className="panel-top">
            <button id="back-leaderboard" className="button btn ghost" type="button" onClick={() => showScreen("final")}>
              {t("back")}
            </button>
            <ProgressIndicator />
          </div>
          <h2>{t("leaderboard")}</h2>
          <ol id="leaderboard-list">
            {leaderboard.map((entry, idx) => (
              <li key={idx}>{entry.name} - {entry.score}</li>
            ))}
          </ol>
          <button id="reset-btn" className="button btn ghost" type="button" onClick={resetApp}>
            {t("reset")}
          </button>
        </div>
      </div>
    </section>
  );
}
