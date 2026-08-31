import { CanvasTexture, SRGBColorSpace } from "three";

/**
 * The surround the glassware reflects, drawn as one equirectangular image.
 *
 * Glass has no colour of its own. Everything you read as glass is a reflection
 * of the room, so what the room looks like decides whether the glass looks
 * clear or looks smoked. A surround that is one flat grey reflects the same
 * grey at every angle, and an even film across a curved surface is exactly
 * what frosted glass looks like: that is where the smoke came from.
 *
 * A real room is not flat. It is bright overhead, mid toned at eye level, and
 * dark below the bench, with a few hard edges between. Reflected in a curved
 * wall, those bands become the thin bright and dark lines that run down a
 * beaker, and the dark ones are what draw its outline. This texture is that
 * room, and nothing more: three horizontal bands, a couple of window strips,
 * and a few dark uprights standing in for door frames and cabinet ends.
 */
export function createRoomEnvironmentTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;

  const width = 1024;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Row 0 of the canvas is the top of the sphere, so the gradient runs from
  // the ceiling down to the floor in the order it is written.
  const bands = ctx.createLinearGradient(0, 0, 0, height);
  bands.addColorStop(0.0, "#ffffff"); // lit ceiling, straight overhead
  bands.addColorStop(0.22, "#eef3f9");
  bands.addColorStop(0.34, "#d3dde8"); // top of the wall
  bands.addColorStop(0.52, "#b4c1d0"); // wall at eye level
  bands.addColorStop(0.6, "#4d5766"); // the bench line: the dark edge
  bands.addColorStop(0.74, "#39424f"); // cabinet fronts below it
  bands.addColorStop(1.0, "#20262f"); // floor, and the shadow under everything
  ctx.fillStyle = bands;
  ctx.fillRect(0, 0, width, height);

  // Windows. Two broad bright panels on the wall band, which is what puts the
  // wide soft sheen on the shoulder of the beaker.
  const windows = [0.1, 0.62];
  for (const u of windows) {
    const x = u * width;
    const pane = ctx.createLinearGradient(x, 0, x + width * 0.16, 0);
    pane.addColorStop(0, "rgba(255,255,255,0)");
    pane.addColorStop(0.5, "rgba(255,255,255,0.92)");
    pane.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = pane;
    ctx.fillRect(x, height * 0.2, width * 0.16, height * 0.32);
  }

  // Uprights: door frames, bench ends, the gaps between cabinets. Narrow and
  // dark, and reflected off a curved wall each one becomes a thin dark line
  // down the glass, which is the outline a clear vessel needs in order not to
  // dissolve into its background. Kept thin and only half opaque: a curved
  // wall squeezes the whole room into its own silhouette, so anything wide
  // here comes back as a black block rather than as a line.
  const uprights = [0.05, 0.46, 0.83];
  for (const u of uprights) {
    const x = u * width;
    const post = ctx.createLinearGradient(x, 0, x + width * 0.013, 0);
    post.addColorStop(0, "rgba(6,9,14,0)");
    post.addColorStop(0.5, "rgba(6,9,14,0.5)");
    post.addColorStop(1, "rgba(6,9,14,0)");
    ctx.fillStyle = post;
    ctx.fillRect(x, height * 0.28, width * 0.013, height * 0.4);
  }

  // The bright counterparts, and the reason the glass has anything to catch.
  // Reflected round a cylinder these come back as the soft white streaks that
  // run down a real vessel: one broad one on the lit shoulder, one weaker
  // further round. Two, and both wide. Several narrow ones alternating with
  // the dark uprights is a zebra, not a reflection, and a highlight only reads
  // as a highlight while most of the surface is not one.
  const highlights = [
    { u: 0.14, w: 0.1, alpha: 0.92 },
    { u: 0.62, w: 0.07, alpha: 0.62 },
  ];
  for (const { u, w, alpha } of highlights) {
    const x = u * width;
    const streak = ctx.createLinearGradient(x, 0, x + width * w, 0);
    streak.addColorStop(0, "rgba(255,255,255,0)");
    streak.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
    streak.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = streak;
    // Fading out at the foot, so the streak dies away towards the bench the
    // way a real reflection of a standing light does.
    ctx.fillRect(x, height * 0.16, width * w, height * 0.46);
  }

  // The strip lights in the ceiling, as two bright lines running across it.
  // These give the crisp highlight along the rim.
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.fillRect(0, height * 0.06, width, height * 0.03);
  ctx.fillRect(0, height * 0.14, width, height * 0.02);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
