// Run against a development server: npm run dev -- -p 3100, then node scripts/test-wok-browser.mjs.
// Scenario setup uses development-only hooks; clicks and keypresses use Chrome input events.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const port = 9500 + Math.floor(Math.random() * 500);
const profile = await mkdtemp(path.join(os.tmpdir(), "wok-browser-"));
const shots = process.env.WOK_SHOTS || path.join(os.tmpdir(), "wok-shots");
await mkdir(shots, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-first-run", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", `--user-data-dir=${profile}`,
], { stdio: "ignore" });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ws;
try {
  let target;
  for (let i = 0; i < 150; i++) {
    try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:3100/ski`, { method: "PUT" })).json(); break; } catch { await delay(400); }
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
  const waitFor = async (expression, label, timeout = 45000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) { const value = await evaluate(expression); if (value) return value; await delay(150); }
    throw new Error(`Timed out waiting for ${label}`);
  };
  const key = async (code, keyValue = code) => { await send("Input.dispatchKeyEvent", { type: "keyDown", code, key: keyValue }); await send("Input.dispatchKeyEvent", { type: "keyUp", code, key: keyValue }); };
  const click = async (selector) => {
    const rect = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}); if(!e)return null; const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    assert.ok(rect, `Missing ${selector}`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...rect });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...rect, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...rect, button: "left", clickCount: 1 });
  };
  const screenshot = async (name) => { const image = await send("Page.captureScreenshot", { format: "png" }); await writeFile(path.join(shots, name), Buffer.from(image.data, "base64")); };
  const snapshot = () => evaluate("window.__wokTest.snapshot()");
  const setup = (name) => evaluate(`window.__wokTest.prepare(${JSON.stringify(name)})`);
  await send("Runtime.enable"); await send("Page.enable"); await send("Page.bringToFront");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await waitFor("window.__wokTest && [...document.querySelectorAll('button')].some(b=>b.textContent.includes('DROP IN'))", "initialized title");
  assert.equal(await evaluate("document.title"), "Wok & Skis · Jethro Chu");
  await screenshot("title.png");
  await click('button[aria-label="Start game"]');
  await waitFor("!document.body.innerText.includes('DROP IN & FIRE THE WOK') && /DISTANCE\\s+[1-9]/.test(document.body.innerText)", "click-only start and movement");
  console.log("PASS click-only start and movement");
  await screenshot("mid-run.png");
  await click('button[aria-label="Mute sound"]');
  await waitFor("!!document.querySelector('[aria-label=\"Unmute sound\"]')", "mute");
  await click('button[aria-label="Unmute sound"]');
  await waitFor("!!document.querySelector('[aria-label=\"Mute sound\"]')", "unmute");
  console.log("PASS mute and unmute");
  await key("KeyR", "r");
  await waitFor("window.__wokTest.snapshot().served === 0 && window.__wokTest.snapshot().ingredients === 6", "restart");
  console.log("PASS R restart");
  await setup("chili"); await waitFor("window.__wokTest.snapshot().turbo", "chili turbo");
  console.log("PASS developer scenario: chili pickup", await snapshot());
  await setup("food"); await waitFor("window.__wokTest.snapshot().ingredients === 6", "food refill");
  console.log("PASS developer scenario: food pickup refills lost ingredient", await snapshot());
  await setup("mogul"); await waitFor("!window.__wokTest.snapshot().grounded", "mogul launch");
  const before = await snapshot(); await key("Space", " ");
  await waitFor(`window.__wokTest.snapshot().score >= ${before.score + 1000}`, "aerial toss");
  console.log("PASS developer scenario: mogul and aerial toss", await snapshot());
  const ingredients = (await snapshot()).ingredients;
  await setup("burn"); await waitFor(`window.__wokTest.snapshot().ingredients < ${ingredients}`, "burn");
  console.log("PASS developer scenario: heat burns ingredient", await snapshot());
  await setup("serve"); await key("Space", " "); await waitFor("window.__wokTest.snapshot().served === 1 && window.__wokTest.snapshot().shield", "serve and shield");
  await screenshot("serve.png");
  const afterServe = await snapshot(); await setup("shieldCrash");
  await waitFor("document.body.innerText.includes('SHIELD blocked') || document.body.innerText.includes('SHIELD BLOCKED')", "shield collision");
  assert.equal((await snapshot()).ingredients, afterServe.ingredients);
  console.log("PASS developer scenario: serve and shield blocks crash", await snapshot());
  await key("KeyR", "r"); await waitFor("!window.__wokTest.snapshot().shield", "restart after serve");
  await setup("crashEmpty"); await waitFor("document.body.innerText.includes('WOK EMPTY!')", "empty wok after crash");
  console.log("PASS developer scenario: empty-wok game over after crash");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await waitFor("innerWidth === 390 && !!document.querySelector('canvas')", "resize");
  console.log("PASS resize to 390 x 844");
  await key("KeyR", "r"); await waitFor("!document.body.innerText.includes('WOK EMPTY!')", "restart after game over");
  await click('a[href="/"]'); await waitFor("location.pathname === '/'", "back to portfolio");
  await send("Page.navigate", { url: "http://localhost:3100/ski" });
  await waitFor("window.__wokTest && document.body.innerText.includes('DROP IN & FIRE THE WOK')", "return to ski");
  console.log("PASS navigation away and back");
  assert.deepEqual(errors, []); console.log("PASS no console errors or exceptions");
  console.log(`Screenshots: ${shots}`);
} finally {
  ws?.close(); chrome.kill(); await delay(1000); await rm(profile, { recursive: true, force: true });
}
