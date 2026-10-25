import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";

const BASE_URL = "http://localhost:3100";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  console.log("🎿 Testing Wok & Skis in Headless Chrome...");

  const cdpPort = 9400 + Math.floor(Math.random() * 500);
  const profileDir = `/tmp/chrome-ski-${Date.now()}`;
  fs.mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${cdpPort}`,
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${profileDir}`,
      "--window-size=1280,800",
    ],
    { stdio: "ignore" }
  );

  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
        if (res.ok) {
          ready = true;
          break;
        }
      } catch {
        // waiting
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(ready, "Chrome CDP port must be accessible");

    const targetsRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();
    const consoleLogs = [];
    const pageErrors = [];

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        consoleLogs.push(msg.params);
      }
      if (msg.method === "Runtime.exceptionThrown") {
        pageErrors.push(msg.params);
      }
    };

    await new Promise((r) => (ws.onopen = r));

    const send = (method, params = {}) =>
      new Promise((res) => {
        const msgId = id++;
        callbacks.set(msgId, (response) => res(response.result));
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });

    await send("Page.enable");
    await send("Runtime.enable");

    // Navigate to /ski
    console.log(`  Navigating to ${BASE_URL}/ski...`);
    await send("Page.navigate", { url: `${BASE_URL}/ski` });
    await new Promise((r) => setTimeout(r, 2200));

    // Verify title and canvas
    const titleRes = await send("Runtime.evaluate", { expression: "document.title", returnByValue: true });
    const docTitle = titleRes.result?.value;
    console.log(`  Document Title: "${docTitle}"`);
    assert.ok(docTitle && docTitle.includes("Wok & Skis"), "Title must include Wok & Skis");

    const hasCanvasRes = await send("Runtime.evaluate", {
      expression: "!!document.querySelector('canvas')",
      returnByValue: true,
    });
    console.log(`  Three.js Canvas rendered: ${hasCanvasRes.result?.value}`);
    assert.ok(hasCanvasRes.result?.value, "Three.js canvas must exist");

    // Check Start Modal
    const modalTextRes = await send("Runtime.evaluate", {
      expression: "document.body.innerText",
      returnByValue: true,
    });
    assert.ok(modalTextRes.result?.value.includes("WOK & SKIS"), "Start modal must be visible");
    assert.ok(modalTextRes.result?.value.includes("DROP IN & FIRE THE WOK"), "Start button must be visible");
    console.log("  ✓ Start Modal verified.");

    // Click Start Button
    console.log("  Clicking 'DROP IN & FIRE THE WOK'...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('DROP IN'));
          if (btn) btn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Verify Active Skiing
    const activeTextRes = await send("Runtime.evaluate", {
      expression: "document.body.innerText.toLowerCase()",
      returnByValue: true,
    });
    const activeText = activeTextRes.result?.value || "";
    console.log("  Active Text Sample:", activeText.slice(0, 150));
    assert.ok(activeText.includes("wok hei"), "HUD must show Wok Hei");
    assert.ok(activeText.includes("burn risk"), "HUD must show Burn Risk");
    console.log("  ✓ Game started and active HUD verified.");

    // Press Space to toss
    console.log("  Pressing Spacebar to toss wok...");
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "Space", key: " " });
    await send("Input.dispatchKeyEvent", { type: "keyUp", code: "Space", key: " " });
    await new Promise((r) => setTimeout(r, 600));

    // Steer left and right
    console.log("  Steering left and right...");
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "KeyA", key: "a" });
    await new Promise((r) => setTimeout(r, 600));
    await send("Input.dispatchKeyEvent", { type: "keyUp", code: "KeyA", key: "a" });

    // Capture screenshot
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync("audit/screenshots/wok_and_skis_live.png", Buffer.from(shot.data, "base64"));
    console.log("  📸 Saved screenshot: audit/screenshots/wok_and_skis_live.png");

    // Check errors
    const errs = pageErrors;
    const consoleErrors = consoleLogs.filter((l) => l.type === "error");
    console.log(`  Runtime Exceptions: ${errs.length}`);
    console.log(`  Console Errors: ${consoleErrors.length}`);
    assert.equal(errs.length, 0, "Zero runtime exceptions required");
    assert.equal(consoleErrors.length, 0, "Zero console errors required");

    console.log("🎉 WOK & SKIS VERIFICATION PASSED 100%!");
    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
