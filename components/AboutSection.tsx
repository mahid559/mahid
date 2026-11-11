"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ABOUT_CONTENT, ACCENT_HEX } from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

const UPPER_POOL = "ABDEFGHKMNPRSTUVXYZ";
const LOWER_POOL = "abdefghkmnprstuvxyz";
const DIGIT_POOL = "0123456789";

function randGlyph(orig: string): string {
  if (orig >= "0" && orig <= "9") {
    return DIGIT_POOL[Math.floor(Math.random() * DIGIT_POOL.length)];
  }
  if (orig >= "A" && orig <= "Z") {
    return UPPER_POOL[Math.floor(Math.random() * UPPER_POOL.length)];
  }
  return LOWER_POOL[Math.floor(Math.random() * LOWER_POOL.length)];
}

export function AboutSection() {
  const [activeTrack, setActiveTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  const [caretVisible, setCaretVisible] = useState(true);
  const [glitchMap, setGlitchMap] = useState<Record<number, string>>({});
  const [hoveredCode, setHoveredCode] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const sleeveRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const tracksWrapRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const typingStarted = useRef(false);

  const codeTokens = useMemo(() => {
    const tokens: { text: string; cls: string }[] = [
      { text: "const ", cls: "text-[var(--pink-ink)] font-semibold" },
      { text: ABOUT_CONTENT.codeSnippet.varName, cls: "text-[var(--blue)] font-semibold" },
      { text: " = {\n", cls: "text-[var(--ink)]" },
    ];
    ABOUT_CONTENT.codeSnippet.entries.forEach((entry, idx) => {
      tokens.push({ text: "  ", cls: "" });
      tokens.push({
        text: entry.key,
        cls: "text-[color-mix(in_srgb,var(--blue)_82%,var(--ink))]",
      });
      tokens.push({ text: ": ", cls: "text-[var(--ink-faint)]" });
      tokens.push({ text: entry.value, cls: "text-[var(--mint-ink)]" });
      tokens.push({
        text: idx < ABOUT_CONTENT.codeSnippet.entries.length - 1 ? ",\n" : "\n",
        cls: "text-[var(--ink-faint)]",
      });
    });
    tokens.push({ text: "};", cls: "text-[var(--ink)]" });
    return tokens;
  }, []);

  const totalChars = useMemo(
    () => codeTokens.reduce((sum, t) => sum + t.text.length, 0),
    [codeTokens]
  );

  // Flat source string + alphanumeric word ranges for multi-word scramble glitch
  const { flatText, wordRanges } = useMemo(() => {
    const flat = codeTokens.map((t) => t.text).join("");
    const ranges: { start: number; end: number }[] = [];
    const re = /[A-Za-z0-9]{2,}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(flat)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
    return { flatText: flat, wordRanges: ranges };
  }, [codeTokens]);

  // Turntable + Tracklist Entrance
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const { gsap } = ensureGsap();
    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      const trackEls = tracksWrapRef.current?.querySelectorAll(".a5-track");
      if (reduced) {
        setPlaying(true);
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          once: true,
        },
        delay: 0.15,
      });

      if (trackEls && trackEls.length) {
        tl.fromTo(
          trackEls,
          { yPercent: 60, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: "power3.out" }
        );
      }

      if (sleeveRef.current) {
        tl.fromTo(
          sleeveRef.current,
          { y: 28, rotation: -4, opacity: 0 },
          { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          0.1
        );
      }

      if (discRef.current) {
        tl.fromTo(
          discRef.current,
          { xPercent: -34, opacity: 0 },
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.inOut",
            onComplete: () => setPlaying(true),
          },
          0.45
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  // Visual track cycle every 2.6s when spinning
  useEffect(() => {
    if (prefersReducedMotion() || !playing) return;
    const id = window.setInterval(() => {
      setActiveTrack((i) => (i + 1) % ABOUT_CONTENT.tracks.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [playing]);

  // Codeblock typewriter on scroll + fade caret out after 1.2s
  useEffect(() => {
    const codeEl = codeRef.current;
    if (!codeEl) return;
    const { gsap, ScrollTrigger } = ensureGsap();

    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => {
        setTypedCount(totalChars);
        setCaretVisible(false);
      }, 0);
      return () => window.clearTimeout(id);
    }

    let caretTimer: number | null = null;
    const st = ScrollTrigger.create({
      trigger: codeEl,
      start: "top 92%",
      once: true,
      onEnter: () => {
        if (typingStarted.current) return;
        typingStarted.current = true;
        const obj = { count: 0 };
        gsap.to(obj, {
          count: totalChars,
          duration: totalChars * 0.016,
          ease: "none",
          onUpdate: () => setTypedCount(Math.round(obj.count)),
          onComplete: () => {
            setTypedCount(totalChars);
            caretTimer = window.setTimeout(() => setCaretVisible(false), 1200);
          },
        });
      },
    });

    return () => {
      st.kill();
      if (caretTimer) window.clearTimeout(caretTimer);
    };
  }, [totalChars]);

  // Reference-matched 5–8 word scramble glitch every 1–3s (pauses on hover/selection/pause)
  useEffect(() => {
    if (
      prefersReducedMotion() ||
      typedCount < totalChars ||
      hoveredCode ||
      !playing ||
      !wordRanges.length
    ) {
      return;
    }

    let cancelled = false;
    let mainTimer: number | null = null;
    let tickTimer: number | null = null;

    const scheduleNext = () => {
      if (cancelled) return;
      const waitMs = 1000 + Math.random() * 2000;
      mainTimer = window.setTimeout(runGlitch, waitMs);
    };

    const runGlitch = () => {
      if (cancelled) return;
      // Pause if user is selecting text inside codeblock
      const sel = window.getSelection?.();
      if (
        sel &&
        !sel.isCollapsed &&
        codeRef.current &&
        codeRef.current.contains(sel.anchorNode)
      ) {
        scheduleNext();
        return;
      }

      // Pick 5–8 random word ranges
      const count = Math.min(wordRanges.length, 5 + Math.floor(Math.random() * 4));
      const pool = [...wordRanges];
      const chosen: { start: number; end: number }[] = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        chosen.push(pool.splice(idx, 1)[0]);
      }

      const holdSteps = 4 + Math.floor(Math.random() * 4); // 4–7 ticks
      const maxWordLen = Math.max(...chosen.map((r) => r.end - r.start));
      let step = 0;

      const stepTick = () => {
        if (cancelled) return;
        step++;
        if (step <= holdSteps) {
          const nextMap: Record<number, string> = {};
          chosen.forEach((r) => {
            for (let p = r.start; p < r.end; p++) {
              nextMap[p] = randGlyph(flatText[p]);
            }
          });
          setGlitchMap(nextMap);
          tickTimer = window.setTimeout(stepTick, 60);
        } else {
          // Resolve letter-by-letter
          const resolvedCount = step - holdSteps;
          if (resolvedCount <= maxWordLen) {
            const nextMap: Record<number, string> = {};
            chosen.forEach((r) => {
              for (let p = r.start + resolvedCount; p < r.end; p++) {
                nextMap[p] = randGlyph(flatText[p]);
              }
            });
            setGlitchMap(nextMap);
            tickTimer = window.setTimeout(stepTick, 55);
          } else {
            setGlitchMap({});
            scheduleNext();
          }
        }
      };

      stepTick();
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (mainTimer) window.clearTimeout(mainTimer);
      if (tickTimer) window.clearTimeout(tickTimer);
      setGlitchMap({});
    };
  }, [typedCount, totalChars, hoveredCode, playing, flatText, wordRanges]);

  const currentTrack = ABOUT_CONTENT.tracks[activeTrack] ?? ABOUT_CONTENT.tracks[0];
  const currentAccent = ACCENT_HEX[currentTrack.accent];

  // Render typed tokens with glitch substitution
  let globalOffset = 0;
  const renderedTokens = codeTokens.map((tok, tIdx) => {
    const start = globalOffset;
    globalOffset += tok.text.length;
    if (typedCount <= start) return null;
    const sliceLen = Math.min(tok.text.length, typedCount - start);
    const chars = Array.from(tok.text.slice(0, sliceLen)).map((ch, cIdx) => {
      const gIdx = start + cIdx;
      const glitched = glitchMap[gIdx];
      if (glitched && ch !== "\n" && ch !== " ") {
        return (
          <span key={cIdx} className="text-[var(--pink-ink)] font-bold">
            {glitched}
          </span>
        );
      }
      return ch;
    });
    return (
      <span key={tIdx} className={tok.cls}>
        {chars}
      </span>
    );
  });

  return (
    <section
      id="about-bio"
      ref={sectionRef}
      className={`a5-deck-scope ${playing ? "is-playing" : ""} sec-block bg-[var(--paper)]`}
    >
      <div className="shell">
        {/* Top 2-column Turntable + Tracklist */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 items-center gap-8 min-[900px]:gap-[clamp(32px,6vw,96px)]">
          {/* Visual Vinyl Deck */}
          <div>
            <div className={`a5-deck ${playing ? "is-playing" : ""} mx-auto`}>
              {/* Vinyl Disc */}
              <div
                ref={discRef}
                className="a5-disc"
                style={{ ["--c" as string]: currentAccent }}
              >
                <div className="a5-disc-spin">
                  <div className="a5-sheen" />
                  <div className="a5-label">
                    <img
                      src={ABOUT_CONTENT.sleeveImage}
                      alt="[DISC LABEL PLACEHOLDER]"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="a5-hole" />
                </div>
              </div>

              {/* Record Sleeve */}
              <div ref={sleeveRef} className="a5-sleeve">
                <img
                  src={ABOUT_CONTENT.sleeveImage}
                  alt="[ALBUM SLEEVE PLACEHOLDER]"
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 grid h-[46px] w-[46px] place-items-center rounded-full bg-[var(--pink)] mono text-[0.58rem] font-bold text-white shadow-md -rotate-12">
                  {ABOUT_CONTENT.stickerText}
                </span>
                <div
                  className="absolute inset-x-0 bottom-0 p-3.5 text-white"
                  style={{
                    background:
                      "linear-gradient(transparent, rgba(19, 17, 26, 0.82))",
                  }}
                >
                  <span className="mono text-[0.7rem] tracking-wider uppercase">
                    {ABOUT_CONTENT.sleeveCaption}
                  </span>
                </div>
              </div>

              {/* Original Inline SVG Tonearm */}
              <svg
                className="a5-arm"
                viewBox="0 0 120 210"
                fill="none"
                style={{
                  transform: playing ? "rotate(0deg)" : "rotate(-30deg)",
                }}
                aria-hidden="true"
              >
                <circle
                  cx="88"
                  cy="26"
                  r="16"
                  fill="#E4E1D8"
                  stroke="#9A968B"
                  strokeWidth="2"
                />
                <circle cx="88" cy="26" r="5.5" fill="#78746B" />
                <path
                  d="M86 38 L78 135 L54 176"
                  stroke="#B8B4AA"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="43"
                  y="168"
                  width="18"
                  height="24"
                  rx="4"
                  transform="rotate(24 43 168)"
                  fill="#4D4860"
                />
              </svg>
            </div>
          </div>

          {/* Right Tracklist */}
          <div>
            <div className="label">
              <span className="label-idx">{ABOUT_CONTENT.kickerIndex}</span>
              <span>{ABOUT_CONTENT.kickerLabel}</span>
            </div>

            <div
              ref={tracksWrapRef}
              className="mt-5 flex flex-col gap-1.5"
            >
              {ABOUT_CONTENT.tracks.map((tr, i) => {
                const isActive = i === activeTrack;
                const accent = ACCENT_HEX[tr.accent];
                return (
                  <button
                    key={tr.code}
                    type="button"
                    onClick={() => {
                      setActiveTrack(i);
                      setPlaying(true);
                    }}
                    className={`a5-track flex items-center justify-between gap-4 py-1 text-left cursor-pointer ${
                      isActive ? "is-active" : ""
                    }`}
                    style={{ ["--c" as string]: accent }}
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="mono text-xs text-[var(--ink-faint)]">
                        {tr.code}
                      </span>
                      <span className="a5-w font-display text-[clamp(2.2rem,1.6rem+2.5vw,4.5rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-[var(--ink)]">
                        {tr.title}
                      </span>
                    </span>

                    {isActive && (
                      <span className="a5-eq shrink-0" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom 2-column Bio + Interactive Codeblock */}
        <div className="mt-[clamp(40px,6vw,84px)] grid grid-cols-1 min-[900px]:grid-cols-2 gap-8 min-[900px]:gap-[clamp(32px,6vw,96px)] border-t border-[var(--hair)] pt-12 items-center">
          <div className="space-y-4 text-[var(--ink-soft)]">
            {ABOUT_CONTENT.bioParagraphs.map((p, idx) => {
              const hl = ABOUT_CONTENT.bioHighlight;
              const parts = idx === 0 && p.includes(hl) ? p.split(hl) : null;
              return (
                <p key={idx} data-anim="up" className="leading-relaxed">
                  {parts ? (
                    <>
                      {parts[0]}
                      <span className="a5-role">{hl}</span>
                      {parts[1]}
                    </>
                  ) : (
                    p
                  )}
                </p>
              );
            })}
          </div>

          <div
            ref={codeRef}
            onPointerEnter={() => setHoveredCode(true)}
            onPointerLeave={() => setHoveredCode(false)}
            className="rounded-[14px] border p-[26px] mono text-[12.16px] leading-[21.89px] overflow-x-auto"
            style={{
              background: "color-mix(in srgb, var(--blue) 9%, transparent)",
              borderColor: "color-mix(in srgb, var(--blue) 22%, transparent)",
            }}
          >
            <pre className="m-0 whitespace-pre-wrap break-words font-[inherit]">
              <code>
                {renderedTokens}
                <span
                  className={`a5-caret transition-opacity duration-300 ${
                    caretVisible ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
