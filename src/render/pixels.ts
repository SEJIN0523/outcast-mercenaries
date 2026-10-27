/** Integer scanline polygons: crisp pixels without Canvas edge antialiasing. */
export function pixelPainter(ctx: CanvasRenderingContext2D) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const poly = (points: number[][], color: string) => {
    const min = Math.ceil(Math.min(...points.map((p) => p[1]))),
      max = Math.max(...points.map((p) => p[1]));
    for (let y = min; y < max; y++) {
      const hits: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i],
          b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
          hits.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
      hits.sort((a, b) => a - b);
      for (let i = 0; i + 1 < hits.length; i += 2)
        rect(
          Math.ceil(hits[i]),
          y,
          Math.ceil(hits[i + 1]) - Math.ceil(hits[i]),
          1,
          color,
        );
    }
  };
  return { rect, poly };
}
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  return (
    "#" +
    [16, 8, 0]
      .map((s) =>
        Math.max(0, Math.min(255, ((n >> s) & 255) + amount))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
