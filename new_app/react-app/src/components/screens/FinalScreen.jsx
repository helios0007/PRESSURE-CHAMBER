import React from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx, ProgressIndicator } from "../common.jsx";

export default function FinalScreen() {
  const { screen, t, showScreen, finalData, loadLeaderboard } = useApp();
  const active = screen === "final";

  return (
    <section className={cx("screen", active && "active")} id="screen-final">
      <div className="container">
        <div className="panel">
          <div className="panel-top">
            <button id="back-final" className="button btn ghost" type="button" onClick={() => showScreen("hub")}>
              {t("back")}
            </button>
            <ProgressIndicator />
          </div>
          <h2>{t("finalReport")}</h2>
          <p id="final-user">{finalData.user}</p>
          <div id="final-list">
            {finalData.rows.map((row, idx) => (
              <p key={idx}>{row.title}: {row.score}</p>
            ))}
          </div>
          <p id="final-total">{`${t("totalScore")}: ${finalData.total}`}</p>
          <button
            id="view-leaderboard-btn"
            className="button btn primary-btn"
            type="button"
            onClick={async () => { await loadLeaderboard(); showScreen("leaderboard"); }}
          >
            {t("leaderboard")}
          </button>
        </div>
      </div>
    </section>
  );
}
