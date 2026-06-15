import React, { useEffect, useState } from "react";

// Mirrors the imperative onerror/onload candidate-cycling from app.js: try each
// source in order, hide the <img> when none resolve, and report the resolved
// src (used to drive the prompt screen's --prompt-bg-image variable).
export default function FallbackImage({ candidates, alt = "", id, className, loading, style, onResolvedSrc, onAllFailed }) {
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState(false);

  // Reset whenever the candidate list changes (a new bias game was opened).
  useEffect(() => {
    setIdx(0);
    setHidden(false);
  }, [candidates]);

  const list = candidates || [];

  if (hidden || list.length === 0) {
    return <img id={id} alt={alt} className={className} loading={loading} style={{ ...style, display: "none" }} />;
  }

  const src = list[idx];
  return (
    <img
      id={id}
      alt={alt}
      className={className}
      loading={loading}
      src={src}
      style={{ ...style, display: "block" }}
      onError={() => {
        if (idx + 1 < list.length) {
          setIdx(idx + 1);
        } else {
          setHidden(true);
          if (onAllFailed) onAllFailed();
        }
      }}
      onLoad={(e) => {
        if (onResolvedSrc) onResolvedSrc(e.currentTarget.currentSrc || src);
      }}
    />
  );
}
