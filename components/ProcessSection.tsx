"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_HEX, PROCESS_CONTENT, UI_LABELS } from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const wordsWrapRef = useRef<HTMLParagraphElement>(null);
  const mobileWordsWrapRef = useRef<HTMLParagraphElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const [mobileStep, setMobileStep] = useState(0);
  const [activeDesktopStep, setActiveDesktopStep] = useState(-1);

  const words = PROCESS_CONTENT.statement.split(/\s+/);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { gsap } = ensureGsap();
    const reduced = prefersReducedMotion();

    if (reduced) {
      const wordEls = wordsWrapRef.current?.querySelectorAll(".pr-word");
      const mWordEls = mobileWordsWrapRef.current?.querySelectorAll(".pr-m-word");
      if (wordEls) gsap.set(wordEls, { opacity: 1 });
      if (mWordEls) gsap.set(mWordEls, { opacity: 1 });
      return;
    }

    const mm = gsap.matchMedia();

    // Desktop Pinned Storytelling (FILL=1, BEAT=0.3, DWELL=0.5 -> ~6.9s timeline)
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
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.22) setActiveDesktopStep(-1);
            else if (p < 0.5) setActiveDesktopStep(0);
            else if (p < 0.76) setActiveDesktopStep(1);
            else setActiveDesktopStep(2);
          },
        },
      });

      // Phase 1: Word-by-word illumination (FILL = 1.0)
      tl.to(
        wordEls,
        {
          opacity: 1,
          stagger: { amount: 0.9 },
          duration: 0.1,
          ease: "none",
        },
        0
      );

      // Phase 2: Step 01 Iris / Rounded-Rect Expansion (t0 = 1.3s)
      const t0 = 1.3;
      const s0Img = s0.querySelector(".pr-bg");
      const s0Copy = s0.querySelectorAll(".pr-copy");
      const s0Num = s0.querySelector(".pr-ghost-num");

      tl.to(
        introRef.current,
        { scale: 0.9, opacity: 0, duration: 0.8, ease: "power1.in" },
        t0 + 0.25
      )
        .to(
          s0,
          {
            opacity: 1,
            clipPath: "inset(26% 24% 26% 24% round 24px)",
            duration: 0.45,
            ease: "power2.out",
          },
          t0
        )
        .to(
          s0,
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            duration: 0.7,
            ease: "power2.inOut",
          },
          t0 + 0.45
        )
        .fromTo(
          s0Img,
          { scale: 1.3, xPercent: 0 },
          { scale: 1, duration: 1.15, ease: "power2.out" },
          t0
        )
        .to(
          s0Img,
          { scale: 1.06, xPercent: -3, duration: 0.5, ease: "none" },
          t0 + 1.15
        )
        .fromTo(
          s0Copy,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" },
          t0 + 0.95
        )
        .to(s0Copy, { y: -24, duration: 0.5, ease: "none" }, t0 + 1.45)
        .fromTo(
          s0Num,
          { yPercent: 30, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
          t0 + 0.85
        )
        .to(s0Num, { yPercent: -10, duration: 0.5, ease: "none" }, t0 + 1.45)
        .to(b0, { scaleX: 1, duration: 0.5, ease: "none" }, t0 + 0.9);

      // Phase 3 & 4: Steps 02 & 03 Horizontal Wipe + Outgoing Parallax
      const wipePairs = [
        { prev: s0, next: s1, bar: b1, start: 2.8 },
        { prev: s1, next: s2, bar: b2, start: 4.4 },
      ];

      wipePairs.forEach(({ prev, next, bar, start }) => {
        const prevImg = prev.querySelector(".pr-bg");
        const prevCopy = prev.querySelectorAll(".pr-copy");
        const nextImg = next.querySelector(".pr-bg");
        const nextCopy = next.querySelectorAll(".pr-copy");
        const nextNum = next.querySelector(".pr-ghost-num");

        tl.to(
          next,
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.9,
            ease: "power2.inOut",
          },
          start
        )
          .to(
            prevImg,
            { xPercent: -13, duration: 0.9, ease: "power2.inOut" },
            start
          )
          .to(
            prevCopy,
            {
              x: -80,
              opacity: 0,
              stagger: 0.04,
              duration: 0.5,
              ease: "power2.in",
            },
            start
          )
          .fromTo(
            nextImg,
            { scale: 1.12, xPercent: 12 },
            { scale: 1, xPercent: 0, duration: 1.0, ease: "power2.out" },
            start
          )
          .to(
            nextImg,
            { scale: 1.06, xPercent: -3, duration: 0.5, ease: "none" },
            start + 1.0
          )
          .fromTo(
            nextCopy,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out" },
            start + 0.45
          )
          .to(nextCopy, { y: -24, duration: 0.5, ease: "none" }, start + 0.95)
          .fromTo(
            nextNum,
            { yPercent: 30, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
            start + 0.45
          )
          .to(nextNum, { yPercent: -10, duration: 0.5, ease: "none" }, start + 1.05)
          .to(bar, { scaleX: 1, duration: 0.5, ease: "none" }, start + 0.4);
      });
    });

    // Mobile Unpinned Statement Scrub (opacity 0.5 -> 1)
    mm.add("(max-width: 760px)", () => {
      const mWordEls = mobileWordsWrapRef.current?.querySelectorAll(".pr-m-word");
      if (!mWordEls || !mobileWordsWrapRef.current) return;
      gsap.fromTo(
        mWordEls,
        { opacity: 0.5 },
        {
          opacity: 1,
          stagger: { amount: 0.8 },
          ease: "none",
          scrollTrigger: {
            trigger: mobileWordsWrapRef.current,
            start: "top 85%",
            end: "bottom 50%",
            scrub: true,
          },
        }
      );
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
          const isOn = activeDesktopStep === i;
          return (
            <div
              key={step.num}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className={`pr-step pr-step-scrim ${
                isOn ? "is-on" : ""
              } absolute inset-0 z-20 flex items-center overflow-hidden bg-[var(--ink)]`}
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
                    {Array.from(step.title).map((ch, cIdx) => (
                      <span
                        key={cIdx}
                        className="pr-hop-char inline-block"
                        style={{ ["--i" as string]: cIdx }}
                      >
                        {ch === " " ? "\u00A0" : ch}
                      </span>
                    ))}
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
          <p
            ref={mobileWordsWrapRef}
            className="mt-4 font-display text-xl font-normal leading-snug text-[var(--ink)]"
          >
            {words.map((w, idx) => (
              <span key={idx} className="pr-m-word inline-block mr-[0.26em]">
                {w}
              </span>
            ))}
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
                className="pr-step-scrim relative min-h-[540px] w-[86%] max-w-[340px] shrink-0 snap-center overflow-hidden rounded-[20px] border-2 border-[var(--ink)] bg-[var(--ink)] p-6 flex flex-col justify-end"
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
              aria-disabled={mobileStep === 0}
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
              aria-disabled={mobileStep === PROCESS_CONTENT.steps.length - 1}
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
