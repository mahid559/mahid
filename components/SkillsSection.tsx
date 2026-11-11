"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ACCENT_HEX, SKILLS_CONTENT, UI_LABELS } from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";
import { ShapeTrail } from "./ShapeTrail";

const SHAKE_FRAMES: Keyframe[] = [
  { transform: "translate(0, 0)" },
  { transform: "translate(-4px, 2px)" },
  { transform: "translate(4px, -2px)" },
  { transform: "translate(-3px, -1px)" },
  { transform: "translate(2px, 1px)" },
  { transform: "translate(0, 0)" },
];

export function SkillsSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [displayAvg, setDisplayAvg] = useState(() => {
    const items = SKILLS_CONTENT.categories[0].items;
    return Math.round(items.reduce((s, x) => s + x.level, 0) / items.length);
  });

  const sectionRef = useRef<HTMLElement>(null);
  const skWrapRef = useRef<HTMLDivElement>(null);

  const current = SKILLS_CONTENT.categories[activeIdx] ?? SKILLS_CONTENT.categories[0];
  const accentHex = ACCENT_HEX[current.accent];
  const accent2Hex = ACCENT_HEX[current.accent2];

  const targetAvg = useMemo(() => {
    const sum = current.items.reduce((s, it) => s + it.level, 0);
    return Math.round(sum / current.items.length);
  }, [current]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => setDisplayAvg(targetAvg), 0);
      return () => window.clearTimeout(id);
    }
    const { gsap } = ensureGsap();
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: targetAvg,
      duration: 0.65,
      ease: "power2.out",
      onUpdate: () => setDisplayAvg(Math.round(obj.val)),
    });
    return () => {
      tween.kill();
    };
  }, [targetAvg, animKey]);

  const handleSelectTab = (idx: number) => {
    if (idx === activeIdx) return;
    setActiveIdx(idx);
    setAnimKey((k) => k + 1);
    if (!prefersReducedMotion() && skWrapRef.current?.animate) {
      skWrapRef.current.animate(SHAKE_FRAMES, {
        duration: 460,
        easing: "ease-out",
      });
    }
  };

  return (
    <section
      id="skills-tinted"
      ref={sectionRef}
      className="relative sec-block bg-[var(--tint)] border-y border-[var(--hair-soft)] overflow-hidden"
    >
      <ShapeTrail containerRef={sectionRef} />

      <div className="shell relative z-10">
        <div className="label">
          <span className="label-idx">{SKILLS_CONTENT.kickerIndex}</span>
          <span>{SKILLS_CONTENT.kickerLabel}</span>
        </div>
        <h2
          data-split
          className="mt-2 font-display text-[clamp(2rem,1.4rem+2.5vw,3.4rem)] font-extrabold"
        >
          {SKILLS_CONTENT.heading}
        </h2>
        <div className="mt-4 h-px w-full bg-[var(--hair)]" aria-hidden="true" />

        <div ref={skWrapRef} className="mt-7">
          {/* 3 Category Tabs */}
          <div
            role="tablist"
            aria-label="Skill categories"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-[26px]"
          >
            {SKILLS_CONTENT.categories.map((cat, idx) => {
              const selected = idx === activeIdx;
              const tabAccent = ACCENT_HEX[cat.accent];
              return (
                <button
                  key={cat.id}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => handleSelectTab(idx)}
                  className="sk-tab"
                  style={{ ["--accent" as string]: tabAccent }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="mono text-[0.7rem] text-[var(--ink-faint)]">
                      {cat.index}
                    </span>
                    <span
                      className="h-2.5 w-2.5 shrink-0"
                      style={{
                        backgroundColor: tabAccent,
                        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                      }}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-1 block font-display text-base sm:text-lg font-extrabold text-[var(--ink)]">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dotted Skills Panel */}
          <div
            key={animKey}
            role="tabpanel"
            className={`sk-panel ${animKey > 0 ? "is-pop" : ""} grid grid-cols-1 min-[860px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 min-[860px]:gap-14 p-6 sm:p-11`}
            style={{
              ["--accent" as string]: accentHex,
              ["--accent-2" as string]: accent2Hex,
            }}
          >
            <div
              className={`sk-flash ${animKey > 0 ? "is-active" : ""}`}
              aria-hidden="true"
            />

            {/* Left Column */}
            <div className="relative z-10 flex flex-col justify-between gap-6">
              <div>
                <div className="mono text-xs font-semibold tracking-[0.14em] text-[var(--ink-faint)]">
                  ◆ {current.items.length} {UI_LABELS.skillsCountSuffix}
                </div>
                <h3
                  className={`mt-2 font-display text-[clamp(2rem,1.4rem+2.6vw,3.4rem)] font-extrabold text-[var(--ink)] ${
                    animKey > 0 ? "sk-title-misreg" : ""
                  }`}
                >
                  {current.label}
                </h3>
              </div>

              <div>
                <div className="font-display text-[clamp(3rem,2rem+4vw,5rem)] font-extrabold leading-none text-[var(--ink)]">
                  {displayAvg}
                </div>
                <div className="mt-1 mono text-[0.72rem] font-semibold tracking-[0.16em] text-[var(--ink-faint)]">
                  {UI_LABELS.skillsAvgLabel}
                </div>
              </div>
            </div>

            {/* Right Column: 20-Segment Bars */}
            <div className="relative z-10 flex flex-col justify-center gap-4">
              {current.items.map((item) => (
                <div key={item.name}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-sm sm:text-base text-[var(--ink)]">
                      {item.name}
                    </span>
                    <span className="mono text-xs font-bold text-[var(--ink-soft)]">
                      {item.level}
                      {UI_LABELS.skillsMaxSuffix}
                    </span>
                  </div>
                  <div className="sk-bar">
                    <div
                      className="sk-bar-fill"
                      style={{ width: `${item.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

