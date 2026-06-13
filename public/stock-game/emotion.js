/* ============================================================
   EMOTION ENGINE — preserved face-api pipeline + landmark overlay.
   Loads tinyFaceDetector + faceLandmark68Net + faceExpressionNet,
   draws the 68 landmark points in amber on the live feed, and
   publishes a sentiment score that game.js uses to bias the market.
   Camera + detection start ONLY on user action (or ?autostart=1).
   ============================================================ */

(function () {
  "use strict";

  const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

  // expressions that push the market up vs. down
  const POSITIVE = ["happy", "surprised"];
  const NEGATIVE = ["sad", "angry", "fearful", "disgusted"];

  const el = (id) => document.getElementById(id);
  const css = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  const dom = {
    video: el("video"),
    canvas: el("overlay"),
    feed: el("feed"),
    status: el("feed-status"),
    startBtn: el("start-cam"),
    state: el("sentiment-state"),
    exprName: el("expr-name"),
    exprConf: el("expr-conf"),
    confBar: el("conf-bar"),
    score: el("sentiment-score"),
    fill: el("sentiment-fill"),
  };

  // published for game.js
  const sentiment = { score: 0, expression: "neutral", confidence: 0, active: false };
  window.faceSentiment = sentiment;

  let raf = null;
  let stream = null;
  let modelsReady = false;
  let amber = "#ffa028";
  let upCol = "#26d07c";
  let downCol = "#f6465d";

  function setState(text) {
    if (dom.state) dom.state.textContent = text;
  }

  function showMessage(msg) {
    if (!dom.status) return;
    dom.status.classList.remove("hidden");
    dom.status.innerHTML = `<p class="feed-msg">${msg}</p>`;
  }

  async function loadModels() {
    if (modelsReady) return true;
    if (typeof faceapi === "undefined") {
      setState("NO ENGINE");
      showMessage("FACE ENGINE FAILED TO LOAD");
      return false;
    }
    setState("LOADING");
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      modelsReady = true;
      return true;
    } catch (e) {
      console.error("model load failed", e);
      setState("MODEL ERR");
      showMessage("COULD NOT LOAD MODELS — CHECK CONNECTION");
      return false;
    }
  }

  async function startCamera() {
    amber = css("--amber") || amber;
    upCol = css("--up") || upCol;
    downCol = css("--down") || downCol;

    if (!(await loadModels())) return;

    setState("CAMERA…");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
    } catch (e) {
      console.error("camera error", e);
      setState("NO CAMERA");
      showMessage(
        e && e.name === "NotAllowedError"
          ? "CAMERA BLOCKED — ALLOW ACCESS AND RELOAD"
          : "NO CAMERA AVAILABLE"
      );
      return;
    }

    dom.video.srcObject = stream;
    await new Promise((res) => {
      if (dom.video.readyState >= 2) return res();
      dom.video.addEventListener("loadeddata", res, { once: true });
    });
    dom.video.play().catch(() => {});

    if (dom.status) dom.status.classList.add("hidden");
    sentiment.active = true;
    setState("LIVE");
    loop();
  }

  function stopCamera() {
    sentiment.active = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (dom.video) dom.video.srcObject = null;
  }

  function computeSentiment(expr) {
    let pos = 0;
    let neg = 0;
    POSITIVE.forEach((k) => (pos += expr[k] || 0));
    NEGATIVE.forEach((k) => (neg += expr[k] || 0));
    return Math.max(-1, Math.min(1, pos - neg));
  }

  function dominant(expr) {
    let name = "neutral";
    let conf = 0;
    for (const k in expr) {
      if (expr[k] > conf) {
        conf = expr[k];
        name = k;
      }
    }
    return { name, conf };
  }

  function render(result, w, h) {
    const ctx = dom.canvas.getContext("2d");
    if (dom.canvas.width !== w) dom.canvas.width = w;
    if (dom.canvas.height !== h) dom.canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    if (!result) return;

    const resized = faceapi.resizeResults(result, { width: w, height: h });
    // detection box
    const b = resized.detection.box;
    ctx.strokeStyle = amber;
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.y, b.width, b.height);
    // 68 landmark points
    ctx.fillStyle = amber;
    for (const p of resized.landmarks.positions) {
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
  }

  function updateReadout(d, score) {
    if (dom.exprName) dom.exprName.textContent = d ? d.name : "—";
    if (dom.exprConf) dom.exprConf.textContent = d ? Math.round(d.conf * 100) + "%" : "—";
    if (dom.confBar) dom.confBar.style.setProperty("--fill", (d ? d.conf * 100 : 0) + "%");
    const s = score || 0;
    if (dom.score) {
      dom.score.textContent = (s >= 0 ? "+" : "") + s.toFixed(2);
      dom.score.style.color = s > 0.08 ? upCol : s < -0.08 ? downCol : amber;
    }
    if (dom.fill) {
      const pct = Math.abs(s) * 50; // half-width meter
      dom.fill.style.width = pct + "%";
      if (s >= 0) {
        dom.fill.style.left = "50%";
        dom.fill.style.right = "auto";
        dom.fill.style.background = upCol;
      } else {
        dom.fill.style.left = "auto";
        dom.fill.style.right = "50%";
        dom.fill.style.background = downCol;
      }
    }
  }

  async function loop() {
    if (!sentiment.active) return;
    const v = dom.video;
    const feedW = dom.feed.clientWidth;
    const feedH = dom.feed.clientHeight;

    if (v.readyState === 4 && feedW > 0) {
      const result = await faceapi
        .detectSingleFace(v, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      render(result, feedW, feedH);

      if (result) {
        const d = dominant(result.expressions);
        const score = computeSentiment(result.expressions);
        sentiment.score = score;
        sentiment.expression = d.name;
        sentiment.confidence = d.conf;
        updateReadout(d, score);
        setState("LIVE");
      } else {
        sentiment.score = 0;
        sentiment.expression = "none";
        sentiment.confidence = 0;
        updateReadout(null, 0);
        setState("NO FACE");
      }
    }
    raf = requestAnimationFrame(loop);
  }

  // wire up
  if (dom.startBtn) dom.startBtn.addEventListener("click", startCamera);
  window.addEventListener("pagehide", stopCamera);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && !stream) return;
  });

  // optional auto-start (used when embedded behind the site's consent gate)
  const params = new URLSearchParams(location.search);
  if (params.get("autostart") === "1") {
    // a frame for layout to settle, then start
    window.addEventListener("load", () => setTimeout(startCamera, 150));
  }

  window.emotionEngine = { start: startCamera, stop: stopCamera };
})();
