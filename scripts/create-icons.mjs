// Code-native pixel crest. No external image assets or runtime dependencies.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
function crc32(data) {
  let n = 0xffffffff;
  for (const b of data) {
    n ^= b;
    for (let i = 0; i < 8; i++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
  }
  return (n ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type),
    len = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
mkdirSync("public", { recursive: true });
for (const [file, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable.png", 512],
]) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    pixels[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const px = Math.floor((x * 32) / size),
        py = Math.floor((y * 32) / size);
      let col = [23, 36, 29];
      const shield =
        py >= 5 &&
        py < 25 &&
        px >= 7 &&
        px < 25 &&
        (py < 20 || Math.abs(px - 15.5) < 28 - py);
      if (shield) col = [78, 87, 58];
      if (shield && px >= 9 && px < 23 && py >= 7 && py < 24)
        col = [36, 52, 38];
      if (
        (px >= 15 && px <= 16 && py >= 10 && py <= 23) ||
        (py >= 15 && py <= 16 && px >= 11 && px <= 20) ||
        (px >= 14 && px <= 17 && py >= 8 && py <= 10)
      )
        col = [216, 189, 118];
      if ((px === 11 || px === 20) && py === 9) col = [159, 145, 87];
      const p = y * (size * 4 + 1) + 1 + x * 4;
      pixels[p] = col[0];
      pixels[p + 1] = col[1];
      pixels[p + 2] = col[2];
      pixels[p + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  writeFileSync(
    `public/${file}`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(pixels)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
