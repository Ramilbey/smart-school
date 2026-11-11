import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Turns the course's SVG pictures into PNGs for Telegram. Fonts ship with the project so pictures look the same on any machine.
 * If the native renderer is missing, returns null and the bot simply sends text: a lesson must never fail because of a picture.
 */

type ResvgCtor = new (svg: string, opts: Record<string, unknown>) => { render(): { asPng(): Buffer } };

let resvg: ResvgCtor | null | undefined;

async function loadRenderer(): Promise<ResvgCtor | null> {
  if (resvg !== undefined) return resvg;
  try {
    resvg = (await import('@resvg/resvg-js')).Resvg as unknown as ResvgCtor;
  } catch (e) {
    console.warn('[render] pictures off, renderer not available:', (e as Error).message);
    resvg = null;
  }
  return resvg;
}

function fontFiles(): string[] {
  const candidates = [path.resolve('server/assets/fonts'), path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets/fonts')];
  for (const dir of candidates) {
    try {
      const files = readdirSync(dir).filter((f) => f.endsWith('.ttf'));
      if (files.length) return files.map((f) => path.join(dir, f));
    } catch {
      /* try the next place */
    }
  }
  return [];
}

export async function svgToPng(svg: string): Promise<Buffer | null> {
  const R = await loadRenderer();
  if (!R) return null;
  try {
    const png = new R(svg, {
      fitTo: { mode: 'width', value: 1000 },
      font: { fontFiles: fontFiles(), loadSystemFonts: true, defaultFontFamily: 'Onest' },
      background: '#ffffff',
    }).render();
    return Buffer.from(png.asPng());
  } catch (e) {
    console.warn('[render] could not draw a picture:', (e as Error).message);
    return null;
  }
}
