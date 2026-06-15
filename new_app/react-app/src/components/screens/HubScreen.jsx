import React from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx, ProgressIndicator } from "../common.jsx";

export default function HubScreen() {
  const { screen, t, showScreen, loadBiasGames } = useApp();
  const active = screen === "hub";

  return (
    <section className={cx("screen", active && "active")} id="screen-hub">
      <div className="container">
        <div className="panel">
          <div className="panel-top">
            <button id="back-hub" className="button btn ghost" type="button" onClick={() => showScreen("biasGames")}>
              {t("back")}
            </button>
            <ProgressIndicator />
          </div>
          <h2>{t("taskHub")}</h2>
          <p>{t("chooseTask")}</p>
          {/* renderTaskHub() always hid the task grid; kept here for layout parity. */}
          <div id="task-grid" className="task-grid" style={{ display: "none" }}></div>
          <div className="bias-playground-entry">
            <article className="card bias-card bias-intro-card">
              <div className="task-card-top">
                <div className="task-meta">
                  <h3>{t("biasPlaygroundTitle")}</h3>
                  <p className="task-category">{t("biasPlaygroundCategory")}</p>
                  <p className="task-bias">{t("biasPlaygroundMode")}</p>
                </div>
              </div>
              <button
                id="open-bias-playground-btn"
                className="button btn primary-btn"
                type="button"
                onClick={() => { loadBiasGames(); showScreen("biasGames"); }}
              >
                {t("openBiasPlayground")}
              </button>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
