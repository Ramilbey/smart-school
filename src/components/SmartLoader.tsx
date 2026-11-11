import { useEffect, useRef } from 'react';
import { createLoader } from '../../shared/smartLoader.ts';

/** The Smart Schools loading animation: plays once, then stays on its finished picture. */
export function SmartLoader({ width = 340, height = 240, className }: { width?: number; height?: number; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const loader = createLoader(svg, { width, height, fade: false });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      loader.setTime(loader.settled);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      loader.setTime(Math.min(t, loader.settled));
      if (t < loader.settled) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);
  return <svg ref={ref} className={className} role="img" aria-label="Smart Schools" xmlns="http://www.w3.org/2000/svg" />;
}
