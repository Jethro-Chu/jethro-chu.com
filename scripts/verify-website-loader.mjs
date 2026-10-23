// Run against a local dev or production server:
// WEBSITE_URL=http://localhost:3000 node scripts/verify-website-loader.mjs
// Requires Playwright (or PLAYWRIGHT_MODULE pointing to its index.mjs).
import assert from "node:assert/strict";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.WEBSITE_URL || "http://localhost:3000";
const browser = await chromium.launch({ headless: true });

async function check(name, setup, verify, play = true) {
  const page = await browser.newPage();
  const errors = [];
  const diagnostics = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.text().includes("[village]")) diagnostics.push(message.text());
  });
  try {
    await setup(page);
    await page.goto(`${origin}/website`, { waitUntil: "domcontentloaded" });
    if (play) await page.getByRole("button", { name: "PLAY", exact: true }).click();
    await verify(page, diagnostics);
    assert.deepEqual(errors, [], `${name}: uncaught browser errors`);
    console.log(`PASS ${name}`);
  } finally {
    await page.close();
  }
}

const playable = async (page) => {
  await page.getByRole("button", { name: "LOADING…", exact: true }).waitFor({ state: "detached", timeout: 6500 });
  await page.getByText("Yosemite Village", { exact: true }).waitFor();
  assert.equal(await page.locator("canvas").count(), 1);
};
const recovered = async (page) => {
  await page.getByRole("button", { name: "Enter the village", exact: true }).waitFor({ timeout: 6500 });
  await page.getByRole("heading", { name: "The valley", exact: true }).waitFor();
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
};

try {
  const scripts = [];
  let phaserChunkPath;
  await check("direct entry", async (page) => {
    page.on("response", (response) => {
      if (response.request().resourceType() === "script") scripts.push(response);
    });
  }, async (page) => {
    await playable(page);
    for (const response of scripts) {
      if ((await response.text()).includes("[village] Phaser boot failed")) {
        phaserChunkPath = new URL(response.url()).pathname;
      }
    }
    assert(phaserChunkPath, "Locate the real game chunk for failure tests");
  });
  await check("optional image 404", async (page) => {
    await page.route("**/Fog.png", (route) => route.fulfill({ status: 404, body: "missing" }));
  }, async (page, logs) => {
    await playable(page);
    assert(logs.some((line) => line.includes("Failed asset: /game/ninja-adventure/fx/Fog.png")));
  });
  await check("optional image decode failure", async (page) => {
    await page.route("**/Fog.png", (route) => route.fulfill({ contentType: "image/png", body: "invalid PNG" }));
  }, async (page, logs) => {
    await playable(page);
    assert(logs.some((line) => line.includes("Could not decode /game/ninja-adventure/fx/Fog.png")));
  });
  await check("stalled optional request", async (page) => {
    await page.route("**/Fog.png", () => {});
  }, async (page, logs) => {
    await playable(page);
    assert(logs.some((line) => line.includes("Failed asset: /game/ninja-adventure/fx/Fog.png")));
  });
  await check("required tileset failure", async (page) => {
    await page.route("**/TilesetFloor.png", (route) => route.fulfill({ status: 404, body: "missing" }));
  }, async (page, logs) => {
    await recovered(page);
    assert(logs.some((line) => line.includes("Missing required assets")));
    // Recovering also offers a fresh mount once the asset becomes available.
    await page.unroute("**/TilesetFloor.png");
    await page.getByRole("button", { name: "Enter the village", exact: true }).click();
    await page.getByRole("button", { name: "PLAY", exact: true }).click();
    await playable(page);
  }, false);
  await check("scene initialization exception", async (page) => {
    await page.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.createRadialGradient;
      CanvasRenderingContext2D.prototype.createRadialGradient = function (...args) {
        if (args[5] > 400) throw new Error("injected scene failure");
        return original.apply(this, args);
      };
    });
  }, async (page, logs) => {
    await recovered(page);
    assert(logs.some((line) => line.includes("injected scene failure")));
  }, false);
  await check("missing image processing events: five second failsafe", async (page) => {
    await page.addInitScript(() => {
      const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
      Object.defineProperty(HTMLImageElement.prototype, "src", {
        ...src,
        set(value) { if (!value.startsWith("blob:")) src.set.call(this, value); },
      });
    });
  }, async (page, logs) => {
    await recovered(page);
    assert(logs.some((line) => line.includes("Initialization exceeded 5000ms")));
  }, false);

  for (const failChunk of [true, false]) {
    const page = await browser.newPage();
    const logs = [];
    page.on("console", (message) => logs.push(message.text()));
    await page.route(`**${phaserChunkPath}`, (route) => {
      if (failChunk) return route.fulfill({ status: 404, body: "missing chunk" });
      // Intentionally leave the request pending to exercise the outer deadline.
    });
    await page.goto(`${origin}/website`, { waitUntil: "domcontentloaded" });
    await recovered(page);
    assert(logs.some((line) => line.includes(failChunk ? "Interactive layer failed" : "Initialization exceeded 5000ms")));
    console.log(`PASS ${failChunk ? "rejected" : "stalled"} dynamic game chunk`);
    await page.close();
  }

  const page = await browser.newPage();
  await page.goto(origin);
  const documentId = await page.evaluate(() => (window.__loaderTestDocument = Math.random()));
  await page.getByRole("link", { name: /Enter Yosemite Village/ }).click();
  await page.getByRole("button", { name: "PLAY", exact: true }).click();
  await playable(page);
  assert.equal(await page.evaluate(() => window.__loaderTestDocument), documentId, "entrance uses client navigation");
  await page.goBack();
  await page.getByRole("link", { name: /Enter Yosemite Village/ }).click();
  await page.getByRole("button", { name: "PLAY", exact: true }).click();
  await playable(page);
  await page.reload();
  await page.getByRole("button", { name: "PLAY", exact: true }).click();
  await playable(page);
  console.log("PASS main-site client navigation, back/re-entry and warm-cache reload");
  await page.close();
} finally {
  await browser.close();
}
