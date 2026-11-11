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
  const [captionIdx, setCaptionIdx] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wipeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleInnerRef = useRef<HTMLSpanElement>(null);
  const lineInnerRef = useRef<HTMLSpanElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const posObj = useRef({ value: 0 });
  const activeIdxRef = useRef(0);
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

  // Entry diagonal wipe & caption reveal (ScrollTrigger start: "top 70%", once: true)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const { gsap } = ensureGsap();
    const reduced = prefersReducedMotion();

    const wipes = wipeRefs.current.filter((w): w is HTMLDivElement => w !== null);
    if (reduced) {
      gsap.set(wipes, { scaleX: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(wipes, { scaleX: 1 });
      const ordered = [...wipes].sort((a, b) => {
        const ai = Number(a.dataset.idx ?? 0);
        const bi = Number(b.dataset.idx ?? 0);
        let da = Math.abs((((ai - activeIdxRef.current) % total) + total) % total);
        if (da > total / 2) da = total - da;
        let db = Math.abs((((bi - activeIdxRef.current) % total) + total) % total);
        if (db > total / 2) db = total - db;
        return da - db;
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top 70%",
          once: true,
        },
      });

      tl.to(ordered, {
        scaleX: 0,
        duration: 0.9,
        ease: "power3.inOut",
        stagger: 0.12,
      });

      if (titleInnerRef.current) {
        tl.fromTo(
          titleInnerRef.current,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.65, ease: "power3.out" },
          0.35
        );
      }
      if (lineInnerRef.current) {
        tl.fromTo(
          lineInnerRef.current,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
          0.5
        );
      }
      if (controlsRef.current) {
        tl.fromTo(
          controlsRef.current,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" },
          0.55
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [total]);

  const goTo = useCallback(
    (nextRaw: number) => {
      const targetNorm = ((nextRaw % total) + total) % total;
      const cur = posObj.current.value;
      let delta = (((targetNorm - (cur % total)) + total) % total);
      if (delta > total / 2) delta -= total;
      const target = cur + delta;

      activeIdxRef.current = targetNorm;
      setActiveIdx(targetNorm);

      const { gsap } = ensureGsap();
      if (prefersReducedMotion()) {
        posObj.current.value = targetNorm;
        setCaptionIdx(targetNorm);
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

      const els = [titleInnerRef.current, lineInnerRef.current].filter(
        (x): x is HTMLSpanElement => x !== null
      );
      if (els.length) {
        gsap.killTweensOf(els);
        gsap
          .timeline()
          .to(els, {
            yPercent: -110,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
          })
          .add(() => setCaptionIdx(targetNorm), 0.25)
          .fromTo(
            els,
            { yPercent: 110, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power3.out",
              stagger: 0.05,
            },
            0.3
          );
      } else {
        setCaptionIdx(targetNorm);
      }
    },
    [placeSlides, total]
  );

  // Keyboard ArrowLeft / ArrowRight when carousel focused or hovered
  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    let pointerInside = false;
    const onEnter = () => {
      pointerInside = true;
    };
    const onLeave = () => {
      pointerInside = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const hasFocus = sec.contains(document.activeElement);
      if (!pointerInside && !hasFocus) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(activeIdxRef.current - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(activeIdxRef.current + 1);
      }
    };
    sec.addEventListener("pointerenter", onEnter);
    sec.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      sec.removeEventListener("pointerenter", onEnter);
      sec.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goTo]);

  // Pointer drag / swipe (> 50px) on stage
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let startX = 0;
    let tracking = false;

    const onDown = (e: PointerEvent) => {
      tracking = true;
      startX = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) {
        goTo(activeIdxRef.current + (dx < 0 ? 1 : -1));
      }
    };
    const onCancel = () => {
      tracking = false;
    };

    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [goTo]);

  const handleBtnFlair = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    e.currentTarget.style.setProperty("--hx", `${x.toFixed(1)}%`);
    e.currentTarget.style.setProperty("--hy", `${y.toFixed(1)}%`);
  };

  const captionItem = FEATURED[captionIdx] ?? FEATURED[0];

  return (
    <section
      ref={sectionRef}
      className="pt-[27px] pb-[92px] bg-[var(--shell)] overflow-x-clip"
    >
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
        <div ref={stageRef} className="sc-stage mt-4 touch-pan-y select-none">
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
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                  <div
                    ref={(el) => {
                      wipeRefs.current[i] = el;
                    }}
                    data-idx={i}
                    className="sc-wipe"
                    style={{ backgroundColor: accentHex }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Caption + Controls (Centered Masked Title + Right Arrow Controls) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-5">
          <div className="hidden md:block" aria-hidden="true" />

          <div className="min-w-0 text-center">
            <div className="overflow-hidden">
              <span ref={titleInnerRef} className="inline-block">
                <a
                  href={captionItem.href}
                  className="inline-flex items-baseline justify-center gap-2 font-display text-[clamp(1.8rem,1.1rem+2.2vw,3.3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[var(--ink)] hover:text-[var(--pink)] transition-colors"
                >
                  <span>{captionItem.title}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </span>
            </div>
            <div className="mt-1.5 overflow-hidden">
              <span
                ref={lineInnerRef}
                className="inline-block mono text-xs sm:text-[0.8rem] text-[var(--ink-faint)]"
              >
                {"{ "}
                {captionItem.category} · {captionItem.summary}
                {" }"}
              </span>
            </div>
          </div>

          <div
            ref={controlsRef}
            className="flex items-center justify-center md:justify-end gap-4 shrink-0"
          >
            <span className="mono text-xs font-semibold tracking-widest text-[var(--ink-faint)]">
              {String(activeIdx + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label={UI_LABELS.prevProjectAria}
                onPointerEnter={handleBtnFlair}
                onPointerLeave={handleBtnFlair}
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
                onPointerEnter={handleBtnFlair}
                onPointerLeave={handleBtnFlair}
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
