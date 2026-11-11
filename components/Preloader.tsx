"use client";

import { useEffect, useRef, useState } from "react";
import { UI_LABELS, WIPE_COLORS } from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

const LOADER_CHARS = Array.from(UI_LABELS.loaderText);

export function Preloader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (loaderRef.current) {
      const color =
        WIPE_COLORS[Math.floor(Math.random() * WIPE_COLORS.length)] ?? "#F5B800";
      loaderRef.current.style.setProperty("--wipe", color);
    }

    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => {
        setRemoved(true);
        document.documentElement.classList.add("lifted");
        window.dispatchEvent(new CustomEvent("preloader:done"));
      }, 0);
      return () => window.clearTimeout(id);
    }

    const { gsap } = ensureGsap();
    let cancelled = false;
    let rafId = 0;
    const start = performance.now();

    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      gsap.globalTimeline.resume();
      setExiting(true);
      document.documentElement.classList.add("lifted");
      window.dispatchEvent(new CustomEvent("preloader:done"));
      window.setTimeout(() => setRemoved(true), 900);
    };

    const waitCalmFrames = () => {
      let calm = 0;
      let prev = performance.now();
      const maxStop = prev + 1500;
      const tick = (now: number) => {
        if (cancelled) return;
        const dt = now - prev;
        prev = now;
        calm = dt < 25 ? calm + 1 : 0;
        if (calm >= 3 || now >= maxStop) {
          finish();
          return;
        }
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    };

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      const minWait = Math.max(0, 700 - elapsed);
      window.setTimeout(() => {
        if (!cancelled) waitCalmFrames();
      }, minWait);
    });

    // Hard failsafe matching reference 2500ms boot cap
    const bail = window.setTimeout(finish, 2500);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(bail);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      ref={loaderRef}
      id="loader"
      className={`loader-root ${exiting ? "out" : ""}`}
      style={{ ["--wipe" as string]: "#F5B800" }}
      aria-hidden="true"
    >
      <div className="loader-ring">
        {LOADER_CHARS.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="loader-char"
            style={{ ["--i" as string]: i }}
          >
            <span>{ch === " " ? "\u00A0" : ch}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
