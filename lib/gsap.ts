"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function ensureGsap() {
  if (typeof window !== "undefined" && !registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToSection(href: string) {
  if (typeof window === "undefined") return;
  const id = href.replace(/^#/, "");
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = prefersReducedMotion();
  const topbar = document.querySelector(".topbar") as HTMLElement | null;
  const offset = topbar ? topbar.offsetHeight : 66;
  const y = el.getBoundingClientRect().top + window.scrollY - offset + 2;
  window.scrollTo({
    top: Math.max(0, y),
    behavior: reduced ? "auto" : "smooth",
  });
}

export function splitChars(text: string): string[] {
  return Array.from(text);
}

export function stampIn(
  chars: HTMLElement[] | NodeListOf<Element>,
  options?: { delay?: number; stagger?: number; duration?: number }
) {
  const { gsap: g } = ensureGsap();
  if (prefersReducedMotion()) {
    g.set(chars, { yPercent: 0, opacity: 1 });
    return;
  }
  return g.fromTo(
    chars,
    { yPercent: 40, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: options?.duration ?? 0.6,
      ease: "back.out(1.6)",
      stagger: options?.stagger ?? 0.035,
      delay: options?.delay ?? 0,
    }
  );
}

