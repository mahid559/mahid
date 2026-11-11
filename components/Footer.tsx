"use client";

import {
  ACCENT_HEX,
  NAV_ITEMS,
  SITE_META,
  SOCIAL_LINKS,
} from "@/data/content";
import { scrollToSection } from "@/lib/gsap";
import { MorphShape } from "./MorphShape";

export function Footer() {
  return (
    <footer className="bg-[var(--shell)] pt-11 pb-7">
      <div className="shell">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-8">
          <div className="flex items-start gap-3">
            <span className="brand-icon mt-0.5">
              <MorphShape className="brand-dot" />
            </span>
            <div>
              <div className="mono text-sm font-bold text-[var(--ink)]">
                <span className="hl hl-name">{SITE_META.fullName}</span>
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--ink-soft)]">
                {SITE_META.role}
              </div>
              <a
                href={`mailto:${SITE_META.email}`}
                className="mt-0.5 inline-block mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
              >
                {SITE_META.email}
              </a>
            </div>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 min-[761px]:flex flex-wrap items-center gap-x-4 gap-y-2 min-[761px]:gap-2"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.href);
                }}
                className="hl px-3 py-1.5 text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)]"
                style={{ ["--c" as string]: ACCENT_HEX[item.accent] }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[var(--hair)] pt-6">
          <div className="mono text-xs text-[var(--ink-faint)]">
            {SITE_META.copyright}
          </div>

          <div className="mono text-xs text-[var(--ink-faint)]">
            {SITE_META.footerNote}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-pill"
              >
                <span>{s.label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

