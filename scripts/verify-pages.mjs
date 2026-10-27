// Run only with the real URL returned by deploy-pages; a generated URL is not proof.
const address = process.env.GAME_URL;
if (!address || new URL(address).protocol !== "https:") {
  throw new Error("GAME_URL must be the actual HTTPS deployment URL.");
}
const base = new URL(address.endsWith("/") ? address : `${address}/`);
async function get(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response;
}
async function verify() {
  const html = await (await get(base)).text();
  if (!html.includes('id="root"'))
    throw new Error("The URL is not the game app shell.");
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(
    (m) => new URL(m[1], base),
  );
  if (!scripts.length)
    throw new Error("No application script in published HTML.");
  for (const url of scripts) await get(url);
  const manifestUrl = new URL("manifest.webmanifest", base);
  const manifest = await (await get(manifestUrl)).json();
  if (manifest.display !== "standalone" || manifest.orientation !== "portrait")
    throw new Error("Invalid game PWA manifest.");
  if (new URL(manifest.start_url, manifestUrl).pathname !== base.pathname)
    throw new Error("Wrong PWA start_url base.");
  for (const icon of manifest.icons) {
    const bytes = new Uint8Array(
      await (await get(new URL(icon.src, manifestUrl))).arrayBuffer(),
    );
    if (bytes[0] !== 137 || bytes[1] !== 80)
      throw new Error("PWA icon is not PNG.");
  }
  const worker = await (await get(new URL("sw.js", base))).text();
  if (!worker.includes("precacheAndRoute"))
    throw new Error("Service worker missing precache.");
  console.log(
    `Verified published game, JS, manifest, PNG icons and service worker: ${base}`,
  );
  console.log(
    "Android physical-device installation still needs a device check.",
  );
}
let failure;
for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    await verify();
    process.exit(0);
  } catch (error) {
    failure = error;
    console.log(`Published URL verification ${attempt}/6: ${error.message}`);
    if (attempt < 6) await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
throw failure;
