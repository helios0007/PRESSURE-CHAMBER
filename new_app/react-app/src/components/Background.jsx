import React, { useEffect, useRef } from "react";
import { initGlobeBackground } from "../lib/globeBackground.js";

// Ported from initBackgroundBlobs() in app.js — the cursor glow + floating blob
// physics. Returns a cleanup that removes the listener and stops the loop.
function initBackgroundBlobs() {
  const cursorGlow = document.getElementById("cursor-glow");
  const mainBlob = document.querySelector(".blob-main");
  const floatingNodes = Array.from(document.querySelectorAll(".blob-floating"));

  if (!cursorGlow || !mainBlob || !floatingNodes.length) return () => {};

  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;
  let smoothX = mouseX;
  let smoothY = mouseY;
  let glowX = mouseX;
  let glowY = mouseY;

  const floating = floatingNodes.map((node) => {
    const size = Number(node.dataset.size) || 700;
    const speed = 0.05 + Math.random() * 0.1;
    const angle = Math.random() * Math.PI * 2;
    return {
      node,
      size,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      maxSpeed: 0.16,
    };
  });

  const onMouseMove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };
  document.addEventListener("mousemove", onMouseMove);

  let rafId = 0;
  function animate() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    smoothX += (mouseX - smoothX) * 0.08;
    smoothY += (mouseY - smoothY) * 0.08;
    glowX += (mouseX - glowX) * 0.05;
    glowY += (mouseY - glowY) * 0.05;

    const mainSize = Number(mainBlob.dataset.size) || 900;
    mainBlob.style.transform = `translate3d(${smoothX - mainSize / 2}px, ${smoothY - mainSize / 2}px, 0)`;
    cursorGlow.style.transform = `translate3d(${glowX - 320}px, ${glowY - 320}px, 0)`;

    floating.forEach((blob) => {
      blob.vx += (Math.random() - 0.5) * 0.01;
      blob.vy += (Math.random() - 0.5) * 0.01;

      const dx = mouseX - blob.x;
      const dy = mouseY - blob.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 500) {
        blob.vx += dx * 0.00005;
        blob.vy += dy * 0.00005;
      }

      const speed = Math.hypot(blob.vx, blob.vy);
      if (speed > blob.maxSpeed) {
        blob.vx = (blob.vx / speed) * blob.maxSpeed;
        blob.vy = (blob.vy / speed) * blob.maxSpeed;
      }

      blob.x += blob.vx;
      blob.y += blob.vy;

      if (blob.x < -200 || blob.x > w + 200) blob.vx *= -1;
      if (blob.y < -200 || blob.y > h + 200) blob.vy *= -1;

      blob.node.style.transform = `translate3d(${blob.x - blob.size / 2}px, ${blob.y - blob.size / 2}px, 0)`;
    });

    rafId = requestAnimationFrame(animate);
  }
  animate();

  return () => {
    cancelAnimationFrame(rafId);
    document.removeEventListener("mousemove", onMouseMove);
  };
}

export default function Background() {
  const globeRef = useRef(null);

  useEffect(() => {
    const disposeGlobe = initGlobeBackground(globeRef.current);
    const disposeBlobs = initBackgroundBlobs();
    return () => {
      if (typeof disposeGlobe === "function") disposeGlobe();
      if (typeof disposeBlobs === "function") disposeBlobs();
    };
  }, []);

  return (
    <>
      <div id="globe-background" className="globe-background" aria-hidden="true" ref={globeRef}></div>
      <div className="bg-gradient"></div>
      <div className="cursor-glow" id="cursor-glow" aria-hidden="true"></div>
      <div id="background-blobs" aria-hidden="true">
        <div className="blob blob-main" data-size="900"></div>
        <div className="blob blob-1 blob-floating" data-size="760"></div>
        <div className="blob blob-2 blob-floating" data-size="680"></div>
        <div className="blob blob-3 blob-floating" data-size="520"></div>
        <div className="blob blob-4 blob-floating" data-size="820"></div>
        <div className="blob blob-5 blob-floating" data-size="620"></div>
      </div>
      <div className="bg-grain"></div>
    </>
  );
}
