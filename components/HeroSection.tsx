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
  "polygon(12% 12%, 88% 12%, 88% 88%, 12% 88%)",
  "polygon(50% 6%, 94% 88%, 6% 88%)",
  "polygon(50% 4%, 93% 27%, 93% 73%, 50% 96%, 7% 73%, 7% 27%)",
  "polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)",
  "polygon(50% 4%, 95% 38%, 78% 92%, 22% 92%, 5% 38%)",
  "polygon(50% 3%, 63% 35%, 97% 38%, 71% 59%, 79% 93%, 50% 73%, 21% 93%, 29% 59%, 3% 38%, 37% 35%)",
];

const DOT_COLORS = [
  ACCENT_HEX.pink,
  ACCENT_HEX.blue,
  ACCENT_HEX.yellow,
  ACCENT_HEX.mint,
];

const ROPE_NODES = 13;

interface Ball {
  el: HTMLDivElement;
  face: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  shapeIdx: number;
  colorIdx: number;
}

interface HitBox {
  el: HTMLElement;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "letter" | "bump";
  cooldownUntil: number;
}

const BTN_BUMP: Keyframe[] = [
  { transform: "rotate(0deg)" },
  { transform: "rotate(-4deg)" },
  { transform: "rotate(3deg)" },
  { transform: "rotate(0deg)" },
];

const LETTER_HOP: Keyframe[] = [
  { transform: "translateY(0)" },
  { transform: "translateY(-16%)" },
  { transform: "translateY(0)" },
];

export function HeroSection() {
  const [bops, setBops] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ulDrawn, setUlDrawn] = useState(false);
  const [bopsVisible, setBopsVisible] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const stopPeriodRef = useRef<HTMLSpanElement>(null);
  const dotLayerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeWrapRef = useRef<HTMLDivElement>(null);
  const strapPathRef = useRef<SVGPathElement>(null);
  const strapShadowRef = useRef<SVGPathElement>(null);
  const strapTextRef = useRef<SVGTextPathElement>(null);
  const flipImpulseRef = useRef<() => void>(() => {});

  // Combined Hero Entry + Verlet Lanyard + Multi-Dot Physics
  useEffect(() => {
    const heroEl = heroRef.current;
    const copyEl = copyRef.current;
    const h1El = h1Ref.current;
    const dotLayer = dotLayerRef.current;
    const stageEl = stageRef.current;
    const badgeEl = badgeWrapRef.current;
    const strapPath = strapPathRef.current;
    const strapShadow = strapShadowRef.current;
    const strapText = strapTextRef.current;

    if (!heroEl || !copyEl || !h1El || !dotLayer || !stageEl || !badgeEl || !strapPath || !strapShadow) {
      return;
    }

    const { gsap } = ensureGsap();
    const reduced = prefersReducedMotion();

    // If reduced motion: show everything immediately cleanly
    if (reduced) {
      const chars = h1El.querySelectorAll(".hero-char");
      const fadeItems = copyEl.querySelectorAll(".hero-fade");
      gsap.set(chars, { yPercent: 0, opacity: 1 });
      gsap.set(fadeItems, { y: 0, opacity: 1 });
      const id = window.setTimeout(() => {
        setUlDrawn(true);
        setBopsVisible(true);
      }, 0);
      return () => window.clearTimeout(id);
    }

    // ==================== 1. VERLET ROPE STATE ====================
    const G = 1900;
    const DT = 1 / 120;
    const DAMP = 0.986;
    const ITER = 14;

    const px = new Float32Array(ROPE_NODES);
    const py = new Float32Array(ROPE_NODES);
    const ox = new Float32Array(ROPE_NODES);
    const oy = new Float32Array(ROPE_NODES);

    const getSegLen = () => (window.innerWidth <= 760 ? 5.2 : 9.2);

    const initRope = () => {
      const w = stageEl.clientWidth || 320;
      const ax = w / 2;
      const seg = getSegLen();
      for (let i = 0; i < ROPE_NODES; i++) {
        px[i] = ox[i] = ax + Math.sin(i * 0.25) * 3;
        py[i] = oy[i] = i * seg;
      }
      ox[ROPE_NODES - 1] -= 18;
    };
    initRope();

    let dragging = false;
    let dragX = 0;
    let dragY = 0;
    let pointerDownTime = 0;
    let pointerMoved = false;
    const trail: { x: number; y: number; t: number }[] = [];
    let badgeTilt = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = 0;

    flipImpulseRef.current = () => {
      ox[ROPE_NODES - 1] += (Math.random() - 0.5) * 12;
    };

    const onBadgePointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      dragging = true;
      pointerMoved = false;
      pointerDownTime = performance.now();
      trail.length = 0;
      const rect = stageEl.getBoundingClientRect();
      dragX = e.clientX - rect.left;
      dragY = e.clientY - rect.top;
      trail.push({ x: dragX, y: dragY, t: pointerDownTime });
      badgeEl.setPointerCapture?.(e.pointerId);
    };

    const onStagePointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const rect = stageEl.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      if (Math.hypot(nx - dragX, ny - dragY) >= 5) pointerMoved = true;
      dragX = nx;
      dragY = ny;
      const now = performance.now();
      trail.push({ x: nx, y: ny, t: now });
      while (trail.length > 2 && now - trail[0].t > 90) trail.shift();
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      if (!pointerMoved && performance.now() - pointerDownTime < 260) {
        setFlipped((f) => !f);
        flipImpulseRef.current();
        return;
      }
      if (trail.length >= 2) {
        const first = trail[0];
        const last = trail[trail.length - 1];
        const dtMs = Math.max(16, last.t - first.t);
        const MAX = 1800;
        const tvx = Math.max(-MAX, Math.min(MAX, ((last.x - first.x) / dtMs) * 1000));
        const tvy = Math.max(-MAX, Math.min(MAX, ((last.y - first.y) / dtMs) * 1000));
        ox[ROPE_NODES - 1] = px[ROPE_NODES - 1] - tvx * DT * 0.8;
        oy[ROPE_NODES - 1] = py[ROPE_NODES - 1] - tvy * DT * 0.8;
      }
    };

    const onWindowScroll = () => {
      const now = performance.now();
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (now - lastScrollAt > 400 && !dragging && Math.abs(dy) > 2) {
        lastScrollAt = now;
        const kick = Math.min(18, Math.abs(dy) * 0.35) * DT * 1.2 * Math.sign(dy);
        oy[ROPE_NODES - 1] += kick;
        ox[ROPE_NODES - 1] += kick * 0.6;
      }
    };

    badgeEl.addEventListener("pointerdown", onBadgePointerDown);
    window.addEventListener("pointermove", onStagePointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("scroll", onWindowScroll, { passive: true });

    // ==================== 2. MULTI-DOT & HITBOX STATE ====================
    const balls: Ball[] = [];
    const timers: number[] = [];
    const maxBalls = window.matchMedia("(pointer: fine)").matches ? 5 : 3;
    let hitBoxes: HitBox[] = [];
    let live = false;
    let batX = -9999;
    let batY = -9999;
    let batVx = 0;
    let batVy = 0;
    let lastBatT = performance.now();
    let strapOffset = 0;

    const measureHitBoxes = () => {
      const hRect = heroEl.getBoundingClientRect();
      const next: HitBox[] = [];
      h1El.querySelectorAll<HTMLElement>(".hero-char").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 2 && r.height > 2) {
          next.push({
            el,
            x: r.left - hRect.left,
            y: r.top - hRect.top,
            w: r.width,
            h: r.height,
            kind: "letter",
            cooldownUntil: 0,
          });
        }
      });
      copyEl.querySelectorAll<HTMLElement>(".ly-bump").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) {
          next.push({
            el,
            x: r.left - hRect.left,
            y: r.top - hRect.top,
            w: r.width,
            h: r.height,
            kind: "bump",
            cooldownUntil: 0,
          });
        }
      });
      hitBoxes = next;
    };

    const spawnSparks = (x: number, y: number, color: string) => {
      for (let i = 0; i < 4; i++) {
        const sp = document.createElement("span");
        sp.className = "ly-bit";
        sp.style.backgroundColor = color;
        dotLayer.appendChild(sp);
        const ang = (Math.PI * 2 * i) / 4 + Math.random() * 0.7;
        const dist = 16 + Math.random() * 18;
        gsap.fromTo(
          sp,
          { x, y, scale: 1, opacity: 1 },
          {
            x: x + Math.cos(ang) * dist,
            y: y + Math.sin(ang) * dist,
            scale: 0,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => sp.remove(),
          }
        );
      }
    };

    const createBall = (x: number, y: number, vx: number, vy: number, shapeIdx = 0): Ball => {
      const r = window.innerWidth <= 760 ? 9.5 : 11;
      const el = document.createElement("div");
      el.className = "pointer-events-none absolute left-0 top-0 z-20 will-change-transform";
      el.style.width = `${r * 2}px`;
      el.style.height = `${r * 2}px`;

      const face = document.createElement("div");
      face.className = "h-full w-full";
      face.style.clipPath = DOT_SHAPES[shapeIdx % DOT_SHAPES.length];
      face.style.backgroundColor = DOT_COLORS[shapeIdx % DOT_COLORS.length];
      face.style.transition = "clip-path 0.25s ease, background-color 0.25s ease";

      el.appendChild(face);
      dotLayer.appendChild(el);
      el.style.transform = `translate3d(${(x - r).toFixed(1)}px, ${(y - r).toFixed(1)}px, 0)`;

      return {
        el,
        face,
        x,
        y,
        vx,
        vy,
        r,
        shapeIdx,
        colorIdx: shapeIdx % DOT_COLORS.length,
      };
    };

    const morphBall = (b: Ball) => {
      b.shapeIdx = (b.shapeIdx + 1) % DOT_SHAPES.length;
      b.colorIdx = (b.colorIdx + 1) % DOT_COLORS.length;
      b.face.style.clipPath = DOT_SHAPES[b.shapeIdx];
      b.face.style.backgroundColor = DOT_COLORS[b.colorIdx];
      setBops((n) => n + 1);
    };

    const onHeroPointerMove = (e: PointerEvent) => {
      const r = heroEl.getBoundingClientRect();
      const nx = e.clientX - r.left;
      const ny = e.clientY - r.top;
      const now = performance.now();
      const dt = Math.max(0.008, (now - lastBatT) / 1000);
      if (batX > -900) {
        batVx = Math.max(-1400, Math.min(1400, (nx - batX) / dt));
        batVy = Math.max(-1400, Math.min(1400, (ny - batY) / dt));
      }
      batX = nx;
      batY = ny;
      lastBatT = now;
    };

    const onHeroPointerLeave = () => {
      batX = -9999;
      batY = -9999;
      batVx = 0;
      batVy = 0;
    };

    const onHeroClick = (e: MouseEvent) => {
      if (!live) return;
      if ((e.target as HTMLElement).closest("a, button, #ly-badge")) return;
      const r = heroEl.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const speed = Math.max(240, Math.min(400, heroEl.clientWidth * 0.26));
      const ang = -Math.PI * (0.15 + Math.random() * 0.7);
      const b = createBall(
        cx,
        cy,
        Math.cos(ang) * speed,
        Math.sin(ang) * speed,
        Math.floor(Math.random() * DOT_SHAPES.length)
      );
      balls.push(b);
      gsap.from(b.face, { scale: 0, duration: 0.4, ease: "back.out(3)" });
      setBops((n) => n + 1);

      if (balls.length > maxBalls) {
        const old = balls.shift();
        if (old) {
          gsap.to(old.face, {
            scale: 0,
            duration: 0.25,
            onComplete: () => old.el.remove(),
          });
        }
      }
    };

    heroEl.addEventListener("pointermove", onHeroPointerMove);
    heroEl.addEventListener("pointerleave", onHeroPointerLeave);
    heroEl.addEventListener("click", onHeroClick);

    // ==================== 3. HERO ENTRY SEQUENCE ====================
    let entered = false;
    const runEnter = () => {
      if (entered) return;
      entered = true;

      const chars = h1El.querySelectorAll(".hero-char");
      const fadeItems = copyEl.querySelectorAll(".hero-fade");

      // 0.15s: stampIn hero name letters
      if (chars.length) {
        stampIn(chars, { delay: 0.15, stagger: 0.035, duration: 0.6 });
      }

      // 0.50s: staggered fade-up of subhead, CTAs, socials, hint
      if (fadeItems.length) {
        gsap.fromTo(
          fadeItems,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.07,
            ease: "power3.out",
            delay: 0.5,
          }
        );
      }

      // 1.00s: spawn initial dot near the period of leadHighlight
      timers.push(
        window.setTimeout(() => {
          const hRect = heroEl.getBoundingClientRect();
          const pRect = stopPeriodRef.current?.getBoundingClientRect();
          const sx = pRect ? pRect.right - hRect.left + 8 : Math.max(40, hRect.width * 0.25);
          const sy = pRect ? pRect.bottom - hRect.top - 10 : Math.max(80, hRect.height * 0.45);
          const initial = createBall(sx, sy, 0, 0, 0);
          balls.push(initial);
          gsap.fromTo(
            initial.face,
            { scale: 0 },
            { scale: 1, duration: 0.45, ease: "back.out(3)" }
          );
        }, 1000)
      );

      // 1.30s: draw sweeping underline
      timers.push(window.setTimeout(() => setUlDrawn(true), 1300));

      // 2.00s: squash dot on period -> 2.14s spring & launch
      timers.push(
        window.setTimeout(() => {
          const first = balls[0];
          if (!first) return;
          measureHitBoxes();
          gsap
            .timeline()
            .to(first.face, {
              scaleX: 1.35,
              scaleY: 0.65,
              duration: 0.14,
              ease: "power2.in",
            })
            .to(first.face, {
              scaleX: 1,
              scaleY: 1,
              duration: 0.3,
              ease: "back.out(3)",
              onStart: () => {
                const s = Math.max(240, Math.min(400, heroEl.clientWidth * 0.26));
                first.vx = -s * 0.55;
                first.vy = -s * 0.84;
                live = true;
                setBopsVisible(true);
              },
            });
        }, 2000)
      );
    };

    const onPreloaderDone = () => runEnter();
    window.addEventListener("preloader:done", onPreloaderDone);
    if (document.documentElement.classList.contains("lifted")) {
      runEnter();
    } else {
      timers.push(window.setTimeout(runEnter, 2700));
    }

    const onResize = () => {
      if (entered) measureHitBoxes();
    };
    window.addEventListener("resize", onResize);

    // ==================== 4. MAIN PHYSICS LOOP ====================
    let active = true;
    let lastTime = performance.now();
    let acc = 0;
    let rafId = 0;

    const stepRope = (ax: number, timeSec: number) => {
      px[0] = ox[0] = ax;
      py[0] = oy[0] = 0;

      // Ambient breeze matching reference
      const breeze = !dragging
        ? (Math.sin(timeSec * 0.9) * 14 + Math.sin(timeSec * 2.3) * 6) * DT * DT
        : 0;

      for (let i = 1; i < ROPE_NODES; i++) {
        const vxNode = (px[i] - ox[i]) * DAMP;
        const vyNode = (py[i] - oy[i]) * DAMP;
        ox[i] = px[i];
        oy[i] = py[i];
        px[i] += vxNode + (i === ROPE_NODES - 1 ? breeze : 0);
        py[i] += vyNode + G * DT * DT;
      }

      if (dragging) {
        px[ROPE_NODES - 1] = dragX;
        py[ROPE_NODES - 1] = Math.max(36, Math.min(240, dragY - 40));
      }

      const seg = getSegLen();
      for (let iter = 0; iter < ITER; iter++) {
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

      // Step Verlet rope
      const stageW = stageEl.clientWidth || 320;
      const ax = stageW / 2;
      acc += elapsed;
      let steps = 0;
      while (acc >= DT && steps < 4) {
        stepRope(ax, now / 1000);
        acc -= DT;
        steps++;
      }

      let d = `M ${px[0].toFixed(1)} ${py[0].toFixed(1)}`;
      for (let i = 1; i < ROPE_NODES - 1; i++) {
        const xc = (px[i] + px[i + 1]) * 0.5;
        const yc = (py[i] + py[i + 1]) * 0.5;
        d += ` Q ${px[i].toFixed(1)} ${py[i].toFixed(1)} ${xc.toFixed(1)} ${yc.toFixed(1)}`;
      }
      d += ` L ${px[ROPE_NODES - 1].toFixed(1)} ${py[ROPE_NODES - 1].toFixed(1)}`;
      strapPath.setAttribute("d", d);
      strapShadow.setAttribute("d", d);

      strapOffset = (strapOffset + elapsed * 14) % 100;
      if (strapText) {
        strapText.setAttribute("startOffset", `${strapOffset.toFixed(1)}%`);
      }

      const tipX = px[ROPE_NODES - 1];
      const tipY = py[ROPE_NODES - 1];
      const prevX = px[ROPE_NODES - 3];
      const prevY = py[ROPE_NODES - 3];
      const angleRad = Math.atan2(tipX - prevX, tipY - prevY);
      const angleDeg = Math.max(-28, Math.min(28, -(angleRad * 180) / Math.PI - 2.4));

      const targetTilt = Math.max(-28, Math.min(28, (tipX - ox[ROPE_NODES - 1]) * 3.2));
      badgeTilt += (targetTilt - badgeTilt) * 0.14;

      badgeEl.style.transform = `translate3d(${(tipX - stageW / 2).toFixed(1)}px, ${tipY.toFixed(1)}px, 0) rotate(${angleDeg.toFixed(2)}deg) perspective(900px) rotateY(${badgeTilt.toFixed(2)}deg)`;

      // Step all active balls when live
      if (live && balls.length) {
        const hw = heroEl.clientWidth;
        const hh = heroEl.clientHeight;
        const bRect = badgeEl.getBoundingClientRect();
        const hRect = heroEl.getBoundingClientRect();
        const bx = bRect.left - hRect.left;
        const by = bRect.top - hRect.top;
        const bw = bRect.width;
        const bh = bRect.height;

        for (const b of balls) {
          b.vy += 320 * elapsed;
          b.x += b.vx * elapsed;
          b.y += b.vy * elapsed;

          // Hero boundaries
          if (b.x < b.r + 10) {
            b.x = b.r + 10;
            b.vx = Math.abs(b.vx) * 0.94 + 20;
            morphBall(b);
          } else if (b.x > hw - b.r - 10) {
            b.x = hw - b.r - 10;
            b.vx = -Math.abs(b.vx) * 0.94 - 20;
            morphBall(b);
          }
          if (b.y < b.r + 10) {
            b.y = b.r + 10;
            b.vy = Math.abs(b.vy) * 0.92;
            morphBall(b);
          } else if (b.y > hh - b.r - 14) {
            const impactVy = Math.abs(b.vy);
            b.y = hh - b.r - 14;
            b.vy = -Math.max(240, impactVy * 0.92);
            morphBall(b);
            window.dispatchEvent(
              new CustomEvent("hero:wave-poke", {
                detail: {
                  clientX: hRect.left + b.x,
                  impulse: Math.min(700, impactVy) * 0.015,
                },
              })
            );
          }

          // Mouse bat (r = 24)
          if (batX > -900) {
            const distM = Math.hypot(b.x - batX, b.y - batY);
            if (distM < 24 + b.r && distM > 0.1) {
              const nx = (b.x - batX) / distM;
              const ny = (b.y - batY) / distM;
              b.x = batX + nx * (24 + b.r);
              b.y = batY + ny * (24 + b.r);
              b.vx = nx * 280 + batVx * 0.35;
              b.vy = ny * 280 + batVy * 0.35;
              morphBall(b);
            }
          }

          // Swinging ID badge clean AABB edge collision
          if (
            b.x + b.r > bx &&
            b.x - b.r < bx + bw &&
            b.y + b.r > by &&
            b.y - b.r < by + bh
          ) {
            const pL = b.x + b.r - bx;
            const pR = bx + bw - (b.x - b.r);
            const pT = b.y + b.r - by;
            const pB = by + bh - (b.y - b.r);
            const minP = Math.min(pL, pR, pT, pB);

            if (minP === pL) {
              b.x = bx - b.r - 2;
              b.vx = -Math.max(170, Math.abs(b.vx));
              ox[ROPE_NODES - 1] -= 2.2;
            } else if (minP === pR) {
              b.x = bx + bw + b.r + 2;
              b.vx = Math.max(170, Math.abs(b.vx));
              ox[ROPE_NODES - 1] += 2.2;
            } else if (minP === pT) {
              b.y = by - b.r - 2;
              b.vy = -Math.max(190, Math.abs(b.vy));
            } else {
              b.y = by + bh + b.r + 2;
              b.vy = Math.max(190, Math.abs(b.vy));
            }
            morphBall(b);
          }

          // Letter & CTA button collisions
          for (const hb of hitBoxes) {
            if (now < hb.cooldownUntil) continue;
            if (
              b.x + b.r > hb.x &&
              b.x - b.r < hb.x + hb.w &&
              b.y + b.r > hb.y &&
              b.y - b.r < hb.y + hb.h
            ) {
              hb.cooldownUntil = now + 180;
              const pL = b.x + b.r - hb.x;
              const pR = hb.x + hb.w - (b.x - b.r);
              const pT = b.y + b.r - hb.y;
              const pB = hb.y + hb.h - (b.y - b.r);
              const m = Math.min(pL, pR, pT, pB);
              if (m === pL || m === pR) b.vx = -b.vx;
              else b.vy = -b.vy;

              const color = DOT_COLORS[b.colorIdx];
              morphBall(b);

              if (hb.kind === "letter") {
                hb.el.animate?.(LETTER_HOP, {
                  duration: 520,
                  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                });
                const prevColor = hb.el.style.color;
                hb.el.style.color = color;
                timers.push(
                  window.setTimeout(() => {
                    hb.el.style.color = prevColor;
                  }, 320)
                );
                spawnSparks(b.x, b.y, color);
              } else {
                hb.el.animate?.(BTN_BUMP, {
                  duration: 360,
                  easing: "ease-out",
                });
              }
              break;
            }
          }

          // Clamp speed <= 1100
          const sp = Math.hypot(b.vx, b.vy);
          if (sp > 1100) {
            b.vx = (b.vx / sp) * 1100;
            b.vy = (b.vy / sp) * 1100;
          }

          b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0)`;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      active = false;
      window.cancelAnimationFrame(rafId);
      timers.forEach((id) => window.clearTimeout(id));
      balls.forEach((b) => b.el.remove());
      window.removeEventListener("preloader:done", onPreloaderDone);
      window.removeEventListener("resize", onResize);
      badgeEl.removeEventListener("pointerdown", onBadgePointerDown);
      window.removeEventListener("pointermove", onStagePointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onWindowScroll);
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
      {/* Dynamic Bouncy Dots & Sparks Layer */}
      <div
        ref={dotLayerRef}
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        aria-hidden="true"
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
                  className="hero-char inline-block opacity-0 transition-colors duration-200"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </span>
            <span className="block overflow-hidden whitespace-nowrap pb-2">
              {lastChars.map((ch, i) => (
                <span
                  key={`ln-${i}`}
                  className="hero-char inline-block opacity-0 transition-colors duration-200"
                >
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
            </span>
          </h1>

          <p className="hero-fade mt-5 mx-auto min-[761px]:mx-0 max-w-[34ch] font-display text-[clamp(1.35rem,0.9rem+1.4vw,2.2rem)] leading-[1.16] tracking-[-0.02em] text-[var(--ink-soft)] opacity-0">
            {HERO_CONTENT.leadPrefix}
            <strong className="font-extrabold text-[var(--ink)]">
              <span
                ref={stopPeriodRef}
                className={`ly-ul ${ulDrawn ? "is-drawn" : ""}`}
              >
                {HERO_CONTENT.leadHighlight}
              </span>
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
              className="ly-bump pill-btn pill-primary"
            >
              {HERO_CONTENT.primaryCta.label}
            </a>
            <a
              href={HERO_CONTENT.secondaryCta.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(HERO_CONTENT.secondaryCta.href);
              }}
              className="ly-bump pill-btn pill-secondary"
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
                className="ly-bump social-pill"
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
            <span
              id="ly-bops-wrap"
              className={`font-bold text-[var(--pink-ink)] transition-opacity duration-300 ${
                bopsVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {bops} {UI_LABELS.bopsUnit}
            </span>
          </div>
        </div>

        {/* Right Lanyard ID Badge Stage */}
        <div
          ref={stageRef}
          id="ly-badge-stage"
          className="order-1 min-[761px]:order-2 relative mx-auto h-[495px] min-[761px]:h-[560px] w-full max-w-[360px] select-none"
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
              strokeWidth="28"
              strokeLinecap="round"
              transform="translate(3,4)"
            />
            <use
              href="#ly-strap-path"
              fill="none"
              stroke="#E0206A"
              strokeWidth="26"
              strokeLinecap="round"
            />
            <text
              fill="#FCFBF8"
              fontSize="10"
              fontFamily="var(--mono)"
              fontWeight="700"
              letterSpacing="1.8"
              dy="3.4"
            >
              <textPath ref={strapTextRef} href="#ly-strap-path" startOffset="0%">
                {HERO_CONTENT.badge.strapText.repeat(3)}
              </textPath>
            </text>
          </svg>

          {/* Swinging Badge Card with Reference Rounded Metallic Clip (::before) */}
          <div
            ref={badgeWrapRef}
            id="ly-badge"
            className="ly-badge-clip absolute left-1/2 top-0 -ml-[121px] w-[242px] min-[761px]:-ml-[152px] min-[761px]:w-[304px] cursor-grab active:cursor-grabbing"
            style={{
              transformOrigin: "50% 0%",
              transform: "rotate(-2.4deg)",
            }}
          >
            {/* 3D Flip Card (0.8s cubic-bezier(.22,1,.36,1)) */}
            <div
              className="relative w-full transition-transform duration-[800ms]"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {/* Front Face */}
              <div
                className="relative rounded-[18px] bg-[var(--card)] p-4 sm:p-[18px] shadow-[0_30px_50px_-30px_rgba(19,17,26,0.55)]"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="h-2.5 w-8 rounded-full border border-[var(--hair)] bg-[var(--paper)]" />
                  <span className="rounded-full bg-[var(--pink)] px-2.5 py-0.5 mono text-[0.65rem] font-bold tracking-wider text-white">
                    {HERO_CONTENT.badge.topPill}
                  </span>
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
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--mint)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--mint)]" />
                  </span>
                  <span>{HERO_CONTENT.badge.statusPill}</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--hair-soft)]">
                  <svg width="74" height="22" viewBox="0 0 74 22" fill="none" aria-hidden="true">
                    <rect x="0" y="1" width="2.5" height="20" fill="#13111A" />
                    <rect x="4" y="1" width="1.2" height="20" fill="#13111A" />
                    <rect x="7" y="1" width="3.5" height="20" fill="#13111A" />
                    <rect x="13" y="1" width="1.8" height="20" fill="#13111A" />
                    <rect x="17" y="1" width="1.2" height="20" fill="#13111A" />
                    <rect x="20" y="1" width="4" height="20" fill="#13111A" />
                    <rect x="26" y="1" width="1.6" height="20" fill="#13111A" />
                    <rect x="30" y="1" width="2.5" height="20" fill="#13111A" />
                    <rect x="34" y="1" width="1.2" height="20" fill="#13111A" />
                    <rect x="38" y="1" width="3.2" height="20" fill="#13111A" />
                    <rect x="43" y="1" width="1.5" height="20" fill="#13111A" />
                    <rect x="47" y="1" width="2.8" height="20" fill="#13111A" />
                    <rect x="52" y="1" width="1.2" height="20" fill="#13111A" />
                    <rect x="55" y="1" width="3.4" height="20" fill="#13111A" />
                    <rect x="61" y="1" width="1.6" height="20" fill="#13111A" />
                    <rect x="65" y="1" width="2.6" height="20" fill="#13111A" />
                    <rect x="70" y="1" width="3" height="20" fill="#13111A" />
                  </svg>
                </div>

                {/* Protruding Flip Button */}
                <button
                  id="ly-turn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(true);
                    flipImpulseRef.current();
                  }}
                  className="absolute -right-1.5 -bottom-3.5 h-[30px] rounded-full border border-[var(--hair)] bg-[var(--card)] px-3 mono text-[0.64rem] font-semibold text-[var(--ink)] shadow-md hover:border-[var(--ink)] cursor-pointer"
                  style={{ transform: "translateZ(1px)" }}
                >
                  {UI_LABELS.flipButton}
                </button>
              </div>

              {/* Back Face */}
              <div
                className="absolute inset-0 flex flex-col justify-between rounded-[18px] border-[5px] border-[#0047AB] bg-[#B11313] p-4 sm:p-5 text-[#F5F3EE] shadow-[0_30px_50px_-30px_rgba(19,17,26,0.6)]"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  backgroundImage:
                    "radial-gradient(rgba(19,17,26,0.14) 1px, transparent 1.15px)",
                  backgroundSize: "4px 4px",
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#13111A] px-2.5 py-0.5 mono text-[0.62rem] font-bold tracking-wider text-white">
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
                        <div className="mt-1 mono text-[0.62rem] text-white/85">
                          {st.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/20 pt-3 mono text-[0.64rem] text-white/90">
                  {HERO_CONTENT.badge.serial}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(false);
                    flipImpulseRef.current();
                  }}
                  className="absolute -right-1.5 -bottom-3.5 h-[30px] rounded-full border border-white/30 bg-[var(--ink)] px-3 mono text-[0.64rem] font-semibold text-white shadow-md hover:bg-[var(--pink)] cursor-pointer"
                  style={{ transform: "translateZ(1px)" }}
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
