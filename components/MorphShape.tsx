"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

const SHAPES = [
  // Circle (10-pt)
  "polygon(50% 5%, 76% 14%, 93% 36%, 93% 64%, 76% 86%, 50% 95%, 24% 86%, 7% 64%, 7% 36%, 24% 14%)",
  // Square (10-pt)
  "polygon(12% 12%, 50% 12%, 88% 12%, 88% 50%, 88% 88%, 50% 88%, 12% 88%, 12% 50%, 12% 28%, 12% 12%)",
  // Triangle (10-pt)
  "polygon(50% 8%, 65% 34%, 80% 60%, 94% 88%, 65% 88%, 50% 88%, 35% 88%, 6% 88%, 20% 60%, 35% 34%)",
  // Hexagon (10-pt)
  "polygon(50% 4%, 72% 16%, 93% 28%, 93% 50%, 93% 72%, 50% 96%, 7% 72%, 7% 50%, 7% 28%, 28% 16%)",
  // Diamond (10-pt)
  "polygon(50% 4%, 73% 27%, 96% 50%, 73% 73%, 50% 96%, 27% 73%, 4% 50%, 27% 27%, 38% 15%, 50% 4%)",
  // Pentagon (10-pt)
  "polygon(50% 6%, 72% 22%, 94% 38%, 86% 65%, 78% 92%, 50% 92%, 22% 92%, 14% 65%, 6% 38%, 28% 22%)",
  // Star (10-pt)
  "polygon(50% 3%, 63% 35%, 97% 38%, 71% 59%, 79% 93%, 50% 73%, 21% 93%, 29% 59%, 3% 38%, 37% 35%)",
];

const COLORS = ["#E0206A", "#2B4BFF", "#E09200", "#00967F"];

export function MorphShape({ className = "" }: { className?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setStep((s) => s + 1);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  const clipPath = SHAPES[step % SHAPES.length];
  const backgroundColor = COLORS[step % COLORS.length];

  return (
    <span
      className={`morph-shape block ${className}`}
      style={{ clipPath, backgroundColor }}
      aria-hidden="true"
    />
  );
}

