import assert from "node:assert/strict";

// Run against a production build: node scripts/verify-site-routes.mjs [origin]
// Follow only the hosting provider's domain normalization before checking paths.
const input = new URL(process.argv[2] ?? "http://localhost:3100");
const entry = await fetch(input);
assert.equal(new URL(entry.url).pathname, "/", "The homepage must not redirect to the village.");
const origin = new URL(entry.url).origin;

async function page(path) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  assert.equal(response.status, 200, `${path} must render directly.`);
  assert.equal(response.headers.get("location"), null, `${path} must not redirect.`);
  return response.text();
}

const [portfolio, village] = await Promise.all([page("/"), page("/website")]);
assert(portfolio.includes("Begin the climb"), "The scrolling portfolio must be at /.");
assert(portfolio.includes('id="hero-name"'));
assert(portfolio.includes(">Portfolio</p>"), "The homepage subtitle must be Portfolio.");
assert(!portfolio.includes("Enable eye scrolling"));
assert(!portfolio.includes("Nursing student who builds software between clinical shifts."));
assert(!portfolio.includes("loading the village"), "The homepage must not mount the village.");
assert(village.includes("The valley") && village.includes("loading the village"));
assert(!village.includes("Begin the climb"));

for (const [html, path] of [[portfolio, "/"], [village, "/website"]]) {
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  assert.equal(new URL(canonical).pathname, path, `${path} canonical URL`);
  assert.equal(new URL(ogUrl).pathname, path, `${path} Open Graph URL`);
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const person = JSON.parse(json);
  assert.equal(new URL(person.subjectOf[0].url).pathname, "/website");
  assert.equal(new URL(person.subjectOf[0].url).hash, "#chapel");
}

for (const [alias, target] of [["/portfolio", "/"], ["/valley", "/website"], ["/village", "/website"]]) {
  const response = await fetch(new URL(alias, origin), { redirect: "manual" });
  assert.equal(response.status, 308, alias);
  assert.equal(new URL(response.headers.get("location"), origin).pathname, target, alias);
  await page(target); // Canonical destinations render, so these cannot form loops.
}

for (const path of ["/images/halfdome-summit.jpg", "/images/hacktech-team.jpg", "/images/outdoor-hiking.jpg", "/images/marathon-training.jpg", "/game/jethro/player.png", "/game/ninja-adventure/tilesets/TilesetFloor.png", "/Jethro_Chu_Resume.pdf"]) {
  const response = await fetch(new URL(path, origin), { method: "HEAD", redirect: "manual" });
  assert.equal(response.status, 200, path);
}

const sitemap = await page("/sitemap.xml");
assert(sitemap.includes("<loc>https://jethrochu.com</loc>"));
assert(sitemap.includes("<loc>https://jethrochu.com/website</loc>"));
const resume = await page("/resume");
assert(resume.includes('href="/#projects"') && !resume.includes('href="/website"'));
for (const path of ["/projects/nursejet", "/projects/emotion-stock-market-game"]) {
  const html = await page(path);
  assert(html.includes('href="/#projects"'), `${path} must return to the scrolling projects.`);
}

console.log(`Route checks passed at ${origin}: direct pages, canonical URLs, legacy aliases, sitemap, photos, game assets, PDF, and portfolio return links.`);
