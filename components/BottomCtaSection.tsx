"use client";

import { useRef } from "react";
import { BOTTOM_CTA_CONTENT } from "@/data/content";
import { scrollToSection } from "@/lib/gsap";
import { ShapeTrail } from "./ShapeTrail";

export function BottomCtaSection() {
  const bandRef = useRef<HTMLDivElement>(null);

  return (
    <section className="sec-block bg-[var(--paper)] pt-4">
      <div className="shell">
        <div
          ref={bandRef}
          data-anim="up"
          className="cta-brutal relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 sm:p-16"
        >
          <ShapeTrail containerRef={bandRef} />

          <div className="relative z-10 max-w-[54ch]">
            <h2 className="font-display text-[clamp(1.7rem,1.2rem+2vw,2.6rem)] font-extrabold text-[var(--ink)]">
              {BOTTOM_CTA_CONTENT.heading}
            </h2>
            <p className="mt-2.5 text-[var(--ink-soft)] leading-relaxed">
              {BOTTOM_CTA_CONTENT.body}
            </p>
          </div>

          <a
            href={BOTTOM_CTA_CONTENT.buttonHref}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(BOTTOM_CTA_CONTENT.buttonHref);
            }}
            className="relative z-10 pill-btn pill-dark shrink-0 self-start md:self-center px-6"
          >
            {BOTTOM_CTA_CONTENT.buttonLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
