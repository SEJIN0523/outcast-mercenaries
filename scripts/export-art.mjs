// Reproduce the shipped art samples using the exact runtime drawing functions.
import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const server = await createServer({
  server: { host: "127.0.0.1", port: 0 },
  clearScreen: false,
});
server.middlewares.use("/__art_export", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end("<!doctype html><html><body></body></html>");
});
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/__art_export`);
  const result = await page.evaluate(async () => {
    const { drawMercenary, SPRITE_LAYERS, SPRITE_SPEC } =
      await import("/src/render/sprite.ts");
    const { drawGoblin } = await import("/src/render/goblin.ts");
    const { drawBattlefield } = await import("/src/render/battlefield.ts");
    const { generateMercenary, HAIR } =
      await import("/src/domain/characters.ts");
    const { CLASSES } = await import("/src/data/catalog.ts");
    const canvas = (w, h) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    };
    const frame = canvas(64, 80),
      ctx = frame.getContext("2d"),
      characters = canvas(1024, 1280),
      sheet = characters.getContext("2d"),
      contact = canvas(1024, 400),
      card = contact.getContext("2d");
    card.fillStyle = "#202b32";
    card.fillRect(0, 0, 1024, 400);
    card.imageSmoothingEnabled = false;
    const people = [];
    let row = 0;
    for (const gender of ["male", "female"])
      for (const [classId, cls] of Object.entries(CLASSES)) {
        const m = {
          ...generateMercenary(`art-${classId}-${gender}`),
          race: "human",
          gender,
          classId,
          equipment: { weapon: cls.weapon, armor: "cloth" },
          appearance: {
            hairStyle: gender === "female" ? 2 : 0,
            hairColor: HAIR[row % HAIR.length],
            skinColor: "#f3cda5",
            bodyType: 0,
          },
        };
        people.push(m);
        for (let d = 0; d < 4; d++)
          for (let f = 0; f < 4; f++) {
            drawMercenary(ctx, m, SPRITE_SPEC.directions[d], f);
            sheet.drawImage(frame, (d * 4 + f) * 64, row * 80);
          }
        drawMercenary(ctx, m);
        card.drawImage(
          frame,
          (row % 8) * 128,
          Math.floor(row / 8) * 200 + 12,
          128,
          160,
        );
        card.fillStyle = "#e6d1a1";
        card.font = "12px sans-serif";
        card.textAlign = "center";
        card.fillText(
          `${cls.name} · ${gender === "male" ? "남" : "여"}`,
          (row % 8) * 128 + 64,
          Math.floor(row / 8) * 200 + 187,
        );
        row++;
      }
    const enemies = canvas(1024, 240),
      e = enemies.getContext("2d");
    for (const [r, kind] of ["fighter", "archer", "chief"].entries())
      for (let d = 0; d < 4; d++)
        for (let f = 0; f < 4; f++) {
          drawGoblin(ctx, kind, SPRITE_SPEC.directions[d], f);
          e.drawImage(frame, (d * 4 + f) * 64, r * 80);
        }
    const layers = canvas(1024, SPRITE_LAYERS.length * 80),
      l = layers.getContext("2d");
    for (const [r, layer] of SPRITE_LAYERS.entries())
      for (let d = 0; d < 4; d++)
        for (let f = 0; f < 4; f++) {
          drawMercenary(ctx, people[0], SPRITE_SPEC.directions[d], f, layer);
          l.drawImage(frame, (d * 4 + f) * 64, r * 80);
        }
    const field = canvas(360, 420);
    drawBattlefield(field.getContext("2d"));
    // Validate compositing and deterministic output with the actual browser Canvas.
    const composed=canvas(64,80),composedCtx=composed.getContext('2d',{willReadFrequently:true});
    let checks=0;
    for(const person of people)for(const direction of SPRITE_SPEC.directions){
      drawMercenary(ctx,person,direction,1);const expected=ctx.getImageData(0,0,64,80).data;
      composedCtx.clearRect(0,0,64,80);
      for(const layer of SPRITE_LAYERS){drawMercenary(ctx,person,direction,1,layer);composedCtx.drawImage(frame,0,0);}
      const actual=composedCtx.getImageData(0,0,64,80).data;
      if(expected.some((v,i)=>v!==actual[i]))throw Error('Layer composition differs: '+person.classId+' '+direction);
      drawMercenary(ctx,person,direction,1);const repeated=ctx.getImageData(0,0,64,80).data;
      if(expected.some((v,i)=>v!==repeated[i]))throw Error('Nondeterministic art');checks++;
    }
    console.info('Art checks',checks);
    return {
      checks,
      images: {
        "characters.png": characters.toDataURL(),
        "class-preview.png": contact.toDataURL(),
        "goblins.png": enemies.toDataURL(),
        "layers-reference.png": layers.toDataURL(),
        "forest-clearing.png": field.toDataURL(),
      },
      metadata: {
        version: 2,
        frame: { width: 64, height: 80, pivot: { x: 32, y: 74 } },
        columns: SPRITE_SPEC.directions.flatMap((direction) =>
          Array.from({ length: 4 }, (_, frame) => ({ direction, frame })),
        ),
        rows: people.map((m) => ({
          classId: m.classId,
          gender: m.gender,
          appearance: m.appearance,
          equipment: m.equipment,
        })),
        enemyRows: ["fighter", "archer", "chief"],
        layerRows: SPRITE_LAYERS,
        notes:
          "Reference samples. Runtime regenerates all saved appearance combinations. Movement frames only; other action animation uses existing effects.",
      },
    };
  });
  console.log(result.checks+" layered composition and deterministic-output checks passed.");
  mkdirSync("public/art", { recursive: true });
  for (const [name, url] of Object.entries(result.images))
    writeFileSync(
      `public/art/${name}`,
      Buffer.from(url.split(",")[1], "base64"),
    );
  writeFileSync(
    "public/art/manifest.json",
    JSON.stringify(result.metadata, null, 2) + "\n",
  );
  console.log(
    "Exported 16 character variants × 16 frames, 3 goblin variants × 16 frames, 8 reference layers and the battlefield.",
  );
} finally {
  await browser?.close();
  await server.close();
}
