"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACCENT_HEX,
  BRAND_WORDS,
  HIRE_ME_CTA,
  NAV_ITEMS,
  SITE_META,
  UI_LABELS,
} from "@/data/content";
import { ensureGsap, prefersReducedMotion, scrollToSection } from "@/lib/gsap";
import { MorphShape } from "./MorphShape";
import { MobileDrawer } from "./MobileDrawer";

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState("portfolio");
  const [wordIndex, setWordIndex] = useState(0);

  const progressRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  // Scroll progress bar + active section tracking
  useEffect(() => {
    const { gsap, ScrollTrigger } = ensureGsap();
    const reduced = prefersReducedMotion();

    const ctx = gsap.context(() => {
      if (progressRef.current) {
        if (reduced) {
          gsap.set(progressRef.current, { scaleX: 0 });
        } else {
          gsap.fromTo(
            progressRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: document.documentElement,
                start: "top top",
                end: "max",
                scrub: 0.3,
              },
            }
          );
        }
      }

      NAV_ITEMS.forEach((item) => {
        const el = document.getElementById(item.id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 45%",
          end: "bottom 45%",
          onEnter: () => setActiveId(item.id),
          onEnterBack: () => setActiveId(item.id),
        });
      });
    });

    return () => ctx.revert();
  }, []);

  // Brand word vertical cycling every 2.4s (with opacity matching reference)
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap } = ensureGsap();
    const interval = window.setInterval(() => {
      const el = wordRef.current;
      if (!el) {
        setWordIndex((i) => (i + 1) % BRAND_WORDS.length);
        return;
      }
      gsap.to(el, {
        yPercent: -110,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setWordIndex((i) => (i + 1) % BRAND_WORDS.length);
          gsap.fromTo(
            el,
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
          );
        },
      });
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

  const handleBrandClick = () => {
    scrollToSection("#portfolio");
    if (!prefersReducedMotion() && wordRef.current) {
      const { gsap } = ensureGsap();
      gsap.to(wordRef.current, {
        yPercent: -110,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          setWordIndex((i) => (i + 1) % BRAND_WORDS.length);
          gsap.fromTo(
            wordRef.current,
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.4, ease: "back.out(2)" }
          );
        },
      });
    } else {
      setWordIndex((i) => (i + 1) % BRAND_WORDS.length);
    }
  };

  return (
    <>
      {/* Scroll Progress Bar fixed at top edge */}
      <div
        ref={progressRef}
        id="progress"
        className="fixed top-0 left-0 right-0 z-[56] h-[2px] origin-left bg-[var(--pink)]"
        style={{ transform: "scaleX(0)" }}
        aria-hidden="true"
      />

      <header className="topbar flex items-center">
        <div className="topbar-shell flex items-center justify-between gap-[14px] py-2">
          {/* Left Brand */}
          <button
            id="brand"
            type="button"
            onClick={handleBrandClick}
            className="brand-btn flex items-center gap-3 text-left cursor-pointer min-w-0"
          >
            <span className="brand-icon">
              <MorphShape className="brand-dot" />
            </span>
            <span className="mono flex flex-col min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-2 text-[0.72rem] sm:text-[0.82rem] min-[1200px]:text-[0.86rem] font-bold leading-[1.25] tracking-normal min-w-0">
              <span className="hl hl-name whitespace-nowrap">
                {SITE_META.fullName},
              </span>
              <span className="flex items-center gap-1.5 text-[0.68rem] sm:text-[0.76rem] min-[1200px]:text-[0.86rem]">
                <span className="text-[var(--ink-faint)]">
                  {UI_LABELS.navbarConnector}
                </span>
                <span className="inline-block overflow-hidden align-bottom">
                  <span
                    ref={wordRef}
                    id="brand-word"
                    className="inline-block text-[var(--pink-ink)] whitespace-nowrap"
                  >
                    {BRAND_WORDS[wordIndex]}
                  </span>
                </span>
              </span>
            </span>
          </button>

          {/* Right Nav + Hire Me + Mobile Burger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <nav
              className="hidden min-[1040px]:flex items-center gap-[4px]"
              aria-label="Primary navigation"
            >
              {NAV_ITEMS.map((item) => {
                const isCurrent = activeId === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.href);
                    }}
                    className={`hl nav-hl px-[12px] py-[8px] text-[0.9rem] font-semibold transition-colors ${
                      isCurrent
                        ? "text-[var(--ink)]"
                        : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                    }`}
                    style={{ ["--c" as string]: ACCENT_HEX[item.accent] }}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <a
              href={HIRE_ME_CTA.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(HIRE_ME_CTA.href);
              }}
              className="hidden sm:inline-flex pill-btn pill-dark !min-h-[38px] !px-4 !py-1.5 text-[0.84rem] whitespace-nowrap"
            >
              {HIRE_ME_CTA.label}
              <span aria-hidden="true">→</span>
            </a>

            <button
              ref={burgerRef}
              id="burger"
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="ghost-circle min-[1040px]:hidden"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="drawer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H13.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        activeId={activeId}
        onClose={() => setDrawerOpen(false)}
        burgerRef={burgerRef}
      />
    </>
  );
}

