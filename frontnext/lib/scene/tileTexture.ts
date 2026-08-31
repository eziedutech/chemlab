import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Floor tiles, drawn once to a canvas and repeated across the floor.
 *
 * A plain colour left the floor and the bench tops reading as the same
 * surface. Tiles give the room a floor you can tell apart from the furniture,
 * and a sense of scale: each square is a known size, so the distance down the
 * aisle becomes legible.
 */
export function createTileTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // One tile per texture repeat, with the grout drawn on two edges so it lines
  // up with the neighbouring copies.
  ctx.fillStyle = "#8a9099";
  ctx.fillRect(0, 0, size, size);

  // A faint mottle, so a large floor does not look like flat paint.
  for (let i = 0; i < 900; i += 1) {
    const shade = 132 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgba(${shade},${shade + 4},${shade + 10},0.35)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  ctx.strokeStyle = "#6f757e";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(size, 3);
  ctx.moveTo(3, 0);
  ctx.lineTo(3, size);
  ctx.stroke();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}
