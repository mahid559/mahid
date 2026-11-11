"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

interface WaveDividerProps {
  topColor?: string;
  bottomColor?: string;
  id?: string;
}

const POINTS = 14;
const VIEW_W = 1440;
const VIEW_H = 88;
const BASE_Y = 44;

export function WaveDivider({
  topColor = "var(--paper)",
  bottomColor = "var(--shell)",
  id,
}: WaveDividerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const pathEl = pathRef.current;
    const svgEl = svgRef.current;
    if (!pathEl || !svgEl) return;

    const y = new Float32Array(POINTS);
    const v = new Float32Array(POINTS);
    const rest = (i: number) =>
      BASE_Y + Math.sin((i / (POINTS - 1)) * Math.PI * 2) * 8;

    for (let i = 0; i < POINTS; i++) y[i] = rest(i);

    const buildPath = () => {
      const step = VIEW_W / (POINTS - 1);
      let d = `M 0 ${VIEW_H} L 0 ${y[0].toFixed(2)}`;
      for (let i = 0; i < POINTS - 1; i++) {
        const x1 = i * step;
        const x2 = (i + 1) * step;
        const cx = (x1 + x2) / 2;
        const cy = (y[i] + y[i + 1]) / 2;
        d += ` Q ${x1.toFixed(1)} ${y[i].toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
      }
      d += ` L ${VIEW_W} ${y[POINTS - 1].toFixed(2)} L ${VIEW_W} ${VIEW_H} Z`;
      pathEl.setAttribute("d", d);
    };

    buildPath();
    if (prefersReducedMotion()) return;

    let rafId = 0;
    let lastScrollY = window.scrollY;
    let active = true;

    const impulse = (index: number, force: number) => {
      for (let i = 1; i < POINTS - 1; i++) {
        const dist = Math.abs(i - index);
        if (dist <= 2) {
          v[i] += force * (1 - dist * 0.35);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = svgEl.getBoundingClientRect();
      if (!rect.width) return;
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const idx = Math.round(nx * (POINTS - 1));
      const dir = e.movementY !== 0 ? Math.sign(e.movementY) : 1;
      impulse(idx, Math.max(-9, Math.min(9, dir * 5.2)));
    };

    const onScroll = () => {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      const rect = svgEl.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;
      const clamped = Math.max(-14, Math.min(14, dy * 0.35));
      for (let i = 1; i < POINTS - 1; i++) {
        v[i] += clamped * Math.sin((i / (POINTS - 1)) * Math.PI);
      }
    };

    const tick = () => {
      if (!active) return;
      let moving = false;
      for (let i = 1; i < POINTS - 1; i++) {
        const target = rest(i);
        const force = (target - y[i]) * 0.14;
        v[i] = (v[i] + force) * 0.86;
        y[i] += v[i];
        if (Math.abs(v[i]) > 0.02 || Math.abs(target - y[i]) > 0.05) {
          moving = true;
        }
      }
      if (moving) buildPath();
      rafId = window.requestAnimationFrame(tick);
    };

    svgEl.addEventListener("pointermove", onPointerMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = window.requestAnimationFrame(tick);

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
      svgEl.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      id={id}
      className="relative w-full overflow-hidden select-none leading-[0]"
      style={{ backgroundColor: topColor }}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="block h-[54px] sm:h-[74px] w-full"
      >
        <path
          ref={pathRef}
          fill={bottomColor}
          d={`M 0 ${VIEW_H} L 0 ${BASE_Y} L ${VIEW_W} ${BASE_Y} L ${VIEW_W} ${VIEW_H} Z`}
        />
      </svg>
    </div>
  );
}

