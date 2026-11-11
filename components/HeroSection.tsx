"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACCENT_HEX,
  HERO_CONTENT,
  SITE_META,
  SOCIAL_LINKS,
  UI_LABELS,
} from "@/data/content";
import {
  ensureGsap,
  prefersReducedMotion,
  scrollToSection,
  stampIn,
} from "@/lib/gsap";

const DOT_SHAPES = [
  "polygon(50% 5%, 76% 14%, 93% 36%, 93% 64%, 76% 86%, 50% 95%, 24% 86%, 7% 64%, 7% 36%, 24% 14%)",
  "polygon(12% 12%, 50% 12%, 88% 12%, 88% 50%, 88% 88%, 50% 88%, 12% 88%, 12% 50%, 12% 28%, 12% 12%)",
  "polygon(50% 6%, 65% 34%, 80% 60%, 94% 88%, 65% 88%, 50% 88%, 35% 88%, 6% 88%, 20% 60%, 35% 34%)",
  "polygon(50% 4%, 73% 27%, 96% 50%, 73% 73%, 50% 96%, 27% 73%, 4% 50%, 27% 27%, 38% 15%, 50% 4%)",
  "polygon(50% 3%, 63% 35%, 97% 38%, 71% 59%, 79% 93%, 50% 73%, 21% 93%, 29% 59%, 3% 38%, 37% 35%)",
];

const DOT_COLORS = [
  ACCENT_HEX.pink,
  ACCENT_HEX.blue,
  ACCENT_HEX.yellow,
  ACCENT_HEX.mint,
];

const ROPE_NODES = 12;

export function HeroSection() {
  const [bops, setBops] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeWrapRef = useRef<HTMLDivElement>(null);
  const strapPathRef = useRef<SVGPathElement>(null);
  const strapShadowRef = useRef<SVGPathElement>(null);
  const strapTextRef = useRef<SVGTextPathElement>(null);

  // Entrance timeline triggered when preloader finishes
  useEffect(() => {
    const { gsap } = ensureGsap();
    const reduced = prefersReducedMotion();
    let entered = false;

    const runEnter = () => {
      if (entered) return;
      entered = true;

      const chars = h1Ref.current?.querySelectorAll(".hero-char");
      const fadeItems = copyRef.current?.querySelectorAll(".hero-fade");

      if (reduced) {
        if (chars) gsap.set(chars, { yPercent: 0, opacity: 1 });
        if (fadeItems) gsap.set(fadeItems, { y: 0, opacity: 1 });
        if (dotRef.current) gsap.set(dotRef.current, { scale: 1, opacity: 1 });
        return;
      }

      if (chars && chars.length) {
        stampIn(chars, { delay: 0.08, stagger: 0.035, duration: 0.6 });
      }
      if (fadeItems && fadeItems.length) {
        gsap.fromTo(
          fadeItems,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.07,
            ease: "power3.out",
            delay: 0.28,
          }
        );
      }

      if (dotRef.current) {
        gsap.fromTo(
          dotRef.current,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.45,
            ease: "back.out(3)",
            delay: 1.2,
            onComplete: () => {
              if (!dotRef.current) return;
              gsap
                .timeline()
                .to(dotRef.current, {
                  scaleX: 1.35,
                  scaleY: 0.65,
                  duration: 0.14,
                  ease: "power2.out",
                })
                .to(dotRef.current, {
                  scaleX: 1,
                  scaleY: 1,
                  duration: 0.22,
                  ease: "back.out(2)",
                });
            },
          }
        );
      }
    };

    const onDone = () => runEnter();
    window.addEventListener("preloader:done", onDone);
    const fallback = window.setTimeout(runEnter, 3600);

    return () => {
      window.removeEventListener("preloader:done", onDone);
      window.clearTimeout(fallback);
    };
  }, []);

  // Verlet Rope Lanyard + Bouncy Dot Physics
  useEffect(() => {
    const heroEl = heroRef.current;
    const stageEl = stageRef.current;
    const badgeEl = badgeWrapRef.current;
    const dotEl = dotRef.current;
    const strapPath = strapPathRef.current;
    const strapShadow = strapShadowRef.current;
    const strapText = strapTextRef.current;

    if (!heroEl || !stageEl || !badgeEl || !strapPath || !strapShadow) return;
    if (prefersReducedMotion()) return;

    const G = 1900;
    const DT = 1 / 120;
    const DAMP = 0.986;
    const ITER = 14;

    const px = new Float32Array(ROPE_NODES);
    const py = new Float32Array(ROPE_NODES);
    const ox = new Float32Array(ROPE_NODES);
    const oy = new Float32Array(ROPE_NODES);

    const getSegLen = () => (window.innerWidth <= 760 ? 6.5 : 9.5);

    const initRope = () => {
      const w = stageEl.clientWidth || 320;
      const ax = w / 2;
      const seg = getSegLen();
      for (let i = 0; i < ROPE_NODES; i++) {
        px[i] = ox[i] = ax + Math.sin(i * 0.25) * 3;
        py[i] = oy[i] = i * seg;
      }
      // Initial slight pendulum kick
      ox[ROPE_NODES - 1] -= 16;
    };
    initRope();

    let dragging = false;
    let dragX = 0;
    let dragY = 0;
    let pointerDownTime = 0;
    let pointerMoved = false;

    const onBadgePointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      dragging = true;
      pointerMoved = false;
      pointerDownTime = performance.now();
      const rect = stageEl.getBoundingClientRect();
      dragX = e.clientX - rect.left;
      dragY = e.clientY - rect.top;
      badgeEl.setPointerCapture?.(e.pointerId);
    };

    const onStagePointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const rect = stageEl.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      if (Math.hypot(nx - dragX, ny - dragY) > 5) pointerMoved = true;
      dragX = nx;
      dragY = ny;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      if (!pointerMoved && performance.now() - pointerDownTime < 260) {
        setFlipped((f) => !f);
      }
    };

    badgeEl.addEventListener("pointerdown", onBadgePointerDown);
    window.addEventListener("pointermove", onStagePointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Bouncy dot state (spawn clear of the hanging badge on mobile & desktop)
    const heroRect0 = heroEl.getBoundingClientRect();
    let dx = window.innerWidth <= 760 ? 36 : Math.max(40, heroRect0.width * 0.25);
    let dy =
      window.innerWidth <= 760
        ? Math.max(490, heroRect0.height - 180)
        : Math.max(60, heroRect0.height * 0.22);
    let vx = 170;
    let vy = 115;
    const R = 10;
    let dotShapeIdx = 0;
    let lastBopAt = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    let strapOffset = 0;

    const triggerBop = (extraImpulseX = 0, extraImpulseY = 0) => {
      const now = performance.now();
      if (now - lastBopAt < 90) return;
      lastBopAt = now;
      dotShapeIdx = (dotShapeIdx + 1) % DOT_SHAPES.length;
      if (dotEl) {
        dotEl.style.clipPath = DOT_SHAPES[dotShapeIdx];
        dotEl.style.backgroundColor = DOT_COLORS[dotShapeIdx % DOT_COLORS.length];
      }
      vx += extraImpulseX;
      vy += extraImpulseY;
      setBops((b) => b + 1);
    };

    const onHeroPointerMove = (e: PointerEvent) => {
      const r = heroEl.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    };
    const onHeroPointerLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };
    const onHeroClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      const r = heroEl.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const ang = Math.atan2(dy - cy, dx - cx);
      vx = Math.cos(ang) * 320;
      vy = Math.sin(ang) * 320 - 80;
      triggerBop();
    };

    heroEl.addEventListener("pointermove", onHeroPointerMove);
    heroEl.addEventListener("pointerleave", onHeroPointerLeave);
    heroEl.addEventListener("click", onHeroClick);

    let active = true;
    let lastTime = performance.now();
    let acc = 0;
    let rafId = 0;

    const stepRope = (ax: number) => {
      px[0] = ox[0] = ax;
      py[0] = ox[0] * 0; // 0
      py[0] = oy[0] = 0;

      for (let i = 1; i < ROPE_NODES; i++) {
        const vxNode = (px[i] - ox[i]) * DAMP;
        const vyNode = (py[i] - oy[i]) * DAMP;
        ox[i] = px[i];
        oy[i] = py[i];
        px[i] += vxNode;
        py[i] += vyNode + G * DT * DT;
      }

      if (dragging) {
        px[ROPE_NODES - 1] = dragX;
        py[ROPE_NODES - 1] = Math.max(40, Math.min(240, dragY - 40));
      }

      for (let iter = 0; iter < ITER; iter++) {
        const seg = getSegLen();
        px[0] = ax;
        py[0] = 0;
        for (let i = 0; i < ROPE_NODES - 1; i++) {
          const ddx = px[i + 1] - px[i];
          const ddy = py[i + 1] - py[i];
          const dist = Math.hypot(ddx, ddy) || 0.0001;
          const diff = (dist - seg) / dist;
          if (i === 0) {
            px[i + 1] -= ddx * diff;
            py[i + 1] -= ddy * diff;
          } else {
            px[i] += ddx * diff * 0.5;
            py[i] += ddy * diff * 0.5;
            px[i + 1] -= ddx * diff * 0.5;
            py[i + 1] -= ddy * diff * 0.5;
          }
        }
      }
    };

    const tick = (now: number) => {
      if (!active) return;
      const elapsed = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // 1. Step Verlet rope
      const stageW = stageEl.clientWidth || 320;
      const ax = stageW / 2;
      acc += elapsed;
      let steps = 0;
      while (acc >= DT && steps < 4) {
        stepRope(ax);
        acc -= DT;
        steps++;
      }

      // Render rope SVG
      let d = `M ${px[0].toFixed(1)} ${py[0].toFixed(1)}`;
      for (let i = 1; i < ROPE_NODES - 1; i++) {
        const xc = (px[i] + px[i + 1]) * 0.5;
        const yc = (py[i] + py[i + 1]) * 0.5;
        d += ` Q ${px[i].toFixed(1)} ${py[i].toFixed(1)} ${xc.toFixed(1)} ${yc.toFixed(1)}`;
      }
      d += ` L ${px[ROPE_NODES - 1].toFixed(1)} ${py[ROPE_NODES - 1].toFixed(1)}`;
      strapPath.setAttribute("d", d);
      strapShadow.setAttribute("d", d);

      // Scroll strap text
      strapOffset = (strapOffset + elapsed * 18) % 100;
      if (strapText) {
        strapText.setAttribute("startOffset", `${strapOffset.toFixed(1)}%`);
      }

      // Position badge from bottom rope segment with natural ~-3deg rest tilt
      const tipX = px[ROPE_NODES - 1];
      const tipY = py[ROPE_NODES - 1];
      const prevX = px[ROPE_NODES - 3];
      const prevY = py[ROPE_NODES - 3];
      const angleRad = Math.atan2(tipX - prevX, tipY - prevY);
      const angleDeg = Math.max(-28, Math.min(28, -(angleRad * 180) / Math.PI - 2.6));
      badgeEl.style.transform = `translate3d(${(tipX - stageW / 2).toFixed(1)}px, ${tipY.toFixed(1)}px, 0) rotate(${angleDeg.toFixed(2)}deg)`;

      // 2. Step bouncy dot
      if (dotEl) {
        const hw = heroEl.clientWidth;
        const hh = heroEl.clientHeight;
        vy += 320 * elapsed; // light gravity
        dx += vx * elapsed;
        dy += vy * elapsed;

        if (dx < R + 12) {
          dx = R + 12;
          vx = Math.abs(vx) * 0.94 + 20;
          triggerBop();
        } else if (dx > hw - R - 12) {
          dx = hw - R - 12;
          vx = -Math.abs(vx) * 0.94 - 20;
          triggerBop();
        }
        if (dy < R + 12) {
          dy = R + 12;
          vy = Math.abs(vy) * 0.92;
          triggerBop();
        } else if (dy > hh - R - 26) {
          dy = hh - R - 26;
          vy = -Math.max(220, Math.abs(vy) * 0.9);
          triggerBop();
        }

        // Cursor collision
        const distMouse = Math.hypot(dx - mouseX, dy - mouseY);
        if (distMouse < 44 && distMouse > 0.1) {
          const nx = (dx - mouseX) / distMouse;
          const ny = (dy - mouseY) / distMouse;
          dx = mouseX + nx * 44;
          dy = mouseY + ny * 44;
          vx = nx * 280;
          vy = ny * 280 - 60;
          triggerBop();
        }

        // Badge collision: eject dot cleanly to nearest AABB edge + gentle lanyard nudge
        const bRect = badgeEl.getBoundingClientRect();
        const hRect = heroEl.getBoundingClientRect();
        const bx = bRect.left - hRect.left;
        const by = bRect.top - hRect.top;
        const bw = bRect.width;
        const bh = bRect.height;
        if (
          dx + R > bx &&
          dx - R < bx + bw &&
          dy + R > by &&
          dy - R < by + bh
        ) {
          const penLeft = dx + R - bx;
          const penRight = bx + bw - (dx - R);
          const penTop = dy + R - by;
          const penBottom = by + bh - (dy - R);
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);

          if (minPen === penLeft) {
            dx = bx - R - 2;
            vx = -Math.max(160, Math.abs(vx));
            ox[ROPE_NODES - 1] -= 2.5;
          } else if (minPen === penRight) {
            dx = bx + bw + R + 2;
            vx = Math.max(160, Math.abs(vx));
            ox[ROPE_NODES - 1] += 2.5;
          } else if (minPen === penTop) {
            dy = by - R - 2;
            vy = -Math.max(180, Math.abs(vy));
          } else {
            dy = by + bh + R + 2;
            vy = Math.max(180, Math.abs(vy));
          }
          triggerBop();
        }

        // Clamp speed
        const speed = Math.hypot(vx, vy);
        if (speed > 440) {
          vx = (vx / speed) * 440;
          vy = (vy / speed) * 440;
        }

        dotEl.style.transform = `translate3d(${(dx - R).toFixed(1)}px, ${(dy - R).toFixed(1)}px, 0)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
      badgeEl.removeEventListener("pointerdown", onBadgePointerDown);
      window.removeEventListener("pointermove", onStagePointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      heroEl.removeEventListener("pointermove", onHeroPointerMove);
      heroEl.removeEventListener("pointerleave", onHeroPointerLeave);
      heroEl.removeEventListener("click", onHeroClick);
    };
  }, []);

  const firstChars = Array.from(SITE_META.firstName);
  const lastChars = Array.from(SITE_META.lastName);

  return (
    <section
      id="ly-hero"
      ref={heroRef}
      className="relative overflow-hidden bg-[var(--paper)] pt-4 pb-8 min-[761px]:min-h-[calc(100svh-var(--bar)-56px)] min-[761px]:py-8 flex items-center"
    >
      {/* Interactive Bouncy Morphing Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-20 h-[20px] w-[20px] opacity-0 shadow-sm"
        style={{
          clipPath: DOT_SHAPES[0],
          backgroundColor: DOT_COLORS[0],
          transition: "clip-path 0.25s ease, background-color 0.25s ease",
        }}
      />

      <div className="shell relative z-10 grid grid-cols-1 min-[761px]:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center gap-6 min-[761px]:gap-8">
        {/* Left Copy Column */}
        <div
          ref={copyRef}
          id="ly-copy"
          className="order-2 min-[761px]:order-1 text-center min-[761px]:text-left"
        >
          <h1
            ref={h1Ref}
            className="font-display font-extrabold tracking-[-0.03em] text-[var(--ink)] text-[clamp(3.35rem,1.1rem+7.4vw,9.45rem)] leading-[0.9] select-none"
          >
            <span className="block overflow-hidden whitespace-nowrap pb-1">
              {firstChars.map((ch, i) => (
                <span
                  key={`fn-${i}`}
                  className="hero-char inline-block opacity-0"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </span>
            <span className="block overflow-hidden whitespace-nowrap pb-2">
              {lastChars.map((ch, i) => (
                <span
                  key={`ln-${i}`}
                  className="hero-char inline-block opacity-0"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </span>
          </h1>

          <p className="hero-fade mt-5 mx-auto min-[761px]:mx-0 max-w-[34ch] font-display text-[clamp(1.35rem,0.9rem+1.4vw,2.2rem)] leading-[1.16] tracking-[-0.02em] text-[var(--ink-soft)] opacity-0">
            {HERO_CONTENT.leadPrefix}
            <strong className="font-extrabold text-[var(--ink)]">
              {HERO_CONTENT.leadHighlight}
            </strong>
          </p>

          {/* CTA Buttons */}
          <div className="hero-fade mt-7 flex flex-wrap items-center justify-center min-[761px]:justify-start gap-3 opacity-0">
            <a
              href={HERO_CONTENT.primaryCta.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(HERO_CONTENT.primaryCta.href);
              }}
              className="pill-btn pill-primary"
            >
              {HERO_CONTENT.primaryCta.label}
            </a>
            <a
              href={HERO_CONTENT.secondaryCta.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(HERO_CONTENT.secondaryCta.href);
              }}
              className="pill-btn pill-secondary"
            >
              {HERO_CONTENT.secondaryCta.label}
            </a>
          </div>

          {/* Social Pills */}
          <div className="hero-fade mt-5 flex flex-wrap items-center justify-center min-[761px]:justify-start gap-2.5 opacity-0">
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

          {/* Interactive Hint + Live Bops Counter */}
          <div className="hero-fade mt-5 flex flex-wrap items-center justify-center min-[761px]:justify-start gap-1.5 mono text-[0.72rem] text-[var(--ink-faint)] opacity-0">
            <span className="hidden min-[761px]:inline">
              {HERO_CONTENT.bopHintDesktop}
            </span>
            <span className="inline min-[761px]:hidden">
              {HERO_CONTENT.bopHintTouch}
            </span>
            <span className="font-bold text-[var(--pink-ink)]">
              {bops} {UI_LABELS.bopsUnit}
            </span>
          </div>
        </div>

        {/* Right Lanyard ID Badge Stage */}
        <div
          ref={stageRef}
          id="ly-badge-stage"
          className="order-1 min-[761px]:order-2 relative mx-auto h-[465px] min-[761px]:h-[560px] w-full max-w-[360px] select-none"
        >
          {/* Verlet Rope Strap SVG */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <path ref={strapShadowRef} id="ly-strap-shadow" d="" />
              <path ref={strapPathRef} id="ly-strap-path" d="" />
            </defs>
            <use
              href="#ly-strap-shadow"
              fill="none"
              stroke="rgba(19,17,26,0.16)"
              strokeWidth="32"
              strokeLinecap="round"
              transform="translate(3,4)"
            />
            <use
              href="#ly-strap-path"
              fill="none"
              stroke="#E0206A"
              strokeWidth="30"
              strokeLinecap="round"
            />
            <text
              fill="#FFFFFF"
              fontSize="9.5"
              fontFamily="var(--mono)"
              fontWeight="700"
              letterSpacing="1.8"
              dy="3.2"
            >
              <textPath ref={strapTextRef} href="#ly-strap-path" startOffset="0%">
                {HERO_CONTENT.badge.strapText.repeat(3)}
              </textPath>
            </text>
          </svg>

          {/* Swinging Badge Card */}
          <div
            ref={badgeWrapRef}
            id="ly-badge"
            className="absolute left-1/2 top-0 -ml-[121px] w-[242px] min-[761px]:-ml-[157.5px] min-[761px]:w-[315px] cursor-grab active:cursor-grabbing"
            style={{
              transformOrigin: "50% 0%",
              transform: "rotate(-2.6deg)",
            }}
          >
            {/* 3D Cylindrical Metallic Silver Clip SVG */}
            <div className="relative z-10 mx-auto -mb-3 flex w-16 flex-col items-center">
              <svg width="56" height="36" viewBox="0 0 56 36" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="clip-cyl" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#A9A69E" />
                    <stop offset="35%" stopColor="#F5F3EE" />
                    <stop offset="75%" stopColor="#CFCBC2" />
                    <stop offset="100%" stopColor="#8B8880" />
                  </linearGradient>
                </defs>
                <rect x="15" y="2" width="26" height="10" rx="5" fill="url(#clip-cyl)" stroke="#13111A" strokeWidth="1.5" />
                <rect x="22" y="10" width="12" height="10" rx="3" fill="url(#clip-cyl)" stroke="#13111A" strokeWidth="1.5" />
                <path d="M19 18 H37 L41 33 H15 L19 18 Z" fill="url(#clip-cyl)" stroke="#13111A" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="28" cy="26" r="2.5" fill="#13111A" />
              </svg>
            </div>

            {/* 3D Flip Card */}
            <div
              className="relative w-full transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {/* Front Face (Borderless + 1:1 Square Photo + Protruding Flip Button) */}
              <div
                className="relative rounded-[20px] bg-[var(--card)] p-4 sm:p-[22px] shadow-[0_30px_50px_-30px_rgba(19,17,26,0.55)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[var(--pink)] px-2.5 py-0.5 mono text-[0.65rem] font-bold tracking-wider text-white">
                    {HERO_CONTENT.badge.topPill}
                  </span>
                  <span className="h-2.5 w-8 rounded-full border border-[var(--hair)] bg-[var(--paper)]" />
                </div>

                <div className="mt-3 overflow-hidden rounded-[12px] bg-[#DCD9D0] aspect-square">
                  <img
                    src={HERO_CONTENT.badge.avatar}
                    alt="[PORTRAIT PLACEHOLDER]"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-3">
                  <div className="font-display text-lg min-[761px]:text-xl font-extrabold leading-tight text-[var(--ink)]">
                    {HERO_CONTENT.badge.name}
                  </div>
                  <div className="mt-0.5 text-xs min-[761px]:text-sm font-medium text-[var(--ink-soft)]">
                    {HERO_CONTENT.badge.role}
                  </div>
                </div>

                <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--hair)] bg-[var(--paper)] px-2.5 py-1 mono text-[0.62rem] font-semibold text-[var(--ink-soft)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--mint)]" />
                  <span>{HERO_CONTENT.badge.statusPill}</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--hair-soft)]">
                  {/* Original Inline Barcode SVG */}
                  <svg width="112" height="20" viewBox="0 0 112 20" fill="none" aria-hidden="true">
                    <rect x="0" y="1" width="3" height="18" fill="#13111A" />
                    <rect x="5" y="1" width="1.5" height="18" fill="#13111A" />
                    <rect x="9" y="1" width="4" height="18" fill="#13111A" />
                    <rect x="16" y="1" width="2" height="18" fill="#13111A" />
                    <rect x="21" y="1" width="1.5" height="18" fill="#13111A" />
                    <rect x="26" y="1" width="5" height="18" fill="#13111A" />
                    <rect x="34" y="1" width="2" height="18" fill="#13111A" />
                    <rect x="39" y="1" width="3" height="18" fill="#13111A" />
                    <rect x="45" y="1" width="1.5" height="18" fill="#13111A" />
                    <rect x="50" y="1" width="4" height="18" fill="#13111A" />
                    <rect x="57" y="1" width="2" height="18" fill="#13111A" />
                    <rect x="62" y="1" width="3.5" height="18" fill="#13111A" />
                    <rect x="69" y="1" width="1.5" height="18" fill="#13111A" />
                    <rect x="74" y="1" width="4" height="18" fill="#13111A" />
                    <rect x="81" y="1" width="2" height="18" fill="#13111A" />
                    <rect x="86" y="1" width="3" height="18" fill="#13111A" />
                    <rect x="92" y="1" width="1.5" height="18" fill="#13111A" />
                    <rect x="97" y="1" width="4" height="18" fill="#13111A" />
                    <rect x="104" y="1" width="2" height="18" fill="#13111A" />
                  </svg>
                </div>

                {/* Protruding Flip Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(true);
                  }}
                  className="absolute -right-2 -bottom-2 rounded-full border border-[var(--hair)] bg-[var(--card)] px-3 py-1.5 mono text-[0.68rem] font-semibold text-[var(--ink)] shadow-md hover:border-[var(--ink)] cursor-pointer"
                >
                  {UI_LABELS.flipButton}
                </button>
              </div>

              {/* Back Face (Crimson + Cobalt Blue Border) */}
              <div
                className="absolute inset-0 flex flex-col justify-between rounded-[20px] border-[4.8px] border-[#0047AB] bg-[#B11313] p-5 text-white shadow-[0_30px_50px_-30px_rgba(19,17,26,0.6)]"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="mono text-[0.68rem] font-bold tracking-widest text-white/80">
                      {HERO_CONTENT.badge.backHeading}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
                    {HERO_CONTENT.badge.stats.map((st, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/20 bg-black/15 p-3"
                      >
                        <div className="font-display text-2xl min-[761px]:text-3xl font-extrabold text-white">
                          {st.value}
                        </div>
                        <div className="mt-1 mono text-[0.62rem] text-white/80">
                          {st.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/20 pt-3 mono text-[0.66rem] text-white/85">
                  {HERO_CONTENT.badge.serial}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(false);
                  }}
                  className="absolute -right-2 -bottom-2 rounded-full border border-white/30 bg-[var(--ink)] px-3 py-1.5 mono text-[0.68rem] font-semibold text-white shadow-md hover:bg-[var(--pink)] cursor-pointer"
                >
                  {UI_LABELS.flipButton}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

