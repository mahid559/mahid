"use client";

import { useEffect, useRef } from "react";
import { ACCENT_HEX } from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

const TRAIL_SHAPES = [
  "polygon(50% 5%, 76% 14%, 93% 36%, 93% 64%, 76% 86%, 50% 95%, 24% 86%, 7% 64%, 7% 36%, 24% 14%)",
  "polygon(12% 12%, 88% 12%, 88% 88%, 12% 88%)",
  "polygon(50% 6%, 94% 88%, 6% 88%)",
  "polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)",
  "polygon(50% 4%, 95% 38%, 78% 92%, 22% 92%, 5% 38%)",
  "polygon(50% 2%, 63% 35%, 98% 37%, 71% 59%, 80% 94%, 50% 74%, 20% 94%, 29% 59%, 2% 37%, 37% 35%)",
];

const TRAIL_COLORS = [
  ACCENT_HEX.pink,
  ACCENT_HEX.blue,
  ACCENT_HEX.yellow,
  ACCENT_HEX.mint,
];

const POOL_SIZE = 22;

export function ShapeTrail({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const layer = layerRef.current;
    if (!container || !layer || prefersReducedMotion()) return;

    const { gsap } = ensureGsap();
    const pool: HTMLSpanElement[] = [];

    for (let i = 0; i < POOL_SIZE; i++) {
      const el = document.createElement("span");
      el.className = "pointer-events-none absolute left-0 top-0 opacity-0";
      el.style.width = "18px";
      el.style.height = "18px";
      layer.appendChild(el);
      pool.push(el);
    }

    let poolIdx = 0;
    let lastX = -999;
    let lastY = -999;
    let shapeIdx = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if ((e.target as HTMLElement).closest("a, button, input, textarea, summary, select, label")) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (Math.hypot(x - lastX, y - lastY) < 26) return;
      lastX = x;
      lastY = y;

      const node = pool[poolIdx % POOL_SIZE];
      poolIdx++;
      shapeIdx++;

      const size = 14 + (shapeIdx % 3) * 5;
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
      node.style.clipPath = TRAIL_SHAPES[shapeIdx % TRAIL_SHAPES.length];
      node.style.backgroundColor = TRAIL_COLORS[shapeIdx % TRAIL_COLORS.length];

      gsap.killTweensOf(node);
      gsap.set(node, {
        x: x - size / 2,
        y: y - size / 2,
        scale: 0,
        opacity: 0.9,
        rotation: (shapeIdx * 37) % 360,
      });

      gsap
        .timeline()
        .to(node, {
          scale: 1,
          duration: 0.35,
          ease: "back.out(2.5)",
        })
        .to(
          node,
          {
            y: y - size / 2 + 45 + (shapeIdx % 4) * 10,
            opacity: 0,
            scale: 0.5,
            duration: 0.7,
            ease: "power1.in",
          },
          "-=0.05"
        );
    };

    container.addEventListener("pointermove", onPointerMove);
    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      pool.forEach((p) => {
        gsap.killTweensOf(p);
        p.remove();
      });
    };
  }, [containerRef]);

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}

