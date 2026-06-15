import React, { useEffect } from "react";
import { useApp } from "../../state/AppContext.jsx";
import { cx } from "../common.jsx";

export default function IntroVideoScreen() {
  const { screen, introVideoRef, dismissScreensaver, pauseAllVideos, showScreen, screensaverActive, t } = useApp();
  const active = screen === "introVideo";

  // showScreen("introVideo") in the original restarted and played the video.
  useEffect(() => {
    const v = introVideoRef.current;
    if (!v || !active) return;
    v.currentTime = 0;
    v.load();
    v.play().catch(() => {});
  }, [active, introVideoRef]);

  const onSkip = () => {
    if (dismissScreensaver()) return;
    pauseAllVideos();
    showScreen("language");
  };

  return (
    <section className={cx("screen", active && "active", screensaverActive && "screensaver-mode")} id="screen-intro-video">
      <video
        id="intro-video"
        className="intro-video-bg"
        ref={introVideoRef}
        playsInline
        preload="auto"
        loop
        muted
        autoPlay
        onEnded={() => showScreen("language")}
      >
        <source src="media/intro-video.mp4" type="video/mp4" />
      </video>
      <button id="skip-intro-btn" className="button btn ghost intro-skip-btn" type="button" onClick={onSkip}>
        {t("skipIntro")}
      </button>
      <button id="replay-intro-btn" hidden type="button"></button>
      <button id="continue-from-intro-btn" hidden type="button"></button>
    </section>
  );
}
