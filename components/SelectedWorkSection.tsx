"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCENT_HEX,
  PROJECTS,
  SELECTED_WORK_CONTENT,
  UI_LABELS,
} from "@/data/content";
import { ensureGsap, prefersReducedMotion, scrollToSection } from "@/lib/gsap";

const FEATURED = PROJECTS.filter((p) => p.featured);

export function SelectedWorkSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const infoRef = useRef<HTMLDivElement>(null);
  const posObj = useRef({ value: 0 });
  const total = FEATURED.length;

  const placeSlides = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const firstSlide = slideRefs.current[0];
    const slideW = firstSlide ? firstSlide.offsetWidth : 520;
    const step = slideW * 0.98;
    const cur = posObj.current.value;

    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      let d = (((i - cur) % total) + total) % total;
      if (d > total / 2) d -= total;
      const a = Math.min(1, Math.abs(d));
      const scale = 1 - 0.2 * a;
      const opacity = 1 - 0.35 * a;
      const z = 9 - Math.round(Math.abs(d) * 2);

      el.style.transform = `translate(-50%, -50%) translateX(${(d * step).toFixed(1)}px) scale(${scale.toFixed(4)})`;
      el.style.opacity = `${Math.max(0, opacity).toFixed(3)}`;
      el.style.zIndex = `${z}`;
      el.style.pointerEvents = Math.abs(d) <= 1.2 ? "auto" : "none";
    });
  }, [total]);

  useEffect(() => {
    placeSlides();
    window.addEventListener("resize", placeSlides);
    return () => window.removeEventListener("resize", placeSlides);
  }, [placeSlides]);

  const goTo = useCallback(
    (nextRaw: number) => {
      const targetNorm = ((nextRaw % total) + total) % total;
      // Shortest circular delta
      const cur = posObj.current.value;
      let delta = (((targetNorm - (cur % total)) + total) % total);
      if (delta > total / 2) delta -= total;
      const target = cur + delta;

      setActiveIdx(targetNorm);

      const { gsap } = ensureGsap();
      if (prefersReducedMotion()) {
        posObj.current.value = targetNorm;
        placeSlides();
        return;
      }

      gsap.to(posObj.current, {
        value: target,
        duration: 0.9,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: placeSlides,
        onComplete: () => {
          posObj.current.value = targetNorm;
          placeSlides();
        },
      });

      if (infoRef.current) {
        gsap.fromTo(
          infoRef.current,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
        );
      }
    },
    [placeSlides, total]
  );

  const handleBtnOrigin = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    e.currentTarget.style.setProperty("--hx", `${x.toFixed(1)}%`);
    e.currentTarget.style.setProperty("--hy", `${y.toFixed(1)}%`);
  };

  const current = FEATURED[activeIdx] ?? FEATURED[0];

  return (
    <section className="pt-[27px] pb-[92px] bg-[var(--shell)] overflow-x-clip">
      <div className="shell">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="label">
            <span className="label-idx">{SELECTED_WORK_CONTENT.kickerIndex}</span>
            <span>{SELECTED_WORK_CONTENT.kickerLabel}</span>
          </div>
          <h2 className="sr-only">{SELECTED_WORK_CONTENT.heading}</h2>

          <a
            href="#projects"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#projects");
            }}
            className="arrow-link"
            style={{ ["--accent" as string]: ACCENT_HEX.pink }}
          >
            <span>{SELECTED_WORK_CONTENT.allProjectsLabel}</span>
            <span className="arrow-link-icon" aria-hidden="true">
              →
            </span>
          </a>
        </div>

        {/* Coverflow Stage */}
        <div ref={stageRef} className="sc-stage mt-4">
          {FEATURED.map((item, i) => {
            const isActive = i === activeIdx;
            const accentHex = ACCENT_HEX[item.accent];
            return (
              <div
                key={item.id}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                onClick={() => {
                  if (!isActive) goTo(i);
                }}
                className={`sc-slide ${isActive ? "is-active cursor-default" : "cursor-pointer"}`}
                style={{ ["--accent" as string]: accentHex }}
              >
                <div className="sc-media">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="sc-wipe"
                    style={{ backgroundColor: accentHex }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Caption + Controls (Centered Title + Right Arrow Controls) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-5">
          <div className="hidden md:block" aria-hidden="true" />

          <div ref={infoRef} className="min-w-0 text-center">
            <a
              href={current.href}
              className="inline-flex items-baseline justify-center gap-2 font-display text-[clamp(1.8rem,1.1rem+2.2vw,3.3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[var(--ink)] hover:text-[var(--pink)] transition-colors"
            >
              <span>{current.title}</span>
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1.5 mono text-xs sm:text-[0.8rem] text-[var(--ink-faint)]">
              {"{ "}
              {current.category} · {current.summary}
              {" }"}
            </p>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-4 shrink-0">
            <span className="mono text-xs font-semibold tracking-widest text-[var(--ink-faint)]">
              {String(activeIdx + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label={UI_LABELS.prevProjectAria}
                onPointerEnter={handleBtnOrigin}
                onPointerMove={handleBtnOrigin}
                onClick={() => goTo(activeIdx - 1)}
                className="sc-btn"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M11 4L6 9L11 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                aria-label={UI_LABELS.nextProjectAria}
                onPointerEnter={handleBtnOrigin}
                onPointerMove={handleBtnOrigin}
                onClick={() => goTo(activeIdx + 1)}
                className="sc-btn sc-btn--next"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M7 4L12 9L7 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

