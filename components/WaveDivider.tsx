"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

interface WaveDividerProps {
  topColor?: string;
  bottomColor?: string;
  id?: string;
}

const VIEW_W = 1440;
const VIEW_H = 88;

export function WaveDivider({
  topColor = "var(--paper)",
  bottomColor = "var(--shell)",
  id,
}: WaveDividerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const fillPathRef = useRef<SVGPathElement>(null);
  const strokePathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    const fillEl = fillPathRef.current;
    const strokeEl = strokePathRef.current;
    if (!svgEl || !fillEl || !strokeEl) return;

    const FK = 26;
    const FD = 3.4;
    const DT = 1 / 120;

    const width = Math.max(360, svgEl.clientWidth || 1440);
    const N = Math.round(Math.max(24, Math.min(72, width / 22)));
    const S = VIEW_W / N;
    const T = (720 / S) ** 2;

    const u = new Float32Array(N + 1);
    const v = new Float32Array(N + 1);

    const base = VIEW_H * 0.45;
    const amp = Math.min(15, VIEW_H * 0.17);
    const len = VIEW_W / (width < 760 ? 1.1 : 1.8);
    const restAt = (x: number) => base + Math.sin((x / len) * Math.PI * 2 + 0.8) * amp;

    const buildPaths = () => {
      let curve = `M 0 ${(restAt(0) + u[0]).toFixed(1)}`;
      for (let i = 0; i < N; i++) {
        const x0 = i * S;
        const y0 = restAt(x0) + u[i];
        const x1 = (i + 1) * S;
        const y1 = restAt(x1) + u[i + 1];
        const mx = (x0 + x1) * 0.5;
        const my = (y0 + y1) * 0.5;
        curve += ` Q ${x0.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const endY = (restAt(VIEW_W) + u[N]).toFixed(1);
      curve += ` L ${VIEW_W} ${endY}`;
      strokeEl.setAttribute("d", curve);
      fillEl.setAttribute("d", `${curve} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`);
    };

    buildPaths();
    if (prefersReducedMotion()) return;

    let rafId = 0;
    let sleeping = true;
    let active = true;
    let acc = 0;
    let lastTime = performance.now();
    let lastScrollY = window.scrollY;
    let prevPx = -999;
    let prevPy = -999;
    let prevPt = performance.now();

    const wake = () => {
      if (!sleeping || !active) return;
      sleeping = false;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    const poke = (clientX: number, impulse: number) => {
      const rect = svgEl.getBoundingClientRect();
      if (!rect.width) return;
      const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const f = nx * N;
      const center = Math.round(f);
      for (let i = Math.max(1, center - 4); i <= Math.min(N - 1, center + 4); i++) {
        const g = Math.exp(-((i - f) ** 2) / 2.9);
        v[i] += impulse * g;
      }
      wake();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = svgEl.getBoundingClientRect();
      const now = performance.now();
      const dt = Math.max(0.008, (now - prevPt) / 1000);
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (prevPx > -900) {
        const dx = px - prevPx;
        const dy = py - prevPy;
        const imp =
          Math.max(-700, Math.min(700, dy / dt)) * 0.18 +
          Math.min(900, Math.abs(dx) / dt) * 0.09 * Math.sign(dy || 1);
        poke(e.clientX, imp * 0.08);
      }
      prevPx = px;
      prevPy = py;
      prevPt = now;
    };

    const onScroll = () => {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      const rect = svgEl.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;
      const clamped = Math.max(-70, Math.min(70, dy * 1.6));
      const now = performance.now();
      for (let i = 1; i < N; i++) {
        v[i] += clamped * (0.45 + 0.55 * Math.sin(i * 0.45 + now / 250));
      }
      wake();
    };

    const onHeroWavePoke = (e: Event) => {
      if (id !== "ly-floor") return;
      const ce = e as CustomEvent<{ clientX: number; impulse: number }>;
      if (ce.detail) poke(ce.detail.clientX, ce.detail.impulse * 12);
    };

    const tick = (now: number) => {
      if (!active) return;
      const elapsed = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      acc += elapsed;
      let steps = 0;

      while (acc >= DT && steps < 4) {
        for (let i = 1; i < N; i++) {
          const laplacian = (u[i - 1] - 2 * u[i] + u[i + 1]) * T;
          const accY = laplacian - FK * u[i] - FD * v[i];
          v[i] += accY * DT;
        }
        for (let i = 1; i < N; i++) {
          u[i] += v[i] * DT;
        }
        acc -= DT;
        steps++;
      }

      buildPaths();

      let maxU = 0;
      let maxV = 0;
      for (let i = 1; i < N; i++) {
        if (Math.abs(u[i]) > maxU) maxU = Math.abs(u[i]);
        if (Math.abs(v[i]) > maxV) maxV = Math.abs(v[i]);
      }
      if (maxU < 0.03 && maxV < 0.6) {
        u.fill(0);
        v.fill(0);
        buildPaths();
        sleeping = true;
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    svgEl.addEventListener("pointermove", onPointerMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hero:wave-poke", onHeroWavePoke);

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
      svgEl.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hero:wave-poke", onHeroWavePoke);
    };
  }, [id]);

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
          ref={fillPathRef}
          fill={bottomColor}
          d={`M 0 ${VIEW_H} L 0 40 L ${VIEW_W} 40 L ${VIEW_W} ${VIEW_H} Z`}
        />
        <path
          ref={strokePathRef}
          fill="none"
          stroke="var(--hair)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          d={`M 0 40 L ${VIEW_W} 40`}
        />
      </svg>
    </div>
  );
}
