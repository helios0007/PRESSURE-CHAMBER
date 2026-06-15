import React, { useEffect, useRef } from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx } from "../common.jsx";
import { BIAS_GAMES } from "../../lib/biasGames.js";

const POS_CLASSES = ["pos-left", "pos-center", "pos-right"];

export default function BiasGamesScreen() {
  const { screen, t, showScreen, openBiasGame, biasGames } = useApp();
  const active = screen === "biasGames";

  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const openRef = useRef(openBiasGame);
  useEffect(() => { openRef.current = openBiasGame; }, [openBiasGame]);

  // Ported initBiasCardDelegation(): primary grid delegation + a document-level
  // getBoundingClientRect fallback so the rotated side cards remain clickable.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;

    const onGridClick = (e) => {
      const card = e.target.closest(".bias-card");
      if (!card) return;
      e.stopPropagation();
      const index = parseInt(card.dataset.biasIndex, 10);
      if (!Number.isNaN(index) && BIAS_GAMES[index]) openRef.current(BIAS_GAMES[index], index);
    };

    const onDocClick = (e) => {
      const screenEl = document.getElementById("screen-bias-games");
      if (!screenEl?.classList.contains("active")) return;
      if (!screenEl.contains(e.target)) return;
      const cards = grid.querySelectorAll(".bias-card");
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom
        ) {
          const index = parseInt(card.dataset.biasIndex, 10);
          if (!Number.isNaN(index) && BIAS_GAMES[index]) {
            openRef.current(BIAS_GAMES[index], index);
            return;
          }
        }
      }
    };

    grid.addEventListener("click", onGridClick);
    document.addEventListener("click", onDocClick);
    return () => {
      grid.removeEventListener("click", onGridClick);
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  // Ported initBiasGamesParallax(): pointer-driven CSS variables on the screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const onMove = (event) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      el.style.setProperty("--bias-parallax-x", `${x * 18}px`);
      el.style.setProperty("--bias-parallax-y", `${y * 14}px`);
      el.style.setProperty("--bias-tilt-x", `${y * -4}deg`);
      el.style.setProperty("--bias-tilt-y", `${x * 6}deg`);
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  const games = biasGames.length ? biasGames : BIAS_GAMES;
  const rows = [];
  for (let rowStart = 0; rowStart < games.length; rowStart += 3) {
    rows.push(games.slice(rowStart, rowStart + 3).map((game, col) => ({ game, index: rowStart + col, col })));
  }

  return (
    <section className={cx("screen", active && "active")} id="screen-bias-games" ref={sectionRef}>
      <button
        id="back-bias-games-btn"
        className="button btn ghost chamber-back-btn"
        type="button"
        aria-label="Go back"
        onClick={() => showScreen("hub")}
      >
        ←
      </button>
      <div className="container">
        <div className="panel">
          <h2>{t("biasPlaygroundHeading")}</h2>
          <p className="helper-text">{t("biasGamesHelper")}</p>
          <div id="bias-games-grid" className="bias-grid" ref={gridRef}>
            {rows.map((row, rowIdx) => (
              <div className="bias-row" key={rowIdx}>
                {row.map(({ game, index, col }) => (
                  <article
                    className={cx("bias-card", POS_CLASSES[col])}
                    data-bias-index={index}
                    key={game.id}
                  >
                    <div className="task-card-top">
                      <div className="task-meta">
                        <span className="bias-id">Bias 0{index + 1}</span>
                        <h3>{game.title}</h3>
                        <p className="task-category">{t("challengeInstruction")}</p>
                      </div>
                    </div>
                    <button className="button btn primary-btn" type="button">{t("playBtn")}</button>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
