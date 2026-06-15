// Ported verbatim from frontend/globe-background.js. The only changes: THREE is
// now an ES import (instead of a CDN global), the IIFE became an exported
// init function that takes the mount element, and every listener / animation
// frame is tracked so the effect can clean up on unmount (and under React
// StrictMode double-invocation in dev).
import * as THREE from "three";

export function initGlobeBackground(mount) {
  if (!mount || !THREE) return () => {};

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const particleCount = window.innerWidth < 760 ? 9000 : 17000;
  const hubCount = window.innerWidth < 760 ? 36 : 64;
  const sphereRadius = 140;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030814, 0.0023);

  const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 1, 900);
  camera.position.set(0, 0, 330);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x02050d, 0);
  mount.appendChild(renderer.domElement);

  const root = new THREE.Group();
  root.rotation.set(-0.08, 0.18, 0.02);
  scene.add(root);

  const sphere = new THREE.SphereGeometry(sphereRadius, 128, 128);
  const sourcePositions = sphere.attributes.position.array;
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const brightness = new Float32Array(particleCount);
  const colorMix = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i += 1) {
    const vertex = Math.floor(Math.random() * (sourcePositions.length / 3)) * 3;
    const jitter = 1 + (Math.random() - 0.5) * 0.026;
    positions[i * 3] = sourcePositions[vertex] * jitter;
    positions[i * 3 + 1] = sourcePositions[vertex + 1] * jitter;
    positions[i * 3 + 2] = sourcePositions[vertex + 2] * jitter;
    sizes[i] = 1.15 + Math.random() * 2.6;
    brightness[i] = 0.34 + Math.random() * 0.62;
    colorMix[i] = Math.random();
  }
  sphere.dispose();

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  particleGeometry.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
  particleGeometry.setAttribute("aColorMix", new THREE.BufferAttribute(colorMix, 1));

  const particleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uGlobalAlpha: { value: 1 },
      uColorA: { value: new THREE.Color("#5ea0ff") },
      uColorB: { value: new THREE.Color("#7f5cff") },
      uColorC: { value: new THREE.Color("#82e8ff") },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aBrightness;
      attribute float aColorMix;
      varying float vBrightness;
      varying float vColorMix;
      uniform float uTime;
      uniform float uPixelRatio;

      void main() {
        vBrightness = aBrightness + sin(uTime * 0.75 + position.y * 0.028 + position.x * 0.012) * 0.18;
        vColorMix = aColorMix;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float size = aSize * (1.0 + vBrightness * 0.55);
        gl_PointSize = size * uPixelRatio * (350.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vBrightness;
      varying float vColorMix;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform float uGlobalAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float glow = smoothstep(0.5, 0.0, d);
        float core = smoothstep(0.16, 0.0, d);
        vec3 color = mix(uColorA, uColorB, vColorMix);
        color = mix(color, uColorC, core * 0.65);
        float alpha = glow * (0.18 + vBrightness * 0.48);
        gl_FragColor = vec4(color, alpha * uGlobalAlpha);
      }
    `,
  });

  const globePoints = new THREE.Points(particleGeometry, particleMaterial);
  root.add(globePoints);

  const hubPositions = [];
  const hubGeometry = new THREE.BufferGeometry();
  const hubArray = new Float32Array(hubCount * 3);
  const hubSizes = new Float32Array(hubCount);
  const hubBrightness = new Float32Array(hubCount);
  const hubColorMix = new Float32Array(hubCount);

  for (let i = 0; i < hubCount; i += 1) {
    const t = i / hubCount;
    const y = 1 - 2 * t;
    const radius = Math.sqrt(1 - y * y);
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    const point = new THREE.Vector3(
      Math.cos(theta) * radius,
      y,
      Math.sin(theta) * radius
    ).multiplyScalar(sphereRadius * (1.012 + Math.random() * 0.035));

    hubPositions.push(point);
    hubArray[i * 3] = point.x;
    hubArray[i * 3 + 1] = point.y;
    hubArray[i * 3 + 2] = point.z;
    hubSizes[i] = 4.6 + Math.random() * 4.8;
    hubBrightness[i] = 0.82 + Math.random() * 0.42;
    hubColorMix[i] = Math.random() > 0.72 ? 0.08 : 0.72;
  }

  hubGeometry.setAttribute("position", new THREE.BufferAttribute(hubArray, 3));
  hubGeometry.setAttribute("aSize", new THREE.BufferAttribute(hubSizes, 1));
  hubGeometry.setAttribute("aBrightness", new THREE.BufferAttribute(hubBrightness, 1));
  hubGeometry.setAttribute("aColorMix", new THREE.BufferAttribute(hubColorMix, 1));

  const hubMaterial = particleMaterial.clone();
  hubMaterial.uniforms = THREE.UniformsUtils.clone(particleMaterial.uniforms);
  const hubs = new THREE.Points(hubGeometry, hubMaterial);
  root.add(hubs);

  function slerpOnSphere(a, b, steps, lift) {
    const start = a.clone().normalize();
    const end = b.clone().normalize();
    const dot = THREE.MathUtils.clamp(start.dot(end), -1, 1);
    const omega = Math.acos(dot);
    const points = [];

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      let direction;
      if (omega < 0.0001) {
        direction = start.clone();
      } else {
        const sinOmega = Math.sin(omega);
        direction = start.clone()
          .multiplyScalar(Math.sin((1 - t) * omega) / sinOmega)
          .add(end.clone().multiplyScalar(Math.sin(t * omega) / sinOmega))
          .normalize();
      }
      const arcLift = Math.sin(Math.PI * t) * lift;
      points.push(direction.multiplyScalar(sphereRadius + arcLift));
    }

    return points;
  }

  const linePositions = [];
  const lineColors = [];
  const lineColorA = new THREE.Color("#5ea0ff");
  const lineColorB = new THREE.Color("#7f5cff");
  const lineColorC = new THREE.Color("#82e8ff");

  function addArc(a, b, lift, alphaMix) {
    const arc = slerpOnSphere(a, b, 18, lift);
    for (let i = 0; i < arc.length - 1; i += 1) {
      const p1 = arc[i];
      const p2 = arc[i + 1];
      linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      const color = lineColorA.clone().lerp(lineColorB, alphaMix).lerp(lineColorC, (i / arc.length) * 0.2);
      lineColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }
  }

  hubPositions.forEach((hub, index) => {
    const neighbors = hubPositions
      .map((candidate, candidateIndex) => ({
        candidate,
        candidateIndex,
        distance: hub.distanceTo(candidate),
      }))
      .filter((item) => item.candidateIndex !== index && item.distance < 150)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    neighbors.forEach((item, neighborIndex) => {
      if (item.candidateIndex > index) {
        addArc(hub, item.candidate, 7 + neighborIndex * 7 + Math.random() * 8, Math.random());
      }
    });

    if (index % 11 === 0) {
      const far = hubPositions[(index + Math.floor(hubCount * 0.38)) % hubCount];
      addArc(hub.clone().multiplyScalar(1.02), far.clone().multiplyScalar(1.02), 34 + Math.random() * 26, 0.45);
    }
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.23,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  lineMaterial.userData.baseOpacity = 0.23;
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  root.add(lines);

  const ambientCount = window.innerWidth < 760 ? 240 : 420;
  const ambientPositions = new Float32Array(ambientCount * 3);
  const ambientSizes = new Float32Array(ambientCount);
  const ambientBrightness = new Float32Array(ambientCount);
  const ambientMix = new Float32Array(ambientCount);
  for (let i = 0; i < ambientCount; i += 1) {
    const direction = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();
    const distance = 180 + Math.random() * 180;
    ambientPositions[i * 3] = direction.x * distance;
    ambientPositions[i * 3 + 1] = direction.y * distance;
    ambientPositions[i * 3 + 2] = direction.z * distance;
    ambientSizes[i] = 0.8 + Math.random() * 1.6;
    ambientBrightness[i] = 0.12 + Math.random() * 0.28;
    ambientMix[i] = Math.random();
  }
  const ambientGeometry = new THREE.BufferGeometry();
  ambientGeometry.setAttribute("position", new THREE.BufferAttribute(ambientPositions, 3));
  ambientGeometry.setAttribute("aSize", new THREE.BufferAttribute(ambientSizes, 1));
  ambientGeometry.setAttribute("aBrightness", new THREE.BufferAttribute(ambientBrightness, 1));
  ambientGeometry.setAttribute("aColorMix", new THREE.BufferAttribute(ambientMix, 1));
  const ambient = new THREE.Points(ambientGeometry, particleMaterial.clone());
  ambient.material.uniforms = THREE.UniformsUtils.clone(particleMaterial.uniforms);
  scene.add(ambient);

  const chamber = new THREE.Group();
  chamber.visible = false;
  scene.add(chamber);

  const chamberBlue = new THREE.Color("#5ea0ff");
  const chamberViolet = new THREE.Color("#7f5cff");
  const chamberCyan = new THREE.Color("#82e8ff");

  function makeLine(points, color, opacity) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    material.userData.baseOpacity = opacity;
    return new THREE.Line(geometry, material);
  }

  function makeRing(radius, y, color, opacity, segments = 192) {
    const points = [];
    for (let i = 0; i <= segments; i += 1) {
      const a = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    }
    const line = makeLine(points, color, opacity);
    line.rotation.x = 0;
    return line;
  }

  function makeWallArc(radius, y, heightOffset, color, opacity, start = -1.28, end = 1.28) {
    const points = [];
    const segments = 96;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const a = start + (end - start) * t;
      points.push(new THREE.Vector3(
        Math.sin(a) * radius,
        y + Math.sin(t * Math.PI) * heightOffset,
        -Math.cos(a) * radius
      ));
    }
    return makeLine(points, color, opacity);
  }

  function makeCeilingArc(radius, lift, color, opacity, phase) {
    const points = [];
    const segments = 120;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const a = -1.2 + t * 2.4 + phase;
      points.push(new THREE.Vector3(
        Math.sin(a) * radius,
        92 + Math.sin(t * Math.PI) * lift,
        -Math.cos(a) * radius + 26 * Math.sin(t * Math.PI * 2 + phase)
      ));
    }
    return makeLine(points, color, opacity);
  }

  const chamberFloor = new THREE.Group();
  chamberFloor.position.y = -112;
  chamber.add(chamberFloor);
  [34, 58, 84, 112, 146, 184, 228].forEach((radius, index) => {
    const ring = makeRing(radius, 0, index % 2 ? chamberBlue : chamberCyan, 0.12 + index * 0.012);
    ring.userData.spin = index % 2 ? -0.00045 : 0.00038;
    chamberFloor.add(ring);
  });

  for (let i = 0; i < 20; i += 1) {
    const a = (i / 20) * Math.PI * 2;
    const ray = makeLine([
      new THREE.Vector3(Math.cos(a) * 30, 0, Math.sin(a) * 30),
      new THREE.Vector3(Math.cos(a) * 225, 0, Math.sin(a) * 225),
    ], i % 3 === 0 ? chamberViolet : chamberBlue, 0.075);
    chamberFloor.add(ray);
  }

  const chamberWall = new THREE.Group();
  chamberWall.position.z = 34;
  chamber.add(chamberWall);
  [-70, -42, -12, 20, 52, 84].forEach((y, index) => {
    chamberWall.add(makeWallArc(245 + index * 8, y, 12 + index * 2, index % 2 ? chamberBlue : chamberViolet, 0.12));
  });

  for (let i = 0; i < 13; i += 1) {
    const x = -178 + i * 29.6;
    chamberWall.add(makeLine([
      new THREE.Vector3(x, -84, -210 + Math.abs(i - 6) * 3),
      new THREE.Vector3(x * 0.74, 98, -235),
    ], i % 2 ? chamberCyan : chamberBlue, 0.065));
  }

  const chamberCeiling = new THREE.Group();
  chamber.add(chamberCeiling);
  for (let i = 0; i < 9; i += 1) {
    chamberCeiling.add(makeCeilingArc(205 + i * 11, 22 + i * 2, i % 2 ? chamberViolet : chamberCyan, 0.09, i * 0.18));
  }

  const chamberParticleCount = window.innerWidth < 760 ? 600 : 1100;
  const chamberParticlePositions = new Float32Array(chamberParticleCount * 3);
  const chamberParticleSizes = new Float32Array(chamberParticleCount);
  const chamberParticleBrightness = new Float32Array(chamberParticleCount);
  const chamberParticleMix = new Float32Array(chamberParticleCount);
  for (let i = 0; i < chamberParticleCount; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 80 + Math.random() * 250;
    chamberParticlePositions[i * 3] = Math.cos(a) * r;
    chamberParticlePositions[i * 3 + 1] = -92 + Math.random() * 218;
    chamberParticlePositions[i * 3 + 2] = -250 + Math.sin(a) * 70 + Math.random() * 120;
    chamberParticleSizes[i] = 0.9 + Math.random() * 2.2;
    chamberParticleBrightness[i] = 0.14 + Math.random() * 0.36;
    chamberParticleMix[i] = Math.random();
  }
  const chamberParticleGeometry = new THREE.BufferGeometry();
  chamberParticleGeometry.setAttribute("position", new THREE.BufferAttribute(chamberParticlePositions, 3));
  chamberParticleGeometry.setAttribute("aSize", new THREE.BufferAttribute(chamberParticleSizes, 1));
  chamberParticleGeometry.setAttribute("aBrightness", new THREE.BufferAttribute(chamberParticleBrightness, 1));
  chamberParticleGeometry.setAttribute("aColorMix", new THREE.BufferAttribute(chamberParticleMix, 1));
  const chamberParticles = new THREE.Points(chamberParticleGeometry, particleMaterial.clone());
  chamberParticles.material.uniforms = THREE.UniformsUtils.clone(particleMaterial.uniforms);
  chamber.add(chamberParticles);

  const chamberCore = new THREE.Group();
  chamberCore.position.y = -112;
  chamber.add(chamberCore);
  [16, 24, 42].forEach((radius, index) => {
    const coreRing = makeRing(radius, 0.6 + index * 0.5, index === 1 ? chamberCyan : chamberViolet, 0.36 - index * 0.07, 128);
    coreRing.userData.spin = 0.0012 + index * 0.0004;
    chamberCore.add(coreRing);
  });

  const tunnelCount = window.innerWidth < 760 ? 900 : 1500;
  const tunnelPositions = new Float32Array(tunnelCount * 3);
  const tunnelSizes = new Float32Array(tunnelCount);
  const tunnelBrightness = new Float32Array(tunnelCount);
  const tunnelMix = new Float32Array(tunnelCount);
  for (let i = 0; i < tunnelCount; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const radius = 28 + Math.random() * 156;
    tunnelPositions[i * 3] = Math.cos(a) * radius;
    tunnelPositions[i * 3 + 1] = Math.sin(a) * radius;
    tunnelPositions[i * 3 + 2] = -420 + Math.random() * 840;
    tunnelSizes[i] = 1.2 + Math.random() * 3.8;
    tunnelBrightness[i] = 0.24 + Math.random() * 0.62;
    tunnelMix[i] = Math.random();
  }
  const tunnelGeometry = new THREE.BufferGeometry();
  tunnelGeometry.setAttribute("position", new THREE.BufferAttribute(tunnelPositions, 3));
  tunnelGeometry.setAttribute("aSize", new THREE.BufferAttribute(tunnelSizes, 1));
  tunnelGeometry.setAttribute("aBrightness", new THREE.BufferAttribute(tunnelBrightness, 1));
  tunnelGeometry.setAttribute("aColorMix", new THREE.BufferAttribute(tunnelMix, 1));
  const tunnelParticles = new THREE.Points(tunnelGeometry, particleMaterial.clone());
  tunnelParticles.material.uniforms = THREE.UniformsUtils.clone(particleMaterial.uniforms);
  tunnelParticles.visible = false;
  scene.add(tunnelParticles);

  const pointer = { x: 0, y: 0 };
  const smoothPointer = { x: 0, y: 0 };
  const drag = { active: false, lastX: 0, lastY: 0, vx: 0, vy: 0 };
  const transition = {
    active: false,
    to: "",
    from: "",
    start: 0,
    duration: 4.4,
  };

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function setMaterialAlpha(material, alpha) {
    if (!material) return;
    if (material.uniforms?.uGlobalAlpha) {
      material.uniforms.uGlobalAlpha.value = alpha;
      return;
    }
    const base = material.userData.baseOpacity ?? material.opacity ?? 1;
    material.opacity = base * alpha;
  }

  function setGroupAlpha(group, alpha) {
    group.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => setMaterialAlpha(material, alpha));
        } else {
          setMaterialAlpha(child.material, alpha);
        }
      }
    });
  }

  const clock = new THREE.Clock();

  const onCinematicChange = (event) => {
    transition.active = true;
    transition.from = event.detail?.from || "";
    transition.to = event.detail?.to || "";
    transition.start = clock.getElapsedTime();
    transition.duration = transition.to === "biasGames" ? 4.4 : 2.6;
  };

  const onPointerMove = (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    if (drag.active) {
      drag.vx += (event.clientX - drag.lastX) * 0.00018;
      drag.vy += (event.clientY - drag.lastY) * 0.00012;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    }
  };

  const onPointerDown = (event) => {
    drag.active = true;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  };

  const onPointerUp = () => {
    drag.active = false;
  };

  const onPointerLeave = () => {
    drag.active = false;
  };

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.z = window.innerWidth < 760 ? 405 : 330;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.setSize(window.innerWidth, window.innerHeight);
    particleMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  };

  window.addEventListener("cinematic-screen-change", onCinematicChange);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  window.addEventListener("resize", onResize);

  camera.position.z = window.innerWidth < 760 ? 405 : 330;

  let rafId = 0;

  function animate() {
    const elapsed = clock.getElapsedTime();
    smoothPointer.x += (pointer.x - smoothPointer.x) * 0.035;
    smoothPointer.y += (pointer.y - smoothPointer.y) * 0.035;

    particleMaterial.uniforms.uTime.value = elapsed;
    hubMaterial.uniforms.uTime.value = elapsed;
    ambient.material.uniforms.uTime.value = elapsed * 0.58;
    chamberParticles.material.uniforms.uTime.value = elapsed * 0.72;
    tunnelParticles.material.uniforms.uTime.value = elapsed * 1.4;

    const isChamber = document.body.classList.contains("is-bias-chamber-screen");
    const transitionRaw = transition.active ? clamp01((elapsed - transition.start) / transition.duration) : 1;
    const transitionProgress = easeInOutCubic(transitionRaw);
    if (transition.active && transitionRaw >= 1) {
      transition.active = false;
    }
    const enteringChamber = transition.active && transition.to === "biasGames";
    const leavingChamber = transition.active && transition.from === "biasGames" && transition.to !== "biasGames";
    const chamberBlend = enteringChamber
      ? clamp01((transitionProgress - 0.34) / 0.66)
      : leavingChamber
        ? 1 - transitionProgress
        : isChamber ? 1 : 0;
    const globeBlend = enteringChamber
      ? 1 - clamp01((transitionProgress - 0.18) / 0.52)
      : leavingChamber
        ? transitionProgress
        : isChamber ? 0 : 1;
    const tunnelBlend = enteringChamber
      ? Math.sin(Math.PI * clamp01((transitionProgress - 0.12) / 0.74))
      : leavingChamber
        ? Math.sin(Math.PI * transitionProgress) * 0.55
        : 0;

    root.visible = globeBlend > 0.01;
    ambient.visible = !document.body.classList.contains("is-prompt-screen");
    chamber.visible = chamberBlend > 0.01;
    tunnelParticles.visible = tunnelBlend > 0.01;
    setMaterialAlpha(particleMaterial, globeBlend);
    setMaterialAlpha(hubMaterial, globeBlend);
    setMaterialAlpha(ambient.material, document.body.classList.contains("is-prompt-screen") ? 0 : Math.max(0.22, globeBlend));
    setGroupAlpha(chamber, chamberBlend);
    setMaterialAlpha(tunnelParticles.material, tunnelBlend);

    if (!prefersReducedMotion) {
      drag.vx *= 0.94;
      drag.vy *= 0.92;
      if (isChamber || enteringChamber || leavingChamber) {
        chamber.rotation.y += (smoothPointer.x * 0.09 + drag.vx * 0.65 - chamber.rotation.y) * 0.035;
        chamber.rotation.x += (-0.08 + smoothPointer.y * 0.045 + drag.vy * 0.35 - chamber.rotation.x) * 0.03;
        chamber.position.x += (-smoothPointer.x * 10 - chamber.position.x) * 0.04;
        chamber.position.y += ((1 - chamberBlend) * -24 + smoothPointer.y * 4 - chamber.position.y) * 0.04;
        const travelZ = enteringChamber
          ? THREE.MathUtils.lerp(window.innerWidth < 760 ? 405 : 330, 118, Math.sin(Math.PI * clamp01(transitionProgress)))
          : window.innerWidth < 760 ? 430 : 355;
        const chamberZ = THREE.MathUtils.lerp(travelZ, window.innerWidth < 760 ? 430 : 355, chamberBlend);
        camera.position.x += (smoothPointer.x * (42 + tunnelBlend * 30) - camera.position.x) * 0.045;
        camera.position.y += (-smoothPointer.y * 18 - camera.position.y) * 0.045;
        camera.position.z += (chamberZ - camera.position.z) * 0.045;
        root.scale.setScalar(1 + tunnelBlend * 0.72);
        tunnelParticles.rotation.z += 0.006 + tunnelBlend * 0.018;
        tunnelParticles.position.z = -60 + Math.sin(elapsed * 1.2) * 24;
        chamberFloor.children.forEach((child, index) => {
          child.rotation.z += child.userData.spin || 0;
          child.material.opacity = (0.09 + Math.sin(elapsed * 0.9 + index * 0.7) * 0.025 + index * 0.012) * chamberBlend;
        });
        chamberCore.children.forEach((child, index) => {
          child.rotation.z -= child.userData.spin || 0.001;
          child.material.opacity = (0.24 + Math.sin(elapsed * 1.4 + index) * 0.08) * chamberBlend;
        });
        chamberWall.rotation.y = Math.sin(elapsed * 0.18) * 0.018;
        chamberCeiling.rotation.y = -Math.sin(elapsed * 0.15) * 0.024;
        chamberParticles.rotation.y -= 0.0007;
      } else {
        root.rotation.y += 0.0018 + drag.vx;
        root.scale.lerp(new THREE.Vector3(1, 1, 1), 0.04);
        root.rotation.x += (smoothPointer.y * 0.24 + drag.vy - root.rotation.x + -0.08) * 0.03;
        root.rotation.z += (smoothPointer.x * 0.16 - root.rotation.z + 0.02) * 0.026;
        camera.position.x += (smoothPointer.x * 34 - camera.position.x) * 0.04;
        camera.position.y += (-smoothPointer.y * 22 - camera.position.y) * 0.04;
        camera.position.z += ((window.innerWidth < 760 ? 405 : 330) - camera.position.z) * 0.035;
      }
      camera.lookAt(0, 0, 0);
      const pointerEnergy = Math.min(1, Math.abs(smoothPointer.x) + Math.abs(smoothPointer.y));
      lines.material.opacity = 0.2 + Math.sin(elapsed * 0.7) * 0.04 + pointerEnergy * 0.08;
      hubs.rotation.y = Math.sin(elapsed * 0.25) * 0.035 + smoothPointer.x * 0.055;
      globePoints.rotation.y = smoothPointer.x * 0.045;
      globePoints.rotation.x = -smoothPointer.y * 0.035;
      ambient.rotation.y -= 0.0005;
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup for React effect teardown.
  return function dispose() {
    cancelAnimationFrame(rafId);
    window.removeEventListener("cinematic-screen-change", onCinematicChange);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    if (renderer.domElement.parentNode === mount) {
      mount.removeChild(renderer.domElement);
    }
  };
}
