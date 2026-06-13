/* ============================================================
   MARKET PULSE TERMINAL — market sim, candlestick chart,
   portfolio, events, sentiment-biased drift. Vanilla JS.
   ============================================================ */

(function () {
  "use strict";

  const css = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const COL = {
    amber: css("--amber") || "#ffa028",
    up: css("--up") || "#26d07c",
    down: css("--down") || "#f6465d",
    line: css("--line") || "#262626",
    panel: css("--panel") || "#0d0d0d",
    muted: css("--muted") || "#8a8a8a",
    text: css("--text") || "#e8e8e8",
  };

  const START_CASH = 100000;
  const GOAL = 1000000;
  const TICK_MS = 1200;
  const HISTORY = 240;
  const BASE_TIME = Math.floor(Date.now() / 1000) - HISTORY * 60;

  // ---- helpers ----
  const usd = (n) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const usd0 = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
  let gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // ---- stocks ----
  const STOCKS = [
    { sym: "NVDA", name: "NVIDIA", price: 118, drift: 0.0006, vol: 0.022 },
    { sym: "AAPL", name: "Apple", price: 228, drift: 0.0003, vol: 0.013 },
    { sym: "TSLA", name: "Tesla", price: 250, drift: 0.0004, vol: 0.028 },
    { sym: "MSFT", name: "Microsoft", price: 430, drift: 0.0003, vol: 0.012 },
    { sym: "AMZN", name: "Amazon", price: 186, drift: 0.0004, vol: 0.016 },
    { sym: "GOOGL", name: "Alphabet", price: 168, drift: 0.0003, vol: 0.015 },
  ];

  const state = {
    tick: HISTORY,
    cash: START_CASH,
    holdings: {}, // sym -> { qty, avg }
    selected: "NVDA",
    recessionUntil: 0,
    lastAuto: 0,
    muted: true,
    hiScore: Number(localStorage.getItem("mp_hiscore") || START_CASH),
  };

  // per-stock candle history
  const data = {};
  STOCKS.forEach((s) => {
    data[s.sym] = { candles: [], last: s.price, prevClose: s.price, dayOpen: s.price };
    seed(s);
  });

  function seed(s) {
    let price = s.price * (0.9 + Math.random() * 0.2);
    const d = data[s.sym];
    for (let i = 0; i < HISTORY; i++) {
      const open = price;
      const ret = s.drift + s.vol * gauss();
      const close = Math.max(0.5, open * (1 + ret));
      const high = Math.max(open, close) * (1 + Math.random() * s.vol * 0.6);
      const low = Math.min(open, close) * (1 - Math.random() * s.vol * 0.6);
      d.candles.push({ time: BASE_TIME + i * 60, open, high, low, close });
      price = close;
    }
    d.last = price;
    d.dayOpen = d.candles[0].close;
    d.prevClose = price;
  }

  // ---- DOM ----
  const el = (id) => document.getElementById(id);
  const rowsEl = el("watchlist-rows");
  const holdRowsEl = el("holdings-rows");
  const tickTrack = el("tick-track");
  let chart, candleSeries, maSeries, maVisible = true;

  // ---- chart ----
  function initChart() {
    if (typeof LightweightCharts === "undefined") return;
    chart = LightweightCharts.createChart(el("chart"), {
      autoSize: true,
      layout: { background: { type: "solid", color: COL.panel }, textColor: COL.muted, fontFamily: "JetBrains Mono, monospace", fontSize: 10 },
      grid: { vertLines: { color: "#141414" }, horzLines: { color: "#141414" } },
      rightPriceScale: { borderColor: COL.line },
      timeScale: { borderColor: COL.line, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0, vertLine: { color: COL.line, labelBackgroundColor: COL.amber }, horzLine: { color: COL.line, labelBackgroundColor: COL.amber } },
    });
    candleSeries = chart.addCandlestickSeries({
      upColor: COL.up, downColor: COL.down,
      borderUpColor: COL.up, borderDownColor: COL.down,
      wickUpColor: COL.up, wickDownColor: COL.down,
    });
    maSeries = chart.addLineSeries({ color: COL.amber, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    selectStock(state.selected, true);
  }

  function maData(candles) {
    const period = 20;
    const out = [];
    for (let i = period - 1; i < candles.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
      out.push({ time: candles[i].time, value: sum / period });
    }
    return out;
  }

  function selectStock(sym, force) {
    if (!force && state.selected === sym) return;
    state.selected = sym;
    const d = data[sym];
    if (candleSeries) {
      candleSeries.setData(d.candles);
      maSeries.setData(maData(d.candles));
      chart.timeScale().fitContent();
    }
    el("chart-symbol").textContent = sym;
    el("sel-symbol").textContent = sym;
    renderWatchlist();
    updateChartHeader();
  }

  function updateChartHeader() {
    const d = data[state.selected];
    const chg = d.last - d.dayOpen;
    const chgp = (chg / d.dayOpen) * 100;
    el("chart-last").textContent = usd(d.last);
    const chgEl = el("chart-chg");
    chgEl.textContent = (chg >= 0 ? "+" : "") + chg.toFixed(2) + " (" + pct(chgp) + ")";
    chgEl.className = "mono " + (chg >= 0 ? "up" : "down");
  }

  // ---- watchlist ----
  function renderWatchlist() {
    rowsEl.innerHTML = STOCKS.map((s) => {
      const d = data[s.sym];
      const chg = d.last - d.dayOpen;
      const chgp = (chg / d.dayOpen) * 100;
      const cls = chg >= 0 ? "up" : "down";
      return `<tr data-sym="${s.sym}" class="${s.sym === state.selected ? "sel" : ""}">
        <td class="l sym">${s.sym}</td>
        <td class="r mono" data-cell="last">${usd(d.last)}</td>
        <td class="r mono ${cls}">${(chg >= 0 ? "+" : "") + chg.toFixed(2)}</td>
        <td class="r mono ${cls}">${pct(chgp)}</td>
      </tr>`;
    }).join("");
  }

  function flashCell(sym, dir) {
    const tr = rowsEl.querySelector(`tr[data-sym="${sym}"]`);
    if (!tr) return;
    const cell = tr.querySelector('[data-cell="last"]');
    if (!cell) return;
    cell.classList.remove("flash-up", "flash-down");
    void cell.offsetWidth; // restart animation
    cell.classList.add(dir > 0 ? "flash-up" : "flash-down");
  }

  // ---- portfolio ----
  function netValue() {
    let v = state.cash;
    for (const sym in state.holdings) v += state.holdings[sym].qty * data[sym].last;
    return v;
  }

  function renderPortfolio() {
    const nv = netValue();
    const pnl = nv - START_CASH;
    el("cash").textContent = usd(state.cash);
    el("net-value").textContent = usd(nv);
    const pnlEl = el("pnl");
    pnlEl.textContent = (pnl >= 0 ? "+" : "") + usd(Math.abs(pnl)).replace("$", "$");
    pnlEl.className = "v mono " + (pnl >= 0 ? "up" : "down");

    const progress = Math.max(0, Math.min(100, (nv / GOAL) * 100));
    el("goal-fill").style.width = progress + "%";
    el("goal-text").textContent = usd0(nv) + " / " + usd0(GOAL);

    if (nv > state.hiScore) {
      state.hiScore = nv;
      localStorage.setItem("mp_hiscore", String(Math.round(nv)));
    }
    el("hiscore").textContent = "HI " + usd0(state.hiScore);

    const keys = Object.keys(state.holdings);
    if (!keys.length) {
      holdRowsEl.innerHTML = `<tr><td colspan="5" class="empty">NO POSITIONS</td></tr>`;
      return;
    }
    holdRowsEl.innerHTML = keys.map((sym) => {
      const h = state.holdings[sym];
      const mkt = data[sym].last;
      const pl = (mkt - h.avg) * h.qty;
      const cls = pl >= 0 ? "up" : "down";
      return `<tr data-sym="${sym}">
        <td class="l sym">${sym}</td>
        <td class="r mono">${h.qty}</td>
        <td class="r mono">${usd(h.avg)}</td>
        <td class="r mono">${usd(mkt)}</td>
        <td class="r mono ${cls}">${(pl >= 0 ? "+" : "") + usd(Math.abs(pl)).replace("$", "$")}</td>
      </tr>`;
    }).join("");
  }

  function buy(qty) {
    const sym = state.selected;
    const price = data[sym].last;
    const cost = qty * price;
    if (qty <= 0 || cost > state.cash) {
      alertMsg(`INSUFFICIENT FUNDS — ${sym}`, "info");
      return;
    }
    state.cash -= cost;
    const h = state.holdings[sym];
    if (h) {
      const tq = h.qty + qty;
      h.avg = (h.avg * h.qty + cost) / tq;
      h.qty = tq;
    } else {
      state.holdings[sym] = { qty, avg: price };
    }
    blip(660);
    renderPortfolio();
  }

  function sell(qty) {
    const sym = state.selected;
    const h = state.holdings[sym];
    if (!h || h.qty === 0) {
      alertMsg(`NO POSITION — ${sym}`, "info");
      return;
    }
    const q = Math.min(qty, h.qty);
    state.cash += q * data[sym].last;
    h.qty -= q;
    if (h.qty === 0) delete state.holdings[sym];
    blip(440);
    renderPortfolio();
  }

  // ---- events ----
  const EVENTS = [
    () => { // earnings
      const s = STOCKS[Math.floor(Math.random() * STOCKS.length)];
      const up = Math.random() > 0.45;
      const mag = 0.08 + Math.random() * 0.1;
      shock(s.sym, up ? 1 + mag : 1 - mag);
      alertMsg(`EARNINGS ${s.sym} ${up ? "BEAT" : "MISS"} ${pct((up ? mag : -mag) * 100)}`, up ? "info" : "info");
    },
    () => { // crash
      STOCKS.forEach((s) => shock(s.sym, 0.82 + Math.random() * 0.06));
      flashScreen("show-down");
      alertMsg("MARKET CRASH — BROAD SELLOFF", "crash");
      blip(180);
    },
    () => { // whale pump
      const s = STOCKS[Math.floor(Math.random() * STOCKS.length)];
      const mag = 0.15 + Math.random() * 0.15;
      shock(s.sym, 1 + mag);
      flashScreen("show-amber");
      alertMsg(`WHALE ALERT — ${s.sym} +${Math.round(mag * 100)}% BLOCK BUY`, "whale");
      blip(880);
    },
    () => { // recession
      state.recessionUntil = state.tick + 14;
      alertMsg("RECESSION WATCH — DRIFT TURNS NEGATIVE", "info");
    },
  ];

  function shock(sym, factor) {
    const d = data[sym];
    d.last = Math.max(0.5, d.last * factor);
  }

  function flashScreen(cls) {
    const f = el("flash");
    f.classList.add(cls);
    setTimeout(() => f.classList.remove(cls), 420);
  }

  let nextEvent = 16 + Math.floor(Math.random() * 18);
  function maybeEvent() {
    if (state.tick - HISTORY >= nextEvent) {
      EVENTS[Math.floor(Math.random() * EVENTS.length)]();
      nextEvent = state.tick - HISTORY + 14 + Math.floor(Math.random() * 22);
    }
  }

  // ---- ticker ----
  const alerts = [];
  function alertMsg(text, sev) {
    const t = new Date();
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    alerts.unshift({ time: `${hh}:${mm}`, text, sev: sev || "info" });
    if (alerts.length > 14) alerts.pop();
    renderTicker();
  }
  function renderTicker() {
    const items = alerts
      .map((a) => `<span class="tick-item"><span class="tick-time">${a.time}</span><span class="tick-sev-${a.sev}">${a.text}</span></span>`)
      .join("");
    tickTrack.innerHTML = items + items; // duplicate for seamless scroll
  }

  // ---- audio ----
  let actx = null;
  function blip(freq) {
    if (state.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.value = 0.04;
      o.connect(g).connect(actx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.12);
      o.stop(actx.currentTime + 0.13);
    } catch (e) { /* no-op */ }
  }

  // ---- main tick ----
  function step() {
    const sentiment = window.faceSentiment || { score: 0, active: false };
    const bias = sentiment.active ? sentiment.score * 0.004 : 0; // legible market bias
    const recession = state.tick < state.recessionUntil ? -0.0025 : 0;

    STOCKS.forEach((s) => {
      const d = data[s.sym];
      const open = d.last;
      const ret = s.drift + bias + recession + s.vol * gauss();
      const close = Math.max(0.5, open * (1 + ret));
      const high = Math.max(open, close) * (1 + Math.random() * s.vol * 0.5);
      const low = Math.min(open, close) * (1 - Math.random() * s.vol * 0.5);
      const candle = { time: BASE_TIME + state.tick * 60, open, high, low, close };
      d.candles.push(candle);
      if (d.candles.length > HISTORY + 600) d.candles.shift();
      d.prevClose = d.last;
      d.last = close;
      if (s.sym === state.selected && candleSeries) {
        candleSeries.update(candle);
        const md = maData(d.candles);
        if (md.length) maSeries.update(md[md.length - 1]);
      }
      flashCell(s.sym, close - open);
    });

    state.tick++;
    maybeEvent();
    autoTrade(sentiment);
    renderWatchlist();
    renderPortfolio();
    updateChartHeader();
  }

  function autoTrade(sentiment) {
    if (!el("auto-trade").checked || !sentiment.active) return;
    const now = Date.now();
    if (now - state.lastAuto < 2500) return;
    if (sentiment.score > 0.5 && sentiment.confidence > 0.6) {
      buy(Math.max(1, parseInt(el("qty").value) || 5));
      state.lastAuto = now;
      alertMsg(`AUTO-BUY ${state.selected} (SMILE)`, "info");
    } else if (sentiment.score < -0.5 && sentiment.confidence > 0.6) {
      sell(Math.max(1, parseInt(el("qty").value) || 5));
      state.lastAuto = now;
      alertMsg(`AUTO-SELL ${state.selected} (FROWN)`, "info");
    }
  }

  // ---- wiring ----
  function wire() {
    rowsEl.addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-sym]");
      if (tr) selectStock(tr.dataset.sym);
    });
    el("buy-btn").addEventListener("click", () => buy(Math.max(1, parseInt(el("qty").value) || 1)));
    el("sell-btn").addEventListener("click", () => sell(Math.max(1, parseInt(el("qty").value) || 1)));
    el("ma-toggle").addEventListener("click", (e) => {
      maVisible = !maVisible;
      maSeries.applyOptions({ visible: maVisible });
      e.currentTarget.setAttribute("aria-pressed", String(maVisible));
    });
    el("mute-btn").addEventListener("click", () => {
      state.muted = !state.muted;
      el("mute-label").textContent = state.muted ? "SOUND OFF" : "SOUND ON";
    });
    document.querySelectorAll(".fkey[data-target]").forEach((b) => {
      b.addEventListener("click", () => {
        const t = el(b.dataset.target);
        if (t) t.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
    // clock
    setInterval(() => {
      const t = new Date();
      el("clock").textContent = t.toTimeString().slice(0, 8);
    }, 1000);
  }

  // ---- boot ----
  function boot() {
    initChart();
    renderWatchlist();
    renderPortfolio();
    el("hiscore").textContent = "HI " + usd0(state.hiScore);
    alertMsg("TERMINAL ONLINE — TRADE WITH YOUR FACE", "info");
    wire();
    setInterval(step, TICK_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
