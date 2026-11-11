"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_HEX, PROCESS_CONTENT, UI_LABELS } from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const wordsWrapRef = useRef<HTMLParagraphElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const [mobileStep, setMobileStep] = useState(0);

  const words = PROCESS_CONTENT.statement.split(/\s+/);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { gsap } = ensureGsap();
    const reduced = prefersReducedMotion();

    if (reduced) {
      const wordEls = wordsWrapRef.current?.querySelectorAll(".pr-word");
      if (wordEls) gsap.set(wordEls, { opacity: 1 });
      return;
    }

    const mm = gsap.matchMedia();

    mm.add("(min-width: 761px)", () => {
      const wordEls = wordsWrapRef.current?.querySelectorAll(".pr-word");
      const s0 = stepRefs.current[0];
      const s1 = stepRefs.current[1];
      const s2 = stepRefs.current[2];
      const b0 = barRefs.current[0];
      const b1 = barRefs.current[1];
      const b2 = barRefs.current[2];

      if (!wordEls || !s0 || !s1 || !s2) return;

      gsap.set(wordEls, { opacity: 0.18 });
      gsap.set(s0, {
        clipPath: "inset(50% 50% 50% 50% round 24px)",
        opacity: 0,
      });
      gsap.set(s1, { clipPath: "inset(0% 0% 0% 100%)" });
      gsap.set(s2, { clipPath: "inset(0% 0% 0% 100%)" });
      gsap.set([b0, b1, b2].filter(Boolean), { scaleX: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=4800",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Phase 1: Word-by-word illumination
      tl.to(wordEls, {
        opacity: 1,
        stagger: 0.04,
        duration: 1,
        ease: "none",
      });

      // Phase 2: Step 01 expands from centered rounded rect to full bleed
      const s0Img = s0.querySelector(".pr-bg");
      const s0Copy = s0.querySelectorAll(".pr-copy");
      tl.to(
        introRef.current,
        { scale: 0.9, opacity: 0, duration: 0.8, ease: "power2.inOut" },
        "step1"
      )
        .to(
          s0,
          {
            opacity: 1,
            clipPath: "inset(24% 22% 24% 22% round 24px)",
            duration: 0.45,
            ease: "power2.out",
          },
          "step1"
        )
        .to(s0, {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          duration: 0.65,
          ease: "power2.inOut",
        })
        .fromTo(
          s0Img,
          { scale: 1.3 },
          { scale: 1, duration: 1.1, ease: "power2.out" },
          "step1"
        )
        .fromTo(
          s0Copy,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out" },
          "-=0.4"
        )
        .to(b0, { scaleX: 1, duration: 0.9, ease: "none" }, "step1");

      // Phase 3: Step 02 horizontal wipe + parallax
      const s1Img = s1.querySelector(".pr-bg");
      const s1Copy = s1.querySelectorAll(".pr-copy");
      tl.to(s1, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.9,
        ease: "power2.inOut",
      })
        .fromTo(
          s1Img,
          { xPercent: 12, scale: 1.12 },
          { xPercent: 0, scale: 1, duration: 0.9, ease: "power2.out" },
          "<"
        )
        .fromTo(
          s1Copy,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out" },
          "-=0.45"
        )
        .to(b1, { scaleX: 1, duration: 0.9, ease: "none" }, "<");

      // Phase 4: Step 03 horizontal wipe + parallax
      const s2Img = s2.querySelector(".pr-bg");
      const s2Copy = s2.querySelectorAll(".pr-copy");
      tl.to(s2, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.9,
        ease: "power2.inOut",
      })
        .fromTo(
          s2Img,
          { xPercent: 12, scale: 1.12 },
          { xPercent: 0, scale: 1, duration: 0.9, ease: "power2.out" },
          "<"
        )
        .fromTo(
          s2Copy,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out" },
          "-=0.45"
        )
        .to(b2, { scaleX: 1, duration: 0.9, ease: "none" }, "<");
    });

    return () => mm.revert();
  }, []);

  const scrollMobileTo = (nextIdx: number) => {
    const clamped = Math.max(
      0,
      Math.min(PROCESS_CONTENT.steps.length - 1, nextIdx)
    );
    setMobileStep(clamped);
    const track = mobileTrackRef.current;
    if (!track) return;
    const card = track.children[clamped] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    }
  };

  return (
    <section
      id="process"
      ref={sectionRef}
      className="relative bg-[var(--tint)] overflow-hidden"
    >
      {/* Desktop Pinned Storytelling Stage */}
      <div className="hidden min-[761px]:block relative h-screen min-h-[620px] w-full">
        {/* Intro Layer */}
        <div
          ref={introRef}
          className="shell relative z-10 flex h-full flex-col items-center justify-center text-center"
        >
          <div className="label">
            <span className="label-idx">{PROCESS_CONTENT.kickerIndex}</span>
            <span>{PROCESS_CONTENT.kickerLabel}</span>
          </div>

          <h2 className="mt-3 font-display text-[clamp(2.6rem,1.5rem+3.4vw,5.06rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            {PROCESS_CONTENT.heading}
          </h2>

          <p
            ref={wordsWrapRef}
            className="mt-6 max-w-[1082px] font-display text-[clamp(1.75rem,1rem+2.3vw,3.15rem)] font-normal leading-[1.28] tracking-[-0.025em] text-[var(--ink)]"
          >
            {words.map((w, idx) => (
              <span key={idx} className="pr-word inline-block mr-[0.26em]">
                {w}
              </span>
            ))}
          </p>

          <p className="mt-6 font-display text-2xl font-extrabold text-[var(--pink-ink)]">
            {PROCESS_CONTENT.punchline}
          </p>
        </div>

        {/* Full-Bleed Pinned Step Layers */}
        {PROCESS_CONTENT.steps.map((step, i) => {
          const accent = ACCENT_HEX[step.accent];
          return (
            <div
              key={step.num}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="pr-step-scrim absolute inset-0 z-20 flex items-center overflow-hidden bg-[var(--ink)]"
              style={{ ["--accent" as string]: accent }}
            >
              <img
                src={step.image}
                alt={step.title}
                className="pr-bg absolute inset-0 h-full w-full object-cover"
              />

              {/* Giant Outlined Watermark Number */}
              <div
                className="pr-ghost-num pointer-events-none absolute right-[5vw] bottom-[4vh] z-10 font-display text-[clamp(10rem,26vw,23.4rem)] font-extrabold leading-[0.88] tracking-[-0.06em] select-none"
                aria-hidden="true"
              >
                {step.num}
              </div>

              <div className="shell relative z-10 text-white">
                <div className="max-w-[680px]">
                  <div className="pr-copy inline-flex items-center gap-2.5 mono text-sm sm:text-base font-semibold tracking-[0.14em] uppercase text-white/90">
                    <span
                      className="inline-block h-3 w-3 shrink-0"
                      style={{
                        backgroundColor: accent,
                        clipPath:
                          "polygon(50% 4%, 95% 38%, 78% 92%, 22% 92%, 5% 38%)",
                      }}
                      aria-hidden="true"
                    />
                    <span>{step.kicker}</span>
                  </div>

                  <h3 className="pr-copy mt-4 font-display text-[clamp(2.5rem,1.4rem+4vw,5.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">
                    {step.title}
                  </h3>

                  <p className="pr-copy mt-4 max-w-[48ch] text-lg sm:text-xl leading-relaxed text-white/85">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* 3 Bottom Progress Indicator Bars */}
        <div
          className="pointer-events-none absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2"
          aria-hidden="true"
        >
          {PROCESS_CONTENT.steps.map((step, i) => (
            <div
              key={step.num}
              className="h-[4px] w-[46px] overflow-hidden rounded-[2px] bg-white/25"
            >
              <span
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
                className="block h-full w-full origin-left rounded-[2px] bg-[var(--card)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Scroll-Snap Carousel (<= 760px) */}
      <div className="min-[761px]:hidden sec-block">
        <div className="shell text-center">
          <div className="label justify-center">
            <span className="label-idx">{PROCESS_CONTENT.kickerIndex}</span>
            <span>{PROCESS_CONTENT.kickerLabel}</span>
          </div>
          <h2 className="mt-2 font-display text-4xl font-extrabold">
            {PROCESS_CONTENT.heading}
          </h2>
          <p className="mt-4 font-display text-xl font-normal leading-snug text-[var(--ink-soft)]">
            {PROCESS_CONTENT.statement}
          </p>
          <p className="mt-3 font-display text-lg font-extrabold text-[var(--pink-ink)]">
            {PROCESS_CONTENT.punchline}
          </p>
        </div>

        <div
          ref={mobileTrackRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const w = el.clientWidth || 1;
            const idx = Math.round(el.scrollLeft / w);
            if (idx !== mobileStep) setMobileStep(idx);
          }}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {PROCESS_CONTENT.steps.map((step) => {
            const accent = ACCENT_HEX[step.accent];
            return (
              <div
                key={step.num}
                className="pr-step-scrim relative min-h-[540px] w-[84vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-[20px] border-2 border-[var(--ink)] bg-[var(--ink)] p-6 flex flex-col justify-end"
                style={{ ["--accent" as string]: accent }}
              >
                <img
                  src={step.image}
                  alt={step.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="pr-ghost-num pointer-events-none absolute right-4 top-2 z-10 font-display text-8xl font-extrabold tracking-[-0.06em]"
                  aria-hidden="true"
                >
                  {step.num}
                </div>
                <div className="relative z-10 text-white">
                  <span className="inline-flex items-center gap-2 mono text-xs font-semibold tracking-wider uppercase text-white/90">
                    <span
                      className="inline-block h-2.5 w-2.5"
                      style={{
                        backgroundColor: accent,
                        clipPath:
                          "polygon(50% 4%, 95% 38%, 78% 92%, 22% 92%, 5% 38%)",
                      }}
                    />
                    {step.kicker}
                  </span>
                  <h3 className="mt-3 font-display text-[2.4rem] font-extrabold leading-[1.02] text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="shell mt-5 flex items-center justify-between gap-3">
          <span className="mono text-xs font-semibold text-[var(--ink-faint)]">
            0{mobileStep + 1} / 0{PROCESS_CONTENT.steps.length}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label={UI_LABELS.prevStepAria}
              disabled={mobileStep === 0}
              onClick={() => scrollMobileTo(mobileStep - 1)}
              className="sc-btn disabled:opacity-40"
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
              aria-label={UI_LABELS.nextStepAria}
              disabled={mobileStep === PROCESS_CONTENT.steps.length - 1}
              onClick={() => scrollMobileTo(mobileStep + 1)}
              className="sc-btn sc-btn--next disabled:opacity-40"
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
    </section>
  );
}

