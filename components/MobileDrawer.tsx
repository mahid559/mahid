"use client";

import { useEffect, useRef } from "react";
import {
  ACCENT_HEX,
  HIRE_ME_CTA,
  NAV_ITEMS,
  SITE_META,
  SOCIAL_LINKS,
  UI_LABELS,
} from "@/data/content";
import { ensureGsap, prefersReducedMotion, scrollToSection } from "@/lib/gsap";

interface MobileDrawerProps {
  open: boolean;
  activeId: string;
  onClose: () => void;
  burgerRef: React.RefObject<HTMLButtonElement | null>;
}

export function MobileDrawer({
  open,
  activeId,
  onClose,
  burgerRef,
}: MobileDrawerProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();

      if (!prefersReducedMotion() && navRef.current) {
        const { gsap } = ensureGsap();
        const links = navRef.current.querySelectorAll("a[data-route]");
        if (links.length) {
          gsap.fromTo(
            links,
            { x: 26, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.05,
              ease: "power3.out",
              delay: 0.12,
              overwrite: true,
            }
          );
        }
      }

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      const onResize = () => {
        if (window.innerWidth > 1040) onClose();
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", onResize);
      };
    } else if (wasOpen.current) {
      wasOpen.current = false;
      document.body.style.overflow = "";
      burgerRef.current?.focus();
    }
  }, [open, onClose, burgerRef]);

  const handleNav = (href: string) => {
    onClose();
    window.setTimeout(() => scrollToSection(href), 120);
  };

  return (
    <>
      <div
        id="scrim"
        onClick={onClose}
        className={`fixed inset-0 z-[61] bg-[var(--veil)] transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />
      <aside
        id="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        inert={!open}
        className="fixed inset-y-0 right-0 z-[62] flex w-[min(360px,88vw)] flex-col justify-between border-l border-[var(--hair)] bg-[var(--shell)] p-6 shadow-2xl"
        style={{
          transform: open ? "translateX(0)" : "translateX(102%)",
          transition: "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-[var(--hair-soft)]">
            <span className="mono text-[0.75rem] font-semibold tracking-[0.16em] text-[var(--ink-faint)]">
              {UI_LABELS.drawerMenuLabel}
            </span>
            <button
              ref={closeBtnRef}
              id="close-drawer"
              type="button"
              onClick={onClose}
              className="ghost-circle"
              aria-label="Close navigation menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <nav ref={navRef} className="mt-4 flex flex-col" aria-label="Mobile sections">
            {NAV_ITEMS.map((item) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  data-route={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.href);
                  }}
                  className="flex items-baseline gap-4 border-b border-[var(--hair-soft)] py-4 text-left"
                >
                  <span className="mono text-xs text-[var(--ink-faint)]">{item.index}</span>
                  <span
                    className={`hl font-display text-2xl font-extrabold text-[var(--ink)] ${
                      isActive ? "is-active" : ""
                    }`}
                    style={{ ["--c" as string]: ACCENT_HEX[item.accent] }}
                  >
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>

          <div className="mt-6">
            <a
              href={HIRE_ME_CTA.href}
              onClick={(e) => {
                e.preventDefault();
                handleNav(HIRE_ME_CTA.href);
              }}
              className="pill-btn pill-primary w-full justify-center"
            >
              {HIRE_ME_CTA.label}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--hair-soft)] flex flex-col gap-3">
          <a
            href={`mailto:${SITE_META.email}`}
            className="mono text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            {SITE_META.email}
          </a>
          <div className="flex flex-wrap gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

