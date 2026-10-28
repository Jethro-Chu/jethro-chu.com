// Run against `npm run dev -- -p 3100`.
// The first impact uses real input only. Later named scenarios use a
// development-only placement hook, then the real collision and render loop.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const port = 9600 + Math.floor(Math.random() * 300);
const profile = await mkdtemp(path.join(os.tmpdir(), "ski-crash-test-"));
const shots = process.env.SKI_CRASH_SHOTS || path.join(os.tmpdir(), "ski-crash-shots");
await mkdir(shots, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", `--user-data-dir=${profile}`,
], { stdio: "ignore" });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ws;
try {
  let target;
  for (let i = 0; i < 150; i++) {
    try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:3100/ski`, { method: "PUT" })).json(); break; } catch { await sleep(400); }
  }
  assert.ok(target, "Chrome did not start");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 0;
  const pending = new Map(), errors = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id) { const callback = pending.get(message.id); pending.delete(message.id); callback?.(message); }
    else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push(message.params.args.map((a) => a.value || a.description).join(" "));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (m) => m.error ? reject(new Error(m.error.message)) : resolve(m.result));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression, label, timeout = 120000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) { const value = await evaluate(expression); if (value) return value; await sleep(100); }
    throw new Error(`Timed out waiting for ${label}`);
  };
  const screenshot = async (name) => { const image = await send("Page.captureScreenshot", { format: "png" }); await writeFile(path.join(shots, name), Buffer.from(image.data, "base64")); };
  const key = async (code, value) => { await send("Input.dispatchKeyEvent", { type: "keyDown", code, key: value }); await send("Input.dispatchKeyEvent", { type: "keyUp", code, key: value }); };
  const state = () => evaluate("window.__skiDev.getState()");
  const restart = async () => {
    await key("KeyR", "r");
    await waitFor("window.__skiDev.getState().phase === 'skiing'", "restart");
    assert.equal((await state()).retained, 300, "restart restores all rice");
  };
  await send("Runtime.enable"); await send("Page.enable"); await send("Page.bringToFront");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await waitFor("!!window.__skiDev && [...document.querySelectorAll('button')].some(b => b.textContent.includes('Start Skiing') && !b.disabled)", "ready screen");
  const button = await evaluate(`(() => { const r = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Start Skiing')).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...button });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", ...button, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...button, button: "left", clickCount: 1 });
  await waitFor("window.__skiDev.getState().phase === 'skiing'", "start");
  await screenshot("first-person.png");
  if (!process.env.SKI_CRASH_SCENARIOS_ONLY) {
    // Keep center: the first barrier knocks speed down, then the center rock is hit.
    await waitFor("window.__skiDev.getState().phase === 'crashing'", "real-input centerline crash");
    const observed = await state();
    assert.equal(observed.crash, "rock"); assert.equal(observed.retained, 0);
    console.log("PASS real-input rock collision and scattered rice:", observed);
    await screenshot("real-crash.png");
    await waitFor("window.__skiDev.getState().phase === 'failed'", "crash result");
    assert.ok((await evaluate("document.body.innerText")).includes("ROCK CRASH!"));
    await restart(); await screenshot("restart.png");
    console.log("PASS restart restores 300 grains");
  }
  for (const [type, heading] of [["pine", "TREE CRASH!"], ["log", "LOG CRASH!"], ["rock", "ROCK CRASH!"]]) {
    assert.equal(await evaluate(`window.__skiDev.approachObstacle(${JSON.stringify(type)})`), true);
    await waitFor(`window.__skiDev.getState().phase === 'crashing' && window.__skiDev.getState().crash === ${JSON.stringify(type)}`, `${type} collision`);
    assert.equal((await state()).retained, 0);
    await screenshot(`${type}-crash.png`);
    await waitFor("window.__skiDev.getState().phase === 'failed'", `${type} result`);
    assert.ok((await evaluate("document.body.innerText")).includes(heading));
    console.log(`PASS developer scenario: ${type} collision, scattered rice, and result`);
    await restart();
  }
  assert.equal(await evaluate("window.__skiDev.approachObstacle('pine')"), true);
  await waitFor("window.__skiDev.getState().phase === 'crashing'", "restart during crash");
  await restart();
  await sleep(2500);
  assert.equal((await state()).phase, "skiing", "old crash must not end the restarted run");
  assert.equal((await state()).retained, 300);
  console.log("PASS restart during crash cancels the old result and restores the rig");
  assert.deepEqual(errors, []); console.log("PASS no browser errors; screenshots:", shots);
} finally {
  ws?.close(); chrome.kill(); await sleep(1000); await rm(profile, { recursive: true, force: true });
}
