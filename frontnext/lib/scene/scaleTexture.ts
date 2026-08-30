import { CanvasTexture, SRGBColorSpace } from "three";

export interface ScaleTextureOptions {
  /** Height of the glass wall the texture wraps, in scene units. */
  wallHeight: number;
  /** Radius of that wall, used to keep the figures from stretching. */
  radius: number;
  /** Volume at the top mark. */
  maxMl: number;
  /** Spacing of the small ticks. */
  minorEveryMl: number;
  /** Spacing of the ticks that carry a figure. */
  majorEveryMl: number;
  /** Height of the liquid surface for a volume, so marks line up with it. */
  surfaceHeight: (volumeMl: number) => number;
  /** Scale of the printed marks. Narrow glassware needs smaller type. */
  fontPx?: number;
}

/**
 * Draws a volume scale onto a canvas and returns it as a texture.
 *
 * Printed rather than modelled, for the same reason real glassware prints it:
 * raised marks would cost more triangles than the vessel itself. Both the
 * beaker and the measuring cylinders use this, so their marks always agree
 * with the liquid heights they sit next to.
 */
export function createScaleTexture(
  options: ScaleTextureOptions,
): CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const {
    wallHeight,
    radius,
    maxMl,
    minorEveryMl,
    majorEveryMl,
    surfaceHeight,
    fontPx = 26,
  } = options;

  // The canvas aspect has to match the surface it wraps, circumference against
  // wall height, otherwise the figures come out stretched.
  const width = 1024;
  const height = Math.round((width * wallHeight) / (2 * Math.PI * radius));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // The scale occupies one narrow sector of the circumference, as on a real
  // vessel, so it does not wrap the whole glass.
  const left = 40;
  const majorLength = fontPx * 3.2;
  const minorLength = fontPx * 1.8;

  const yForVolume = (volumeMl: number) =>
    (1 - surfaceHeight(volumeMl) / wallHeight) * height;

  ctx.lineCap = "butt";

  for (let volume = minorEveryMl; volume <= maxMl; volume += minorEveryMl) {
    const isMajor = volume % majorEveryMl === 0;
    const y = yForVolume(volume);

    ctx.beginPath();
    ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = isMajor ? 3.5 : 2;
    ctx.moveTo(left, y);
    ctx.lineTo(left + (isMajor ? majorLength : minorLength), y);
    ctx.stroke();

    if (isMajor) {
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = `600 ${fontPx}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(String(volume), left + majorLength + fontPx * 0.45, y);
    }
  }

  // Unit label, beside the top mark rather than above it, where the curve of
  // the rim would cut it off.
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = `500 ${Math.round(fontPx * 0.85)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("mL", left + majorLength + fontPx * 2.8, yForVolume(maxMl));

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
