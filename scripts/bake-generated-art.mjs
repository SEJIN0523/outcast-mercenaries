// Atlas packing only: preserve model-generated RGBA pixels, trim alpha and scale nearest-neighbour.
import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
const specs = [
  {
    id: "warrior",
    rows: [0, 512, 1024],
    directions: [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
    ],
  },
  {
    id: "archer",
    rows: [0, 512, 1024],
    directions: [
      [0, 2, 1, 3],
      [0, 1, 2, 3],
    ],
  },
  {
    id: "mage",
    rows: [0, 512, 1024],
    directions: [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
    ],
  },
  {
    id: "priest",
    rows: [0, 512, 1024],
    directions: [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
    ],
  },
  {
    id: "guardian",
    rows: [0, 512, 1024],
    directions: [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
    ],
  },
  {
    id: "goblins",
    rows: [0, 340, 660, 1024],
    directions: [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
    ],
  },
];
const server = await createServer({
  server: { host: "127.0.0.1", port: 0 },
  clearScreen: false,
});
server.middlewares.use("/__bake", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end("<!doctype html><body>Atlas compiler</body>");
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(
    `http://127.0.0.1:${server.httpServer.address().port}/__bake`,
  );
  const result = await page.evaluate(async (specs) => {
    const make = (w, h) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    };
    const manifest = {
      version: 1,
      frame: { width: 64, height: 80, pivot: { x: 32, y: 74 } },
      directions: ["down", "left", "right", "up"],
      sheets: {},
    };
    const images = {};
    const preview = make(1024, 480),
      pv = preview.getContext("2d");
    pv.imageSmoothingEnabled = false;
    pv.fillStyle = "#202b32";
    pv.fillRect(0, 0, 1024, 480);
    let previewIndex = 0;
    for (const spec of specs) {
      const image = new Image();
      image.src = `/docs/art/sources/${spec.id}-v1.png`;
      await image.decode();
      const source = make(image.width, image.height),
        sc = source.getContext("2d", { willReadFrequently: true });
      sc.drawImage(image, 0, 0);
      const pixels = sc.getImageData(0, 0, image.width, image.height).data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 4)
        if (pixels[i] === 0) transparent++;
      if (transparent / (image.width * image.height) < 0.2)
        throw Error(spec.id + " needs true transparency");
      const atlas = make(256, (spec.rows.length - 1) * 80),
        ac = atlas.getContext("2d");
      ac.imageSmoothingEnabled = false;
      const boxes = [],
        rowsOfBounds = [];
      for (let row = 0; row < spec.rows.length - 1; row++) {
        const bounds = [];
        for (let col = 0; col < 4; col++) {
          let left = image.width,
            top = image.height,
            right = -1,
            bottom = -1;
          const x0 = Math.max(0, col * 384 - 64),
            x1 = Math.min(image.width, (col + 1) * 384 + 64),
            y0 = spec.rows[row],
            y1 = spec.rows[row + 1],
            rw = x1 - x0,
            rh = y1 - y0;
          const visited = new Uint8Array(rw * rh),
            queue = new Int32Array(rw * rh);
          let biggest = 0;
          for (let local = 0; local < rw * rh; local++) {
            if (visited[local]) continue;
            const px = x0 + (local % rw),
              py = y0 + Math.floor(local / rw);
            visited[local] = 1;
            if (pixels[(py * image.width + px) * 4 + 3] <= 32) continue;
            let head = 0,
              tail = 1,
              l = px,
              r = px,
              t = py,
              b = py;
            queue[0] = local;
            while (head < tail) {
              const n = queue[head++],
                nx = n % rw,
                ny = Math.floor(n / rw);
              l = Math.min(l, x0 + nx);
              r = Math.max(r, x0 + nx);
              t = Math.min(t, y0 + ny);
              b = Math.max(b, y0 + ny);
              for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++) {
                  if (!dx && !dy) continue;
                  const ax = nx + dx,
                    ay = ny + dy;
                  if (ax < 0 || ax >= rw || ay < 0 || ay >= rh) continue;
                  const q = ay * rw + ax;
                  if (visited[q]) continue;
                  visited[q] = 1;
                  if (pixels[((ay + y0) * image.width + ax + x0) * 4 + 3] > 32)
                    queue[tail++] = q;
                }
            }
            if (tail > biggest) {
              biggest = tail;
              left = l;
              right = r;
              top = t;
              bottom = b;
            }
          }
          if (right < left || bottom - top < 120)
            throw Error(
              "Missing source frame " + spec.id + " " + row + " " + col,
            );
          bounds.push({
            x: left,
            y: top,
            w: right - left + 1,
            h: bottom - top + 1,
          });
        }
        rowsOfBounds.push(bounds);
      }
      const whole = rowsOfBounds.flat();
      for (let row = 0; row < rowsOfBounds.length; row++) {
        const bounds = rowsOfBounds[row],
          sizeBounds = spec.id === "goblins" ? whole : bounds;
        const scale = Math.min(
          58 / Math.max(...sizeBounds.map((b) => b.w)),
          72 / Math.max(...sizeBounds.map((b) => b.h)),
        );
        for (let d = 0; d < 4; d++) {
          const b = bounds[spec.directions[row][d]],
            w = Math.round(b.w * scale),
            h = Math.round(b.h * scale);
          ac.drawImage(
            image,
            b.x,
            b.y,
            b.w,
            b.h,
            d * 64 + Math.round((64 - w) / 2),
            row * 80 + 74 - h,
            w,
            h,
          );
          boxes.push({ row, direction: manifest.directions[d], ...b });
        }
        pv.drawImage(
          atlas,
          0,
          row * 80,
          64,
          80,
          (previewIndex % 8) * 128,
          Math.floor(previewIndex / 8) * 160,
          128,
          160,
        );
        previewIndex++;
      }
      images[spec.id + ".png"] = atlas.toDataURL();
      manifest.sheets[spec.id] = {
        source: `docs/art/sources/${spec.id}-v1.png`,
        file: `${spec.id}.png`,
        rows:
          spec.id === "goblins"
            ? ["fighter", "archer", "chief"]
            : ["male", "female"],
        sourceDirectionColumns: spec.directions,
        sourceBounds: boxes,
        transparentRatio: +(transparent / (image.width * image.height)).toFixed(
          4,
        ),
      };
    }
    const { newGuild } = await import("/src/domain/guild.ts");
    return {
      images,
      preview: preview.toDataURL(),
      manifest,
      starters: newGuild().roster.map((m) => ({
        id: m.id,
        gender: m.gender,
        race: m.race,
        classId: m.classId,
      })),
    };
  }, specs);
  mkdirSync("public/art/generated", { recursive: true });
  for (const [name, url] of Object.entries(result.images))
    writeFileSync(
      "public/art/generated/" + name,
      Buffer.from(url.split(",")[1], "base64"),
    );
  writeFileSync(
    "public/art/generated/pack-preview.png",
    Buffer.from(result.preview.split(",")[1], "base64"),
  );
  writeFileSync(
    "public/art/generated/manifest.json",
    JSON.stringify(result.manifest, null, 2) + "\n",
  );
  console.log(
    "Packed 52 transparent directional frames, 64×80, pivot32,74. Starters:",
    JSON.stringify(result.starters),
  );
} finally {
  await browser?.close();
  await server.close();
}
