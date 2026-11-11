"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACCENT_HEX,
  PROJECTS,
  PROJECTS_GRID_CONTENT,
  UI_LABELS,
} from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

export function ProjectsSection() {
  const categories = useMemo(
    () => [
      UI_LABELS.projectsAllFilter,
      ...Array.from(new Set(PROJECTS.map((p) => p.category))),
    ],
    []
  );
  const [selectedCat, setSelectedCat] = useState(UI_LABELS.projectsAllFilter);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (selectedCat === UI_LABELS.projectsAllFilter) return PROJECTS;
    return PROJECTS.filter((p) => p.category === selectedCat);
  }, [selectedCat]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion()) return;
    const { gsap } = ensureGsap();
    const cards = grid.querySelectorAll(".proj-card");
    if (!cards.length) return;
    gsap.fromTo(
      cards,
      { y: 18, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.05,
        ease: "power3.out",
        overwrite: true,
      }
    );
  }, [selectedCat]);

  return (
    <section
      id="projects"
      className="sec-block bg-[var(--tint)] border-b border-[var(--hair-soft)]"
    >
      <div className="shell">
        <div className="label">
          <span className="label-idx">{PROJECTS_GRID_CONTENT.kickerIndex}</span>
          <span>{PROJECTS_GRID_CONTENT.kickerLabel}</span>
        </div>
        <h2
          data-split
          className="mt-2 font-display text-[clamp(2rem,1.4rem+2.5vw,3.4rem)] font-extrabold"
        >
          {PROJECTS_GRID_CONTENT.heading}
        </h2>

        {/* Subhead with 1px horizontal line */}
        <div className="mt-8 flex items-center gap-4">
          <span className="mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)] shrink-0">
            {PROJECTS_GRID_CONTENT.subheadLabel} · {filtered.length}
          </span>
          <span className="h-px flex-1 bg-[var(--hair)]" aria-hidden="true" />
        </div>

        {/* Category Filter Pills */}
        <div className="mt-5 mb-7 flex flex-wrap gap-1.5" role="group" aria-label="Filter projects">
          {categories.map((cat) => {
            const active = cat === selectedCat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCat(cat)}
                className={`min-h-[40px] rounded-full px-3.5 py-2 mono text-[0.78rem] transition-colors cursor-pointer ${
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)] font-semibold"
                    : "text-[var(--ink-faint)] hover:bg-[var(--card)] hover:text-[var(--ink)]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 3-Column Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[22px]"
        >
          {filtered.map((proj) => {
            const accentHex = ACCENT_HEX[proj.accent];
            return (
              <article
                key={proj.id}
                className="proj-card flex flex-col"
                style={{ ["--accent" as string]: accentHex }}
              >
                <div className="aspect-[16/10] w-full overflow-hidden border-b border-[var(--hair)] bg-[#DCD9D0]">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3 p-[18px]">
                  <div>
                    <div
                      className="mono text-[0.68rem] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: accentHex }}
                    >
                      {proj.category}
                    </div>
                    <h3 className="mt-1 font-display text-xl font-extrabold text-[var(--ink)]">
                      {proj.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-[var(--ink-soft)] line-clamp-2">
                      {proj.summary}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {proj.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex h-[27px] items-center rounded-full border border-[var(--hair)] px-2.5 mono text-[0.7rem] text-[var(--ink-soft)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a href={proj.href} className="arrow-link pt-1">
                      <span>{PROJECTS_GRID_CONTENT.visitLabel}</span>
                      <span className="arrow-link-icon" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

