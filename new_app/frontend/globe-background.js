(function () {
  const mount = document.getElementById("globe-background");
  if (!mount || !window.THREE) return;

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

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float glow = smoothstep(0.5, 0.0, d);
        float core = smoothstep(0.16, 0.0, d);
        vec3 color = mix(uColorA, uColorB, vColorMix);
        color = mix(color, uColorC, core * 0.65);
        float alpha = glow * (0.18 + vBrightness * 0.48);
        gl_FragColor = vec4(color, alpha);
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
      const color = lineColorA.clone().lerp(lineColorB, alphaMix).lerp(lineColorC, i / arc.length * 0.2);
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

  const pointer = { x: 0, y: 0 };
  const smoothPointer = { x: 0, y: 0 };
  const drag = { active: false, lastX: 0, lastY: 0, vx: 0, vy: 0 };

  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    if (drag.active) {
      drag.vx += (event.clientX - drag.lastX) * 0.00018;
      drag.vy += (event.clientY - drag.lastY) * 0.00012;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    }
  }, { passive: true });

  window.addEventListener("pointerdown", (event) => {
    drag.active = true;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  }, { passive: true });

  window.addEventListener("pointerup", () => {
    drag.active = false;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    drag.active = false;
  }, { passive: true });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.z = window.innerWidth < 760 ? 405 : 330;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    renderer.setSize(window.innerWidth, window.innerHeight);
    particleMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  });

  camera.position.z = window.innerWidth < 760 ? 405 : 330;

  const clock = new THREE.Clock();

  function animate() {
    const elapsed = clock.getElapsedTime();
    smoothPointer.x += (pointer.x - smoothPointer.x) * 0.035;
    smoothPointer.y += (pointer.y - smoothPointer.y) * 0.035;

    particleMaterial.uniforms.uTime.value = elapsed;
    hubMaterial.uniforms.uTime.value = elapsed;
    ambient.material.uniforms.uTime.value = elapsed * 0.58;

    if (!prefersReducedMotion) {
      drag.vx *= 0.94;
      drag.vy *= 0.92;
      root.rotation.y += 0.0018 + drag.vx;
      root.rotation.x += (smoothPointer.y * 0.24 + drag.vy - root.rotation.x + -0.08) * 0.03;
      root.rotation.z += (smoothPointer.x * 0.16 - root.rotation.z + 0.02) * 0.026;
      camera.position.x += (smoothPointer.x * 34 - camera.position.x) * 0.04;
      camera.position.y += (-smoothPointer.y * 22 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      const pointerEnergy = Math.min(1, Math.abs(smoothPointer.x) + Math.abs(smoothPointer.y));
      lines.material.opacity = 0.2 + Math.sin(elapsed * 0.7) * 0.04 + pointerEnergy * 0.08;
      hubs.rotation.y = Math.sin(elapsed * 0.25) * 0.035 + smoothPointer.x * 0.055;
      globePoints.rotation.y = smoothPointer.x * 0.045;
      globePoints.rotation.x = -smoothPointer.y * 0.035;
      ambient.rotation.y -= 0.0005;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}());
