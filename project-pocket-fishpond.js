const canvas = document.querySelector(".reef-canvas");
const controls = document.querySelectorAll("[data-reef-action]");
const videoFrame = document.querySelector(".project-brief-media");
const videoElement = document.querySelector(".validation-video");
const fullscreenToggle = document.querySelector("[data-video-fullscreen]");
const imageViewer = document.querySelector(".image-viewer");
const imageViewerImage = document.querySelector(".image-viewer-image");
const imageViewerCaption = document.querySelector(".image-viewer-caption");
const imageViewerClose = document.querySelector(".image-viewer-close");
const galleryFigures = document.querySelectorAll(".validation-gallery figure");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const W = 135;
  const H = 240;
  const renderScale = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 2)));
  const WATER_SURFACE_Y = 48;
  const fish = [];
  const babies = [];
  const bubbles = [];
  const particles = [];
  const foods = [];
  const foams = [];
  const splashes = [];
  const netCatch = [];
  const modes = {
    breed: "繁衍",
    feed: "投喂",
    night: "夜光",
    view: "观赏",
    net: "捕鱼",
    shark: "鲨鱼",
  };
  let mode = "view";
  let modeStartedAt = performance.now();
  let lastFrameAt = modeStartedAt;
  let lastFeedAt = 0;
  let lastBirthAt = 0;
  let scareUntil = 0;
  let currentStrength = 0;
  let screenTilt = 0;
  let netCaptured = false;

  if (videoFrame && videoElement && fullscreenToggle) {
    const syncFullscreenState = () => {
      const active =
        document.fullscreenElement === videoFrame ||
        document.webkitFullscreenElement === videoFrame ||
        document.fullscreenElement === videoElement ||
        document.webkitFullscreenElement === videoElement;
      fullscreenToggle.setAttribute("aria-pressed", active ? "true" : "false");
      fullscreenToggle.textContent = active ? "⤡" : "⛶";
      fullscreenToggle.setAttribute("aria-label", active ? "退出全屏播放" : "全屏播放视频");
    };

    const requestVideoFullscreen = async () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) return document.exitFullscreen();
        if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
        return undefined;
      }
      if (videoFrame.requestFullscreen) return videoFrame.requestFullscreen();
      if (videoFrame.webkitRequestFullscreen) return videoFrame.webkitRequestFullscreen();
      if (videoElement.webkitEnterFullscreen) return videoElement.webkitEnterFullscreen();
      return undefined;
    };

    fullscreenToggle.addEventListener("click", () => {
      void requestVideoFullscreen();
    });
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);
    syncFullscreenState();
  }

  if (imageViewer && imageViewerImage && imageViewerCaption && imageViewerClose) {
    const openViewer = (figure) => {
      const img = figure.querySelector("img");
      const caption = figure.querySelector("figcaption");
      if (!img) return;
      imageViewerImage.src = img.src;
      imageViewerImage.alt = img.alt || "";
      imageViewerCaption.textContent = caption ? caption.textContent || "" : "";
      imageViewer.hidden = false;
      imageViewer.setAttribute("aria-hidden", "false");
      imageViewerClose.focus();
    };

    const closeViewer = () => {
      imageViewer.hidden = true;
      imageViewer.setAttribute("aria-hidden", "true");
      imageViewerImage.src = "";
      imageViewerImage.alt = "";
      imageViewerCaption.textContent = "";
    };

    galleryFigures.forEach((figure) => {
      figure.addEventListener("click", () => openViewer(figure));
    });

    imageViewerClose.addEventListener("click", closeViewer);
    imageViewer.addEventListener("click", (event) => {
      if (event.target === imageViewer) closeViewer();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !imageViewer.hidden) closeViewer();
    });
  }

  const palette = [
    ["#ffa153", "#ffd370"],
    ["#53daea", "#a8f7ff"],
    ["#ff5c7f", "#ffa6bc"],
    ["#97de5d", "#dbf782"],
    ["#b784ff", "#e4cdff"],
  ];
  const babyPalette = [
    ["#ffdc78", "#fff5b4"],
    ["#76eee2", "#bcfff6"],
    ["#ff8caa", "#ffcddd"],
    ["#92e866", "#e4ffac"],
    ["#b293ff", "#e6d8ff"],
    ["#ffb868", "#ffe89b"],
  ];

  canvas.width = W * renderScale;
  canvas.height = H * renderScale;

  function wave(now, speed, phase) {
    return Math.sin(now * speed + phase);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function waterSurfaceYAt(x, now) {
    const lean = screenTilt * 14;
    const span = (x - W * 0.5) / W;
    const rhythm = now * 0.0028;
    const ripple =
      Math.sin(x * 0.073 + rhythm) * 0.9 +
      Math.sin(x * 0.146 - rhythm * 1.28 + 1.9) * 0.34 +
      wave(now, 0.018, x * 0.17 + 3.1) * 0.18 +
      wave(now, 0.031, x * 0.31 + 5.2) * 0.1 +
      wave(now, 0.057, x * 0.63 + 1.4) * 0.05 +
      wave(now, 0.0014, 0.6) * 0.24;
    return WATER_SURFACE_Y + lean * span + ripple;
  }

  function backWaterSurfaceYAt(x, now) {
    const rhythm = now * 0.0028;
    return (
      WATER_SURFACE_Y +
      4.2 +
      Math.sin(x * 0.073 - rhythm + Math.PI * 0.72) * 0.98 +
      Math.sin(x * 0.146 + rhythm * 1.12 + 0.2) * 0.3 +
      screenTilt * 8 * ((x - W * 0.5) / W)
    );
  }

  function waterFillYAt(x, now) {
    return Math.min(waterSurfaceYAt(x, now), backWaterSurfaceYAt(x, now)) - 2;
  }

  function initWorld() {
    const sizes = [9, 7, 6, 5, 8];
    const y = [64, 95, 126, 156, 78];
    const speed = [0.22, 0.31, 0.38, 0.27, 0.18];
    for (let i = 0; i < 5; i += 1) {
      fish.push({
        x: 16 + i * 24,
        y: y[i],
        speed: speed[i],
        dir: i % 2 ? -1 : 1,
        size: sizes[i],
        phase: i * 3,
        body: palette[i][0],
        fin: palette[i][1],
        kind: i,
        visible: true,
      });
    }

    for (let i = 0; i < 20; i += 1) {
      bubbles.push({
        x: 10 + ((i * 37) % 118),
        y: 38 + ((i * 53) % 188),
        speed: 0.35 + (i % 5) * 0.13,
        r: 0.75 + (i % 3) * 0.35,
        phase: i * 7,
      });
    }

    for (let i = 0; i < 22; i += 1) {
      particles.push({
        x: 4 + ((i * 31) % 128),
        y: 24 + ((i * 47) % 176),
        speed: 0.08 + (i % 4) * 0.03,
        phase: i * 5,
      });
    }

    for (let i = 0; i < 6; i += 1) spawnBabyFish(i);
  }

  function spawnBabyFish(seed = babies.length) {
    if (babies.length >= 30) babies.shift();
    const species = (seed * 3 + babies.length) % babyPalette.length;
    babies.push({
      x: 54 + (seed % 4) * 7,
      y: 104 + (seed % 3) * 8,
      speed: 0.18 + (seed % 4) * 0.04,
      dir: seed % 2 ? -1 : 1,
      species,
      body: babyPalette[species][0],
      fin: babyPalette[species][1],
      phase: seed * 5,
      growth: 0,
      active: true,
    });
    lastBirthAt = performance.now();
    spawnFoam(66, 108, 8, 0.7);
  }

  function dropFeedPellet() {
    for (let i = 0; i < 5; i += 1) {
      foods.push({
        x: 67 + (i - 2) * 11 + ((performance.now() / 19 + i * 7) % 5) - 2,
        y: 28 + (i % 2) * 3,
        speed: 0.4 + (i % 3) * 0.05,
        active: true,
      });
    }
    lastFeedAt = performance.now();
  }

  function spawnFoam(x, y, count, spread) {
    for (let i = 0; i < count; i += 1) {
      foams.push({
        x: x + wave(performance.now() + i * 13, 0.024, i) * 4,
        y: y + wave(performance.now() + i * 17, 0.031, i + 1.3) * 2.2,
        vx: wave(performance.now() + i * 19, 0.019, i) * (0.22 + spread * 0.16),
        vy: -0.2 - spread * 0.14 - (i % 3) * 0.05,
        life: 18 + (i % 5) * 4,
      });
    }
  }

  function spawnSplashBurst(now, intensity) {
    for (let i = 0; i < 14; i += 1) {
      const x = 10 + ((now * 0.03 + i * 13) % (W - 20));
      splashes.push({
        x,
        y: waterSurfaceYAt(x, now) - 1,
        vx: wave(now, 0.012, i * 0.63) * (0.55 + intensity * 0.35),
        vy: -1.05 - intensity * 0.55 - (i % 4) * 0.12,
        life: 18 + (i % 5) * 3,
      });
    }
    scareUntil = now + 1100;
  }

  function setMode(next) {
    mode = next;
    modeStartedAt = performance.now();
    netCaptured = false;
    screenTilt = next === "night" ? -0.08 : 0;
    if (next === "breed") spawnBabyFish();
    if (next === "feed") dropFeedPellet();
    if (next === "shark") {
      fish.forEach((item, i) => {
        item.visible = true;
        item.x = W + 18 + i * 13;
        item.y = 58 + (i % 4) * 26;
        item.dir = -1;
      });
      scareUntil = performance.now() + 3800;
      spawnSplashBurst(performance.now(), 0.8);
    }
    if (next === "net") spawnSplashBurst(performance.now(), 0.7);

    controls.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.reefAction === next);
    });
    updateHud();
  }

  function updateHud() {
    const count = fish.filter((item) => item.visible).length + babies.filter((item) => item.active).length;
    return count;
  }

  function updateWorld(now, dt) {
    const age = now - modeStartedAt;
    const scared = now < scareUntil || (mode === "shark" && age > 500 && age < 3400);
    const netting = mode === "net" && age > 650 && age < 3600;
    currentStrength = currentStrength * 0.96 + wave(now, 0.0018, 0) * 0.012;
    if (mode === "net" && age > 700 && age < 3500) currentStrength += wave(now, 0.01, 0) * 0.018;
    if (mode === "shark" && age > 900 && age < 3600) currentStrength -= 0.018;
    screenTilt = screenTilt * 0.992 + wave(now, 0.0015, 2) * 0.0011;
    screenTilt = clamp(screenTilt, -0.18, 0.18);

    if (mode === "breed" && age > 2400 && babies.length < 14) {
      modeStartedAt = now - 800;
      spawnBabyFish(babies.length + Math.floor(now / 1000));
    }

    updateFish(now, scared, netting);
    updateBabies(now, scared, netting);
    updateFood(now);
    updateBubbles(now);
    updateParticles();
    updateEffects();

    if (mode === "net" && age > 3900 && !netCaptured) {
      captureIntoNet();
      netCaptured = true;
    }
    if (mode === "shark" && age > 6200) setMode("breed");
    if (mode === "net" && age > 6200) setMode("breed");
    if (dt > 0) updateHud();
  }

  function updateFish(now, scared, netting) {
    const sharkMouth = { x: sharkXAt(now - modeStartedAt) - 45, y: sharkYAt(now) };
    fish.forEach((item, i) => {
      if (!item.visible && mode !== "shark") return;
      let energy = scared ? 5.4 + i * 0.35 : 1;
      item.x += item.dir * item.speed * energy + currentStrength;
      item.y += wave(now, 0.0035 + i * 0.0004, item.phase) * (scared ? 1.1 : 0.22);

      if (mode === "view") {
        item.x += wave(now, 0.0015 + i * 0.00012, item.phase) * 0.35 + (i % 3 - 1) * 0.04;
        item.y += wave(now, 0.0026 + i * 0.0001, item.phase + 3) * 0.24;
      }
      if (mode === "shark") {
        if (now - modeStartedAt > 650 && now - modeStartedAt < 3500) item.dir = -1;
        if (now - modeStartedAt > 1450 + i * 230) {
          item.x += (sharkMouth.x - item.x) * 0.082;
          item.y += (sharkMouth.y - item.y) * 0.068;
        }
        if (now - modeStartedAt > 1950 + i * 300 && Math.abs(item.x - sharkMouth.x) < 26 && Math.abs(item.y - sharkMouth.y) < 20) {
          item.visible = false;
          spawnFoam(sharkMouth.x - 8, sharkMouth.y, 8, 1.2);
        }
      }
      if (netting) {
        const netX = 70 + wave(now, 0.004, 2) * 5;
        const netY = 102 + Math.min(70, (now - modeStartedAt - 650) * 0.035);
        item.x += (netX - item.x) * 0.04;
        item.y += (netY - item.y) * 0.03;
      }

      if (item.x < -18) {
        item.x = -18;
        item.dir = 1;
      }
      if (item.x > W + 18) {
        item.x = W + 18;
        item.dir = -1;
      }
      item.y = clamp(item.y, waterSurfaceYAt(item.x, now) + 12, 172);
    });
  }

  function updateBabies(now, scared, netting) {
    const sharkMouth = { x: sharkXAt(now - modeStartedAt) - 45, y: sharkYAt(now) };
    babies.forEach((item, i) => {
      if (!item.active) return;
      const sizeDrag = Math.max(0.38, 1 - item.growth * 0.0038);
    let energy = (scared ? 6.2 + (i % 4) * 0.35 : 1) * sizeDrag;
      item.x += item.dir * item.speed * energy + currentStrength * 0.75;
      item.y += wave(now, 0.006 + i * 0.0008, item.phase) * (scared ? 1.3 : 0.35);

      if (mode === "breed") {
        item.x += wave(now, 0.005, i) * 0.18;
        item.y += wave(now, 0.004, i + 3) * 0.12;
      }
      if (mode === "view") {
        item.x += wave(now, 0.0017 + i * 0.00014, item.phase) * 0.28;
        item.y += wave(now, 0.0028 + i * 0.00016, item.phase + 2) * 0.22;
      }
      if (mode === "shark") {
        if (now - modeStartedAt > 650 && now - modeStartedAt < 3500) item.dir = -1;
        if (now - modeStartedAt > 1300 + (i % 6) * 130) {
          item.x += (sharkMouth.x - item.x) * 0.105;
          item.y += (sharkMouth.y - item.y) * 0.09;
        }
        if (now - modeStartedAt > 1750 + (i % 6) * 190 && Math.abs(item.x - sharkMouth.x) < 22 && Math.abs(item.y - sharkMouth.y) < 18) {
          item.active = false;
          spawnFoam(sharkMouth.x - 8, sharkMouth.y, 6, 1);
        }
      }
      if (netting) {
        const netX = 70 + wave(now, 0.004, 2) * 5;
        const netY = 102 + Math.min(70, (now - modeStartedAt - 650) * 0.035);
        item.x += (netX - item.x) * 0.045;
        item.y += (netY - item.y) * 0.035;
      }

      if (item.x < -8) {
        item.x = -8;
        item.dir = 1;
      }
      if (item.x > W + 8) {
        item.x = W + 8;
        item.dir = -1;
      }
      item.y = clamp(item.y, waterSurfaceYAt(item.x, now) + 10, 188);
    });
  }

  function updateFood(now) {
    if (mode !== "feed") return;
    for (let index = foods.length - 1; index >= 0; index -= 1) {
      const food = foods[index];
      if (!food.active) continue;
      food.y += food.speed;
      food.x += wave(now, 0.006, food.x) * 0.08;
      babies.forEach((baby) => {
        if (!baby.active || !food.active) return;
        const dx = baby.x - food.x;
        const dy = baby.y - food.y;
        const reach = 10 + baby.growth * 0.05;
        if (Math.hypot(dx, dy) < reach) {
          baby.growth = clamp(baby.growth + 10, 0, 255);
          food.active = false;
          spawnFoam(food.x, food.y, 5, 0.5);
        }
      });
      if (food.y > 190 || !food.active) foods.splice(index, 1);
    }
  }

  function updateBubbles(now) {
    let boost = now - lastFeedAt < 800 ? 1.9 : 1;
    if (mode === "net") boost += 0.8;
    if (mode === "night") boost *= 0.55;
    bubbles.forEach((bubble, i) => {
      bubble.y -= bubble.speed * boost;
      bubble.x += wave(now, 0.006, bubble.phase) * 0.22 + currentStrength * 0.15;
      if (bubble.y < 18) {
        bubble.y = 222 + (i % 5) * 8;
        bubble.x = 8 + ((i * 29 + now / 37) % 120);
      }
    });
  }

  function updateParticles() {
    particles.forEach((particle) => {
      particle.x += particle.speed + currentStrength * 0.08;
      if (particle.x > W + 2) particle.x = -2;
    });
  }

  function updateEffects() {
    for (let i = foams.length - 1; i >= 0; i -= 1) {
      const item = foams[i];
      item.x += item.vx + currentStrength * 0.03;
      item.y += item.vy;
      item.vy -= 0.008;
      item.vx *= 0.986;
      item.life -= 1;
      if (item.life <= 0 || item.y < 14) foams.splice(i, 1);
    }
    for (let i = splashes.length - 1; i >= 0; i -= 1) {
      const item = splashes[i];
      item.x += item.vx + currentStrength * 0.1;
      item.y += item.vy;
      item.vy += 0.075;
      item.vx *= 0.987;
      item.life -= 1;
      if (item.life <= 0 || item.y > waterSurfaceYAt(item.x, performance.now()) + 10) splashes.splice(i, 1);
    }
  }

  function captureIntoNet() {
    netCatch.length = 0;
    const activeBabies = babies.filter((item) => item.active);
    activeBabies.slice(0, Math.max(1, Math.floor(activeBabies.length / 3))).forEach((item) => {
      netCatch.push({
        body: item.body,
        fin: item.fin,
        size: 3 + item.growth * 0.012,
        baby: true,
      });
      item.active = false;
      spawnFoam(item.x, item.y, 5, 1);
    });
    fish.filter((item) => item.visible).slice(0, 1).forEach((item) => {
      netCatch.push({
        body: item.body,
        fin: item.fin,
        size: item.size,
        baby: false,
      });
      item.visible = false;
      spawnFoam(item.x, item.y, 6, 1.1);
    });
    spawnSplashBurst(performance.now(), 1);
  }

  function sharkXAt(age) {
    const progress = clamp((age - 650) / 4050, 0, 1);
    return W + 55 - 205 * progress;
  }

  function sharkYAt(now) {
    return 100 + wave(now, 0.006, 0) * 5;
  }

  function sharkMouthOpen(age) {
    if (age < 1200 || age > 3800) return 0.15;
    const t = (age - 1200) / 2600;
    const pulse = (Math.sin(t * Math.PI * 4) + 1) * 0.5;
    return 0.45 + pulse * 0.55;
  }

  function drawWorld(now) {
    drawWater(now);
    drawSplashEffects();
    drawStatusBar();
    drawCurrentLines(now);
    drawParticles(now);
    fish.forEach((item, i) => {
      if (i >= 3) drawFish(item, item.size, i);
    });
    drawFood();
    drawBubbles();
    drawSandAndReef(now);
    drawPlants(now);
    drawGlow(now);
    babies.forEach((item, i) => {
      if (item.active) drawFish(item, 1.85 + item.growth * 0.0105, i + 8, true);
    });
    fish.forEach((item, i) => {
      if (i < 3) drawFish(item, item.size, i);
    });
    if (mode === "net") drawNet(now);
    if (mode === "shark") drawShark(now);
    drawEffects(now);
    drawLabel(now);
  }

  function drawWater(now) {
    const sky = mode === "night" ? "#010816" : mode === "shark" ? "#031f37" : "#05273e";
    const waterTop = mode === "night" ? "#042a40" : mode === "breed" ? "#0c7a9e" : "#0b6a90";
    const waterDeep = mode === "night" ? "#011226" : "#044366";
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const surface = new Path2D();
    surface.moveTo(0, waterFillYAt(0, now));
    for (let x = 4; x <= W; x += 4) surface.lineTo(x, waterFillYAt(x, now));
    surface.lineTo(W, waterFillYAt(W, now));
    surface.lineTo(W, H);
    surface.lineTo(0, H);
    surface.closePath();
    const waterGradient = ctx.createLinearGradient(0, WATER_SURFACE_Y, 0, H);
    waterGradient.addColorStop(0, waterTop);
    waterGradient.addColorStop(1, waterDeep);
    ctx.fillStyle = waterGradient;
    ctx.fill(surface);

    ctx.strokeStyle = mode === "night" ? "rgba(44, 140, 176, 0.44)" : "rgba(91, 205, 224, 0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, backWaterSurfaceYAt(0, now));
    for (let x = 6; x <= W; x += 6) ctx.lineTo(x, backWaterSurfaceYAt(x, now));
    ctx.lineTo(W, backWaterSurfaceYAt(W, now));
    ctx.stroke();
    ctx.strokeStyle = mode === "night" ? "rgba(11, 72, 108, 0.54)" : "rgba(18, 130, 168, 0.38)";
    ctx.beginPath();
    ctx.moveTo(0, backWaterSurfaceYAt(0, now) + 2);
    for (let x = 10; x <= W; x += 10) ctx.lineTo(x, backWaterSurfaceYAt(x, now) + 2);
    ctx.lineTo(W, backWaterSurfaceYAt(W, now) + 2);
    ctx.stroke();

    ctx.strokeStyle = mode === "night" ? "#4bc8e1" : "#60ddf6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, waterSurfaceYAt(0, now));
    for (let x = 4; x <= W; x += 4) ctx.lineTo(x, waterSurfaceYAt(x, now));
    ctx.lineTo(W, waterSurfaceYAt(W, now));
    ctx.stroke();
    ctx.strokeStyle = mode === "night" ? "rgba(13, 98, 132, 0.72)" : "rgba(45, 176, 214, 0.72)";
    ctx.beginPath();
    ctx.moveTo(0, waterSurfaceYAt(0, now) - 2);
    for (let x = 8; x <= W; x += 8) ctx.lineTo(x, waterSurfaceYAt(x, now) - 2);
    ctx.lineTo(W, waterSurfaceYAt(W, now) - 2);
    ctx.stroke();
    ctx.fillStyle = mode === "night" ? "rgba(75, 200, 225, 0.75)" : "rgba(160, 240, 255, 0.72)";
    for (let x = 5; x < W; x += 12) {
      const y = waterSurfaceYAt(x, now);
      ctx.fillRect(x, y - 2.5, 1, 1);
    }
    ctx.fillStyle = mode === "night" ? "rgba(190, 255, 248, 0.7)" : "rgba(230, 255, 255, 0.68)";
    for (let x = 8; x < W; x += 16) {
      const frontY = waterSurfaceYAt(x, now);
      const backY = backWaterSurfaceYAt(x, now);
      if (Math.abs(frontY - backY) < 2.2) {
        ctx.fillRect(x, (frontY + backY) / 2 - 0.5, 2, 1);
      }
    }
    ctx.restore();
  }

  function drawParticles(now) {
    ctx.fillStyle = mode === "night" ? "rgba(80, 180, 205, 0.42)" : "rgba(140, 230, 216, 0.48)";
    particles.forEach((particle) => {
      if (particle.y < waterFillYAt(particle.x, now) + 2) return;
      if (particle.y > 203) return;
      ctx.fillRect(particle.x, particle.y, 1, 1);
    });
  }

  function drawSplashEffects() {
    ctx.fillStyle = "#d9f9ff";
    splashes.forEach((item) => {
      circle(item.x, item.y, 1 + (item.life % 3 === 0 ? 1 : 0));
      ctx.fillRect(item.x + 1, item.y - 1, 1, 1);
    });
  }

  function drawStatusBar() {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#cbe2e7";
    ctx.fillStyle = "#d1e8ef";
    ctx.font = "8px monospace";
    ctx.fillText(".", 118, 11);
    ctx.strokeRect(96, 7, 24, 9);
    ctx.fillRect(120, 10, 2, 3);
    ctx.fillStyle = "#56de98";
    ctx.fillRect(98, 9, 14, 5);
    ctx.fillStyle = "#d1e8ef";
    ctx.fillText("--%", 69, 12);
    ctx.restore();
  }

  function drawCurrentLines(now) {
    if (mode !== "shark" && mode !== "net") return;
    ctx.strokeStyle = "#49a3c5";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const y = 50 + i * 22;
      const x = wave(now, 0.004, i) * 18 + 55 + currentStrength * 26;
      line(x - 26, y, x + 18, y - 5);
    }
  }

  function drawGlow(now) {
    if (mode === "night" || now - lastFeedAt < 900) {
      const pulse = 8 + (wave(now, 0.006, 0) + 1) * 4;
      ctx.strokeStyle = "#54e1ce";
      circleStroke(32, 203, pulse);
      ctx.strokeStyle = "#1c7877";
      circleStroke(32, 203, pulse + 6);
    }
    if (mode === "breed") {
      const pulse = 3.8 + (wave(now, 0.01, 0) + 1) * 1.6;
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "#88ffd3";
      circleStroke(64, 112, pulse);
      ctx.strokeStyle = "rgba(28, 144, 142, 0.78)";
      circleStroke(64, 112, pulse + 4.5);
      ctx.lineWidth = 1;
    }
  }

  function drawLabel(now) {
    const fishCount = updateHud();
    ctx.save();
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#dcefe7";
    ctx.fillText("口袋鱼塘", 4, 12);
    ctx.fillText(modes[mode], 4, 24);
    ctx.font = "8px monospace";
    ctx.fillText(String(fishCount), 98, 25);
    if (now - lastBirthAt < 900) {
      const lift = 10 - Math.min(10, (now - lastBirthAt) / 90);
      ctx.fillStyle = "#9bffe0";
      ctx.fillText("+1", 99, 30 - lift);
    }
    if (mode === "net") {
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#dcefe7";
      const age = now - modeStartedAt;
      const label = age < 3900 ? "撒网中" : age < 5200 ? "短按捕半" : "收网中";
      ctx.fillText(label, 4, 219);
    }
    ctx.restore();
  }

  function drawSandAndReef(now) {
    const sand = ctx.createLinearGradient(0, 205, 0, H);
    sand.addColorStop(0, "#eac270");
    sand.addColorStop(1, "#9e7043");
    ctx.fillStyle = sand;
    roundRect(-10, 205, 155, 42, 18);
    ctx.fill();
    ctx.strokeStyle = "#ebc370";
    ctx.lineWidth = 1;
    line(9, 207, 125, 207);

    for (let i = 0; i < 24; i += 1) {
      const x = (i * 23 + 7) % W;
      const y = 212 + ((i * 11) % 22);
      ctx.fillStyle = i % 3 === 0 ? "#84623e" : i % 3 === 1 ? "#c49356" : "#775334";
      ctx.fillRect(x, y, 1.2, 1.2);
    }

    drawCoralCluster(31, 207, now);
    drawShell(111, 219);
    drawPebbleCluster();
  }

  function drawCoralCluster(x, y, now) {
    const coral = mode === "night" ? "#ff5687" : "#eb5c5c";
    const coralHi = mode === "night" ? "#ff9abc" : "#ff9c8c";
    ctx.fillStyle = coral;
    circle(x, y - 8, 7);
    circle(x - 7, y - 3, 5);
    circle(x + 7, y - 2, 5);
    ctx.strokeStyle = "#4d965d";
    ctx.lineWidth = 2;
    line(x, y, x, y + 16);
    line(x, y + 7, x - 7, y + 12);
    line(x, y + 8, x + 8, y + 12);
    ctx.fillStyle = coralHi;
    circle(x - 2, y - 10, 2);
  }

  function drawShell(x, y) {
    ctx.strokeStyle = "#e5cb9d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, 12, 6, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.strokeStyle = "#a07752";
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i += 1) {
      line(x, y - 1, x + i * 4, y - 5 + Math.abs(i));
    }
  }

  function drawAnemone(x, y, now) {
    const base = mode === "night" ? "#6eead6" : "#56c89a";
    const tip = mode === "night" ? "#d4fff4" : "#b9ffd2";
    ctx.strokeStyle = base;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i += 1) {
      const phase = i * 0.8;
      const bend = wave(now, 0.006, phase) * 2.4 + currentStrength * 5;
      const len = 10 + (i % 3) * 3;
      const ox = (i - 4) * 2.1;
      line(x + ox, y, x + ox + bend, y - len);
      ctx.fillStyle = tip;
      circle(x + ox + bend, y - len, 1);
    }
  }

  function drawPebbleCluster() {
    const pebbles = [
      [70, 222, 5, 2, "#6b583a"],
      [79, 225, 4, 2, "#876a43"],
      [88, 222, 5, 2, "#786044"],
      [98, 226, 4, 2, "#5e4d36"],
      [112, 225, 5, 2, "#7f613d"],
    ];
    pebbles.forEach(([x, y, rx, ry, color]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPlants(now) {
    const back = mode === "night" ? "#1f5646" : "#22795e";
    const mid = mode === "night" ? "#2b674c" : "#36a874";
    const front = mode === "night" ? "#3f8b68" : "#5bd587";
    const hi = mode === "night" ? "#5de5c7" : "#8fefa4";
    const bases = [66, 73, 80, 88, 96, 104, 113, 121];
    const heights = [22, 35, 28, 42, 31, 38, 25, 33];
    bases.forEach((base, i) => {
      drawBlade(base, 225, heights[i], i % 3 === 0 ? 3 : 2, i * 1.7, i < 3 ? back : mid, hi, now);
    });
    drawBlade(86, 229, 24, 3, 8.1, front, hi, now);
    drawBlade(102, 229, 29, 3, 10.4, front, hi, now);
  }

  function drawBlade(baseX, baseY, height, width, phase, stem, hi, now) {
    const bend = wave(now, 0.0058, phase) * 2.2 + currentStrength * 8;
    const tipX = baseX + bend;
    const midX = baseX + bend * 0.45;
    const midY = baseY - height / 2;
    ctx.fillStyle = stem;
    ctx.beginPath();
    ctx.moveTo(baseX - width, baseY);
    ctx.lineTo(baseX + width, baseY);
    ctx.lineTo(midX, midY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(midX - Math.max(1, width - 1), midY);
    ctx.lineTo(midX + Math.max(1, width - 1), midY);
    ctx.lineTo(tipX, baseY - height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hi;
    ctx.lineWidth = 1;
    line(baseX, baseY - 2, tipX, baseY - height + 2);
    if (height > 24) {
      const leafY = baseY - height * 0.55;
      const leafX = baseX + bend * 0.35;
      const side = Math.floor(phase) % 2 ? -1 : 1;
      ctx.fillStyle = hi;
      triangle(leafX, leafY, leafX + side * (5 + width), leafY - 4, leafX + side * 2, leafY + 4, hi);
    }
  }

  function drawFood() {
    ctx.fillStyle = "#f3d26c";
    foods.forEach((food) => {
      if (!food.active) return;
      circle(food.x, food.y, 1.7);
    });
  }

  function drawBubbles() {
    ctx.strokeStyle = "rgba(210, 255, 247, 0.78)";
    ctx.lineWidth = 0.75;
    bubbles.forEach((bubble) => {
      const surfaceY = waterFillYAt(bubble.x, performance.now());
      if (bubble.y < surfaceY + 3 || bubble.y > 202) return;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
      ctx.stroke();
      if (bubble.r > 1.1) {
        ctx.fillStyle = "rgba(226, 255, 255, 0.72)";
        ctx.fillRect(bubble.x - 0.6, bubble.y - 0.8, 0.7, 0.7);
      }
    });
  }

  function drawFish(item, size, index, baby = false) {
    if (!item.visible && !baby) return;
    const glow = mode === "night";
    const kind = baby ? item.species : item.kind;
    const body = glow ? "#4be8b6" : item.body;
    const fin = glow ? "#56bdff" : item.fin;
    const mark = glow ? "#d3fff4" : "#ffeeb8";
    const tail = wave(performance.now(), baby ? 0.018 : 0.013, item.phase) * (baby ? 1.5 : 2);
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(item.dir, 1);
    ctx.rotate(screenTilt * 0.5 + wave(performance.now(), 0.008, item.phase) * 0.06);
    if (glow) {
      ctx.shadowColor = body;
      ctx.shadowBlur = baby ? 7 : 11;
    }

    if (baby) {
      const growthT = clamp(item.growth / 255, 0, 1);
      const morph = 1 - Math.pow(1 - growthT, 2.4);
      const bodyW = 2.1 + morph * 3.15;
      const bodyH = 1.45 + morph * 1.95;
      const tailLen = 0.8 + morph * 2.65;
      const tailLift = 0.6 + morph * 1.65;
      const finLift = 0.5 + morph * 1.85;
      const wobble = wave(performance.now(), 0.018, item.phase) * (0.14 + morph * 0.08);
      const eyeAlpha = 0.55 + morph * 0.45;
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyW, bodyH, wobble, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fin;
      ctx.globalAlpha = 0.33 + morph * 0.33;
      ctx.beginPath();
      ctx.ellipse(-bodyW * 0.84, bodyH * 0.04, tailLen, tailLift, -0.28 + wobble, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bodyW * 0.18, -bodyH * 0.78, 0.45 + morph * 0.85, 0.22 + morph * 0.52, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bodyW * 0.1, bodyH * 0.72, 0.4 + morph * 0.7, 0.18 + morph * 0.42, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255, 255, 240, " + eyeAlpha + ")";
      circle(bodyW * 0.36, -bodyH * 0.18, Math.max(0.42, 0.22 + morph * 0.2));
      if (morph > 0.2) {
        ctx.fillStyle = "rgba(255, 236, 192, 0.6)";
        ctx.fillRect(bodyW * 0.65, -0.2, 0.9 + morph * 0.75, 0.6);
      }
      ctx.restore();
      return;
    }

    if (kind === 0) {
      triangle(size + 6, 0, -size - 2, -size - 1, -size - 3, size + 1, body);
      triangle(-size - 3, 0, -size - 11, -5 - tail, -size - 11, 5 + tail, fin);
      triangle(-1, -size - 1, 5, -size - 7, 4, -1, fin);
      triangle(-2, size, 4, size + 5, 3, 1, fin);
      strokeLine(2, -size, -1, size, mark);
      strokeLine(-3, -size + 1, -5, size - 1, mark);
    } else if (kind === 1) {
      triangle(size + 9, 0, -size - 5, -4, -size - 7, 4, body);
      triangle(size + 5, -3, -size - 8, -3, -size - 8, 3, body);
      triangle(-size - 7, 0, -size - 14, -4 - tail, -size - 14, 4 + tail, fin);
      strokeLine(size + 1, 1, -size - 4, 1, mark);
      strokeLine(-2, -4, 4, -8, fin);
    } else if (kind === 2) {
      ctx.fillStyle = body;
      ellipse(0, 0, size + 3, size + 2);
      triangle(-size - 2, 0, -size - 9, -5 - tail, -size - 9, 5 + tail, fin);
      triangle(1, -size, 7, -size - 5, 4, -2, fin);
      ctx.fillStyle = mark;
      circle(-2, -2, 1);
      circle(1, 3, 1);
      strokeLine(5, -5, 1, 6, mark);
    } else if (kind === 3) {
      triangle(size + 7, 0, -size - 4, -3, -size - 4, 3, body);
      triangle(-size - 3, 0, -size - 8, -3 - tail, -size - 8, 3 + tail, fin);
      strokeLine(size + 3, 0, -size - 2, 0, "#86ffee");
      ctx.fillStyle = fin;
      ctx.fillRect(-1, 3, 1, 1);
    } else {
      triangle(size + 5, 0, -size - 2, -size - 5, -size - 4, size + 5, body);
      triangle(-size - 3, 0, -size - 10, -5 - tail, -size - 10, 5 + tail, fin);
      triangle(-1, -size - 1, 3, -size - 11, 5, -1, fin);
      triangle(-1, size + 1, 3, size + 11, 5, 1, fin);
      strokeLine(3, -size, -2, size, mark);
      strokeLine(-1, -size - 2, -4, size + 3, mark);
    }

    if (baby && item.growth > 28) strokeLine(-1.2 * size, -0.2 * size, 2.8 * size, 0.1 * size, "#fff4d0");
    if (baby && item.growth > 72) {
      ctx.fillStyle = mark;
      ctx.fillRect(1.6 * size, -2 * size, 1, 1);
      ctx.fillRect(2.4 * size, 1.8 * size, 1, 1);
    }

    ctx.fillStyle = "#052027";
    circle(size - 1, -2, Math.max(0.8, size * 0.12));
    ctx.fillStyle = "#ffecc0";
    ctx.fillRect(size + 3, 2, 1, 1);
    ctx.restore();
  }

  function drawEffects(now) {
    ctx.fillStyle = "rgba(217, 249, 255, 0.86)";
    splashes.forEach((item) => circle(item.x, item.y, 1.2));
    ctx.fillStyle = "rgba(205, 255, 248, 0.72)";
    foams.forEach((item) => circle(item.x, item.y, 1.4));
  }

  function drawNet(now) {
    const age = now - modeStartedAt;
    if (age < 500) return;
    const dropIn = clamp((age - 500) / 2100, 0, 1);
    const retract = clamp((age - 5000) / 1200, 0, 1);
    const drop = dropIn * (1 - retract);
    const cx = 70 + wave(now, 0.004, 2) * 5;
    const top = 28 + 90 * drop;
    const open = clamp(dropIn * 1.25 - retract * 0.7, 0.15, 1);
    const mouthW = 44 + 16 * open;
    const mouthH = 16 + 10 * open;
    const sag = 8 + 8 * open + wave(now, 0.006, 1.4) * 1.4;
    const bottomY = top + mouthH + 26 + 10 * open - retract * 22;
    const leftX = cx - mouthW / 2;
    const rightX = cx + mouthW / 2;
    const rope = "rgba(230, 207, 151, 0.92)";
    const mesh = "rgba(181, 232, 232, 0.72)";
    const meshSoft = "rgba(181, 232, 232, 0.38)";

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = rope;
    ctx.lineWidth = 1.4;
    line(cx, 18, cx, top - 8);
    line(leftX, top, rightX, top);
    line(leftX, top, leftX - 8, top + 12);
    line(rightX, top, rightX + 8, top + 12);
    line(leftX - 8, top + 12, cx, bottomY);
    line(rightX + 8, top + 12, cx, bottomY);

    ctx.fillStyle = "rgba(10, 40, 48, 0.15)";
    ctx.beginPath();
    ctx.moveTo(leftX, top);
    ctx.quadraticCurveTo(cx, top + mouthH, rightX, top);
    ctx.lineTo(rightX + 8, top + 12);
    ctx.quadraticCurveTo(cx + 18, bottomY - sag, cx, bottomY);
    ctx.quadraticCurveTo(cx - 18, bottomY - sag, leftX - 8, top + 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = mesh;
    ctx.lineWidth = 1;
    line(leftX, top, cx - 5, bottomY - sag);
    line(cx, top, cx, bottomY + 2);
    line(rightX, top, cx + 5, bottomY - sag);

    for (let y = top + 5; y < bottomY; y += 7) {
      const t = clamp((y - top) / Math.max(1, bottomY - top), 0, 1);
      const half = (1 - t) * mouthW * 0.5 + t * 5;
      const bow = Math.sin(t * Math.PI) * 4;
      ctx.strokeStyle = t > 0.76 ? meshSoft : mesh;
      line(cx - half, y + bow, cx + half, y + bow);
    }

    ctx.strokeStyle = meshSoft;
    for (let i = -3; i <= 3; i += 1) {
      const startX = cx + (i * mouthW) / 8;
      line(startX, top + 2, cx + i * 1.9, bottomY - 2 - Math.abs(i) * 1.8);
    }
    for (let i = -3; i <= 3; i += 1) {
      const startX = cx + (i * mouthW) / 8;
      line(startX, top + 2, cx - i * 1.9, bottomY - 3 - Math.abs(i) * 1.8);
    }

    ctx.fillStyle = "rgba(238, 220, 170, 0.94)";
    circle(leftX, top, 1.7);
    circle(rightX, top, 1.7);
    circle(cx, bottomY, 1.8);

    if (age > 1850) {
      ctx.strokeStyle = "rgba(208, 242, 245, 0.8)";
      ctx.fillStyle = "rgba(208, 242, 245, 0.72)";
      for (let i = 0; i < 7; i += 1) {
        const bx = leftX + 10 + ((i * 9 + age / 80) % Math.max(18, mouthW - 18));
        const by = top + 10 + ((i * 13) % Math.max(22, bottomY - top - 16));
        circleStroke(bx, by, 1 + (i % 2));
        if (i % 3 === 0) circle(bx + 3, by - 2, 0.8);
      }
    }

    if (netCatch.length > 0) {
      netCatch.slice(0, 8).forEach((item, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const px = cx - 12 + col * 11 + wave(now, 0.009, i) * 1.4;
        const py = bottomY - 17 - row * 8 + wave(now, 0.012, i + 2) * 1.2;
        drawNetFishGlyph(px, py, item, i, now);
      });
    }

    ctx.restore();
  }

  function drawNetFishGlyph(x, y, item, index, now) {
    const s = clamp(item.baby ? item.size : item.size * 0.72, 2.2, 7.5);
    const wiggle = wave(now, 0.012, index * 0.9) * 1.4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wiggle * 0.08);
    ctx.fillStyle = "rgba(232, 248, 250, 0.56)";
    ellipse(0, 0, s + 3, s + 2);
    ctx.fillStyle = item.body;
    ellipse(0, 0, s + 1.8, s + 1);
    triangle(-s - 1, 0, -s - 5, -2.4 + wiggle, -s - 5, 2.4 + wiggle, item.fin);
    triangle(-s * 0.25, -s + 1, s * 0.6, -s - 2, s * 0.35, -1, item.fin);
    ctx.fillStyle = "#081822";
    ctx.fillRect(s * 0.45, -1.2, 1, 1);
    ctx.strokeStyle = "rgba(255, 248, 230, 0.7)";
    ctx.lineWidth = 1;
    line(-s + 1, 0, -s - 2, wiggle);
    ctx.restore();
  }

  function drawShark(now) {
    const age = now - modeStartedAt;
    if (age < 650 || age > 4700) return;
    const x = sharkXAt(age);
    const y = sharkYAt(now);
    const open = sharkMouthOpen(age);
    const gape = 5 + 13 * open;
    const angle = screenTilt * 0.42 + wave(now, 0.004, age * 0.001) * 0.08;
    const tailBeat = wave(now, 0.018, 0.7) * 9;
    const tailFlex = wave(now, 0.018, 2.1) * 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = "#5c7b8f";
    ellipse(0, 0, 48, 18);
    ctx.fillStyle = "#abc8d2";
    ellipse(-6, 8, 31, 7);

    triangle(37, 0, 62 + tailFlex, -17 + tailBeat, 57 - tailFlex * 0.35, 4 + tailBeat * 0.26, "#3e5668");
    triangle(37, 0, 62 - tailFlex, 17 + tailBeat, 57 + tailFlex * 0.35, -4 + tailBeat * 0.26, "#3e5668");
    ctx.strokeStyle = "rgba(210, 238, 246, 0.48)";
    ctx.lineWidth = 1;
    line(39, -3, 59 + tailFlex * 0.4, -14 + tailBeat * 0.8);
    line(39, 3, 59 - tailFlex * 0.4, 14 + tailBeat * 0.8);
    triangle(6, -14, -11, -39, -20, -11, "#3e5668");
    triangle(3, 14, -15, 28, -20, 10, "#3e5668");

    triangle(-29, -10, -57, -gape, -36, -1, "#5c7b8f");
    triangle(-32, -2, -59, 0, -32, 2, "#080e14");
    triangle(-29, 10, -57, gape, -36, 1, "#abc8d2");
    strokeLine(-31, -2, -57, -gape, "#13232d");
    strokeLine(-31, 2, -57, gape, "#13232d");

    ctx.fillStyle = "#051018";
    circle(-26, -8, 2);

    ctx.strokeStyle = "#ffffee";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const tx = -36 - i * 4;
      line(tx, -3 - (i % 2), tx - 1, -8 - (i % 2));
      line(tx, 3 + (i % 2), tx - 1, 8 + (i % 2));
    }

    if (age > 1700 && age < 3400) {
      ctx.strokeStyle = "#b2ecf6";
      for (let i = 0; i < 6; i += 1) {
        const bx = -31 + i * 5 - ((age / 35) % 5);
        const by = 2 - i * 2 + (i % 3) * 5;
        circleStroke(bx, by, 1 + (i % 2));
      }
    }

    ctx.strokeStyle = "rgba(210, 245, 255, 0.42)";
    for (let i = 0; i < 4; i += 1) {
      const sweep = ((age * 0.08 + i * 18) % 80) - 48;
      line(-64 + sweep, -18 + i * 10, -24 + sweep, -24 + i * 10);
    }
    ctx.strokeStyle = "rgba(160, 225, 240, 0.36)";
    for (let i = 0; i < 3; i += 1) {
      const trail = tailBeat * 0.45 - i * 6;
      line(42 + i * 7, -10 + trail, 66 + i * 5, -16 + trail * 0.5);
      line(42 + i * 7, 10 + trail, 66 + i * 5, 16 + trail * 0.5);
    }
    ctx.restore();
  }

  function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function circleStroke(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function ellipse(x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function triangle(ax, ay, bx, by, cx, cy, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
  }

  function strokeLine(ax, ay, bx, by, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function frame(now) {
    const dt = now - lastFrameAt;
    lastFrameAt = now;
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    updateWorld(now, dt);
    drawWorld(now);
    requestAnimationFrame(frame);
  }

  controls.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.reefAction);
    });
  });

  initWorld();
  updateHud();
  requestAnimationFrame(frame);
}
