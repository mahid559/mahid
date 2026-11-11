"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

export function ToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = window.innerHeight * 0.6;
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <button
      id="to-top"
      type="button"
      onClick={scrollTop}
      aria-label="Scroll back to top"
      className="ghost-circle fixed left-[22px] bottom-[22px] z-[55] shadow-md"
      style={{
        transform: visible ? "translateY(0)" : "translateY(140%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition:
          "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease",
      }}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path
          d="M7.5 12.5V2.5M7.5 2.5L3 7M7.5 2.5L12 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

