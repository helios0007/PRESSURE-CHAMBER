import React from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx } from "../common.jsx";

const LANG_CARDS = [
  { lang: "en", name: "English", code: "EN" },
  { lang: "es", name: "Español", code: "ES" },
  { lang: "ca", name: "Català", code: "CA" },
];

export default function LanguageScreen() {
  const { screen, t, setLanguage, showScreen, selectedLang, setSelectedLang } = useApp();
  const active = screen === "language";

  const onSelect = (lang) => {
    setSelectedLang(lang);
    setLanguage(lang);
    setTimeout(() => showScreen("start"), 260);
  };

  return (
    <section className={cx("screen", active && "active")} id="screen-language">
      <div className="container">
        <div className="panel language-panel">
          <div className="panel-top">
            <button id="back-language" className="button btn ghost" type="button" hidden onClick={() => showScreen("language")}>
              {t("back")}
            </button>
            <div className="progress-indicator">ENTRY PORTAL</div>
          </div>
          <p className="phase-label">{t("languagePhase")}</p>
          <h2>{t("selectLanguage")}</h2>
          <p className="helper-text language-helper">{t("languageHelper")}</p>
          <div className="lang-grid" role="list" aria-label="Language selection">
            {LANG_CARDS.map(({ lang, name, code }) => (
              <button
                key={lang}
                className={cx("lang-btn", "language-card", selectedLang === lang && "is-selected")}
                data-lang={lang}
                type="button"
                role="listitem"
                onClick={() => onSelect(lang)}
              >
                <span className="language-card-glow" aria-hidden="true"></span>
                <span className="language-name">{name}</span>
                <span className="language-code">{code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
