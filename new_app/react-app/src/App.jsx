import React from "react";
import Background from "./components/Background.jsx";
import { LoadingOverlay, LangSwitcher, ChallengePreview } from "./components/common.jsx";
import StartScreen from "./components/screens/StartScreen.jsx";
import IntroVideoScreen from "./components/screens/IntroVideoScreen.jsx";
import InstructionChoiceScreen from "./components/screens/InstructionChoiceScreen.jsx";
import InstructionVideoScreen from "./components/screens/InstructionVideoScreen.jsx";
import LanguageScreen from "./components/screens/LanguageScreen.jsx";
import HubScreen from "./components/screens/HubScreen.jsx";
import BiasGamesScreen from "./components/screens/BiasGamesScreen.jsx";
import PromptScreen from "./components/screens/PromptScreen.jsx";
import ResultScreen from "./components/screens/ResultScreen.jsx";
import FinalScreen from "./components/screens/FinalScreen.jsx";
import LeaderboardScreen from "./components/screens/LeaderboardScreen.jsx";

export default function App() {
  return (
    <>
      <Background />
      <LoadingOverlay />

      <main id="app" aria-live="polite">
        <StartScreen />
        <IntroVideoScreen />
        <InstructionChoiceScreen />
        <InstructionVideoScreen />
        <LanguageScreen />
        <HubScreen />
        <BiasGamesScreen />
        <PromptScreen />
        <ResultScreen />
        <FinalScreen />
        <LeaderboardScreen />
      </main>

      <ChallengePreview />
      <LangSwitcher />
    </>
  );
}
