"use client";

import { useEffect } from "react";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

export function ScrollReveals() {
  useEffect(() => {
    const { gsap, ScrollTrigger } = ensureGsap();
    const reduced = prefersReducedMotion();

    const splitTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-split]")
    );
    const originals = new Map<HTMLElement, string>();

    if (!reduced) {
      splitTargets.forEach((el) => {
        if (el.dataset.splitDone === "1") return;
        const text = el.textContent ?? "";
        originals.set(el, text);
        el.dataset.splitDone = "1";
        const words = text.trim().split(/\s+/);
        el.innerHTML = words
          .map(
            (w) =>
              `<span class="inline-block overflow-hidden align-bottom mr-[0.26em]"><span class="sw-word inline-block">${w}</span></span>`
          )
          .join("");
      });
    }

    const ctx = gsap.context(() => {
      if (reduced) {
        splitTargets.forEach((el) => el.classList.add("is-in"));
        return;
      }

      splitTargets.forEach((el, idx) => {
        const inner = el.querySelectorAll(".sw-word");
        if (!inner.length) return;
        const rect = el.getBoundingClientRect();
        const isAboveFold = rect.top < window.innerHeight * 0.9 && idx < 2;
        const delay = +(el.dataset.delay || (isAboveFold ? 0.08 : 0));

        if (isAboveFold) {
          gsap.fromTo(
            inner,
            { yPercent: 115, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.9,
              delay,
              ease: "power3.out",
              stagger: 0.035,
              onComplete: () => el.classList.add("is-in"),
            }
          );
        } else {
          gsap.fromTo(
            inner,
            { yPercent: 115, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.035,
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                once: true,
              },
              onComplete: () => el.classList.add("is-in"),
            }
          );
        }
      });

      const upTargets = document.querySelectorAll<HTMLElement>('[data-anim="up"]');
      upTargets.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              once: true,
            },
          }
        );
      });
    });

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      ctx.revert();
      originals.forEach((txt, el) => {
        el.textContent = txt;
        delete el.dataset.splitDone;
        el.classList.remove("is-in");
      });
    };
  }, []);

  return null;
}
