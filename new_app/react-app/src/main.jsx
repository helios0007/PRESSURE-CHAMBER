import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import "./react-root.css";
import App from "./App.jsx";
import { AppProvider } from "./state/AppContext.jsx";

createRoot(document.getElementById("root")).render(
  <AppProvider>
    <App />
  </AppProvider>
);
