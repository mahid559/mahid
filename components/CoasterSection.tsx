"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ACCENT_HEX, COASTER_CONTENT, UI_LABELS } from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

interface TrackSample {
  x: number;
  y: number;
  angle: number;
  dist: number;
  timeU: number; // speed-coupled normalized [0..1] parameter
}

const WORLD_W = 5400;
const WORLD_H = 620;
const GROUND_Y = 530;
const round1 = (n: number) => Math.round(n * 10) / 10;

const FX_SHAPES = [
  "polygon(50% 5%, 76% 14%, 93% 36%, 93% 64%, 76% 86%, 50% 95%, 24% 86%, 7% 64%, 7% 36%, 24% 14%)",
  "polygon(50% 3%, 63% 35%, 97% 38%, 71% 59%, 79% 93%, 50% 73%, 21% 93%, 29% 59%, 3% 38%, 37% 35%)",
  "polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)",
  "polygon(12% 12%, 88% 12%, 88% 88%, 12% 88%)",
];
const FX_COLORS = [
  ACCENT_HEX.pink,
  ACCENT_HEX.blue,
  ACCENT_HEX.yellow,
  ACCENT_HEX.mint,
];

const CLOUDS = Array.from({ length: 22 }).map((_, i) => ({
  x: 110 + i * 165,
  y: 42 + ((i * 37) % 135),
  scale: 0.72 + ((i * 19) % 45) / 100,
  dur: 45 + (i % 6) * 5,
}));

function sampleTrack(): {
  samples: TrackSample[];
  totalLen: number;
  pathD: string;
  supports: { x: number; y1: number; y2: number }[];
  ties: { x1: number; y1: number; x2: number; y2: number }[];
  stopUs: number[];
} {
  const raw: { x: number; y: number }[] = [];

  const pushCubic = (
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    steps = 40
  ) => {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const x =
        mt * mt * mt * p0[0] +
        3 * mt * mt * t * p1[0] +
        3 * mt * t * t * p2[0] +
        t * t * t * p3[0];
      const y =
        mt * mt * mt * p0[1] +
        3 * mt * mt * t * p1[1] +
        3 * mt * t * t * p2[1] +
        t * t * t * p3[1];
      raw.push({ x, y });
    }
  };

  // LEAD_IN -> Hill -> Drop -> Loop 1
  pushCubic([80, 440], [260, 440], [340, 440], [480, 440], 24);
  pushCubic([480, 440], [640, 440], [720, 210], [920, 210], 34);
  pushCubic([920, 210], [1080, 210], [1160, 455], [1340, 455], 34);

  // Vertical Loop-the-Loop #1 (x=1560, r=115)
  const l1cx = 1560;
  const l1cy = 340;
  const l1r = 115;
  pushCubic([1340, 455], [1440, 455], [1500, 455], [1560, 455], 16);
  for (let i = 1; i <= 64; i++) {
    const theta = Math.PI / 2 - (i / 64) * Math.PI * 2;
    raw.push({
      x: l1cx + Math.cos(theta) * l1r + (i / 64) * 32,
      y: l1cy + Math.sin(theta) * l1r,
    });
  }

  // Exit Loop 1 -> Stop 01 flat (x=2120)
  pushCubic([1592, 455], [1730, 455], [1820, 420], [1980, 420], 28);
  pushCubic([1980, 420], [2120, 420], [2200, 420], [2340, 420], 20);

  // Ride 2: Big Hill -> Drop -> Loop 2
  pushCubic([2340, 420], [2500, 420], [2580, 175], [2760, 175], 36);
  pushCubic([2760, 175], [2920, 175], [2980, 460], [3140, 460], 34);

  // Vertical Loop-the-Loop #2 (x=3320, r=100)
  const l2cx = 3320;
  const l2cy = 360;
  const l2r = 100;
  pushCubic([3140, 460], [3220, 460], [3270, 460], [3320, 460], 16);
  for (let i = 1; i <= 60; i++) {
    const theta = Math.PI / 2 - (i / 60) * Math.PI * 2;
    raw.push({
      x: l2cx + Math.cos(theta) * l2r + (i / 60) * 28,
      y: l2cy + Math.sin(theta) * l2r,
    });
  }

  // Exit Loop 2 -> Stop 02 flat (x=3860)
  pushCubic([3348, 460], [3480, 460], [3560, 415], [3720, 415], 28);
  pushCubic([3720, 415], [3860, 415], [3940, 415], [4080, 415], 20);

  // Outro camelbacks -> Stop 03 (x=4980) -> End gate
  pushCubic([4080, 415], [4240, 415], [4300, 260], [4480, 260], 32);
  pushCubic([4480, 260], [4620, 260], [4700, 435], [4880, 435], 30);
  pushCubic([4880, 435], [5040, 435], [5160, 435], [5320, 435], 24);

  const cum: number[] = [0];
  for (let i = 1; i < raw.length; i++) {
    cum.push(
      cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y)
    );
  }
  const totalLen = cum[cum.length - 1];

  const count = Math.floor(totalLen / 6);
  const samples: TrackSample[] = [];
  let j = 0;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let s = 0; s <= count; s++) {
    const target = (s / count) * totalLen;
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const u = (target - cum[j]) / seg;
    const x = raw[j].x + (raw[j + 1].x - raw[j].x) * u;
    const y = raw[j].y + (raw[j + 1].y - raw[j].y) * u;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    samples.push({ x, y, angle: 0, dist: target, timeU: 0 });
  }

  const depth = Math.max(40, maxY - minY);
  let totalTime = 0;
  const times: number[] = [0];

  for (let i = 0; i < samples.length; i++) {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    let ang = Math.atan2(next.y - prev.y, next.x - prev.x);
    if (i > 0) {
      while (ang - samples[i - 1].angle > Math.PI) ang -= Math.PI * 2;
      while (ang - samples[i - 1].angle < -Math.PI) ang += Math.PI * 2;
      const ds = samples[i].dist - samples[i - 1].dist;
      const dropRatio = Math.max(0, (samples[i].y - minY) / depth);
      const speedFactor = Math.sqrt(1 + 8 * dropRatio);
      totalTime += ds / speedFactor;
      times.push(totalTime);
    }
    samples[i].angle = ang;
  }

  for (let i = 0; i < samples.length; i++) {
    samples[i].timeU = totalTime > 0 ? times[i] / totalTime : i / (samples.length - 1);
  }

  const pathD = samples
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const supports: { x: number; y1: number; y2: number }[] = [];
  for (let i = 8; i < samples.length - 8; i += 16) {
    const p = samples[i];
    if (p.y < GROUND_Y - 12) {
      supports.push({ x: round1(p.x), y1: round1(p.y), y2: GROUND_Y });
    }
  }

  const ties: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < samples.length; i += 3) {
    const p = samples[i];
    const nx = -Math.sin(p.angle) * 8;
    const ny = Math.cos(p.angle) * 8;
    ties.push({
      x1: round1(p.x - nx),
      y1: round1(p.y - ny),
      x2: round1(p.x + nx),
      y2: round1(p.y + ny),
    });
  }

  const findUAtX = (targetX: number) => {
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < samples.length; i++) {
      const d = Math.abs(samples[i].x - targetX);
      if (d < bestDiff && samples[i].y > 380) {
        bestDiff = d;
        bestIdx = i;
      }
    }
    return samples[bestIdx].timeU;
  };

  const stopUs = [findUAtX(2120), findUAtX(3860), findUAtX(4980)];

  return { samples, totalLen, pathD, supports, ties, stopUs };
}

function FerrisWheel({ x, y, r }: { x: number; y: number; r: number }) {
  const spokes = 8;
  return (
    <g transform={`translate(${x}, ${y})`} opacity="0.22">
      <line x1="0" y1="0" x2={-r * 0.55} y2={r + 40} stroke="#13111A" strokeWidth="3" />
      <line x1="0" y1="0" x2={r * 0.55} y2={r + 40} stroke="#13111A" strokeWidth="3" />
      <g className="cz-spin">
        <circle cx="0" cy="0" r={r} fill="none" stroke="#13111A" strokeWidth="3" />
        <circle cx="0" cy="0" r={r * 0.65} fill="none" stroke="#13111A" strokeWidth="1.5" />
        {Array.from({ length: spokes }).map((_, idx) => {
          const a = (idx / spokes) * Math.PI * 2;
          const cx = round1(Math.cos(a) * r);
          const cy = round1(Math.sin(a) * r);
          return (
            <g key={idx}>
              <line x1="0" y1="0" x2={cx} y2={cy} stroke="#13111A" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="6" fill="#E0206A" stroke="#13111A" strokeWidth="2" />
            </g>
          );
        })}
      </g>
    </g>
  );
}

export function CoasterSection() {
  const track = useMemo(() => sampleTrack(), []);
  const stageRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<SVGSVGElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<SVGPathElement>(null);
  const fxLayerRef = useRef<HTMLDivElement>(null);
  const boardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ticketRefs = useRef<(HTMLDivElement | null)[]>([]);
  const signRefs = useRef<(SVGGElement | null)[]>([]);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    src: string;
    caption: string;
  } | null>(null);

  const openLightbox = (ph: { src: string; caption: string }) => {
    setLightboxPhoto(ph);
    dialogRef.current?.showModal();
  };

  useEffect(() => {
    const stage = stageRef.current;
    const clip = clipRef.current;
    const world = worldRef.current;
    const sky = skyRef.current;
    const cart = cartRef.current;
    const railFill = railFillRef.current;

    if (!stage || !clip || !world || !cart || !railFill) return;

    const totalLen = railFill.getTotalLength ? railFill.getTotalLength() : track.totalLen;
    railFill.style.strokeDasharray = `${totalLen}`;
    railFill.style.strokeDashoffset = `${totalLen}`;

    const sampleAtTimeU = (u: number): TrackSample => {
      const clamped = Math.max(0, Math.min(1, u));
      let lo = 0;
      let hi = track.samples.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (track.samples[mid].timeU <= clamped) lo = mid;
        else hi = mid;
      }
      const p0 = track.samples[lo];
      const p1 = track.samples[hi];
      const span = p1.timeU - p0.timeU || 1;
      const f = Math.max(0, Math.min(1, (clamped - p0.timeU) / span));
      return {
        x: p0.x + (p1.x - p0.x) * f,
        y: p0.y + (p1.y - p0.y) * f,
        angle: p0.angle + (p1.angle - p0.angle) * f,
        dist: p0.dist + (p1.dist - p0.dist) * f,
        timeU: clamped,
      };
    };

    const state = { pos: 0, push: 0 };
    const open = [{ v: 0 }, { v: 0 }, { v: 0 }];
    let lastStopFired = -1;
    let prevCam = 0;

    const renderFrame = () => {
      const p = sampleAtTimeU(state.pos);
      const vw = clip.clientWidth || 1200;
      const vh = clip.clientHeight || 680;
      const isNarrow = vw < 760;
      const ax = vw * (isNarrow ? 0.42 : 0.34);
      const ay = vh * 0.6;
      const k = Math.min(1.06, Math.max(0.54, vh / WORLD_H));
      const z = k * (1 + state.push * 0.3);

      // Smooth camera look-ahead damping
      const D = Math.max(40, ax / z - 80);
      const targetCam = p.x;
      const back = targetCam - prevCam;
      const cam = back > 0 ? prevCam + D * Math.tanh(back / D) : targetCam;
      prevCam = cam;

      const rawCamX = ax - cam * z;
      const minCamX = vw - WORLD_W * z;
      const camX = Math.max(minCamX, Math.min(0, rawCamX));
      const camY = ay - p.y * z * 0.35 - (WORLD_H * z * 0.35);

      world.style.transform = `translate3d(${camX.toFixed(1)}px, ${camY.toFixed(1)}px, 0) scale(${z.toFixed(4)})`;
      if (sky) {
        sky.style.transform = `translate3d(${(camX * 0.3).toFixed(1)}px, 0, 0)`;
      }

      const deg = (p.angle * 180) / Math.PI;
      cart.style.transform = `translate3d(${(p.x - 70).toFixed(1)}px, ${(p.y - 102).toFixed(1)}px, 0) rotate(${deg.toFixed(2)}deg)`;

      const distFrac = p.dist / (track.totalLen || 1);
      railFill.style.strokeDashoffset = `${(totalLen * (1 - distFrac)).toFixed(1)}`;

      const colorIdx =
        state.pos < track.stopUs[0]
          ? 0
          : state.pos < track.stopUs[1]
            ? 1
            : 2;
      railFill.style.stroke =
        ACCENT_HEX[COASTER_CONTENT.stops[colorIdx]?.accent ?? "pink"];

      // Cart iris centering
      const irisCx = ax;
      const irisCy = ay - 60 * k;
      const maxR = Math.hypot(vw, vh) * 1.05;

      open.forEach((o, sIdx) => {
        const board = boardRefs.current[sIdx];
        if (!board) return;
        if (o.v <= 0.001) {
          board.style.clipPath = `circle(0px at ${irisCx.toFixed(1)}px ${irisCy.toFixed(1)}px)`;
          board.style.pointerEvents = "none";
        } else if (o.v >= 0.995) {
          board.style.clipPath = "none";
          board.style.pointerEvents = "auto";
        } else {
          board.style.clipPath = `circle(${(o.v * maxR).toFixed(1)}px at ${irisCx.toFixed(1)}px ${irisCy.toFixed(1)}px)`;
          board.style.pointerEvents = o.v > 0.45 ? "auto" : "none";
        }
      });
    };

    renderFrame();
    if (prefersReducedMotion()) return;

    const { gsap } = ensureGsap();
    const spawnBurst = (cx: number, cy: number, count = 14) => {
      const layer = fxLayerRef.current;
      if (!layer) return;
      for (let i = 0; i < count; i++) {
        const dot = document.createElement("span");
        dot.className = "pointer-events-none absolute left-0 top-0";
        const size = 8 + (i % 3) * 4;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.clipPath = FX_SHAPES[i % FX_SHAPES.length];
        dot.style.backgroundColor = FX_COLORS[i % FX_COLORS.length];
        layer.appendChild(dot);

        const ang = (Math.PI * 2 * i) / count + (i % 2) * 0.15;
        const dist = 36 + (i % 4) * 26;
        gsap.fromTo(
          dot,
          { x: cx - size / 2, y: cy - size / 2, scale: 0, opacity: 1 },
          {
            x: cx - size / 2 + Math.cos(ang) * dist,
            y: cy - size / 2 + Math.sin(ang) * dist + 24,
            scale: 1,
            opacity: 0,
            rotation: (i * 45) % 360,
            duration: 0.75,
            ease: "power2.out",
            onComplete: () => dot.remove(),
          }
        );
      }
    };

    // Build Reference-matched timeline: S = { ride: 1.1, arrive: 0.5, note: 0.3, drop: 0.3, hold: 0.35, leave: 0.45 }
    const S = { ride: 1.1, arrive: 0.5, note: 0.3, drop: 0.3, hold: 0.35, leave: 0.45 };
    const irises: [number, number][] = [];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          snap: {
            snapTo: (value) => {
              // Snap out of iris open transitions cleanly
              for (const [startU, endU] of irises) {
                if (value > startU && value < endU) {
                  return value - startU < (endU - startU) * 0.45 ? startU : endU;
                }
              }
              return value;
            },
            delay: 0.1,
            duration: { min: 0.2, max: 0.6 },
            ease: "power1.inOut",
          },
        },
        onUpdate: renderFrame,
      });

      let curT = 0;
      const segEnds = [track.stopUs[0], track.stopUs[1], track.stopUs[2], 1];

      for (let i = 0; i < 3; i++) {
        // Ride up to stop i
        tl.to(
          state,
          { pos: segEnds[i], duration: S.ride, ease: "none" },
          curT
        );
        curT += S.ride;

        // Zoom push in (+30%) + road sign bounce
        tl.to(state, { push: 1, duration: S.arrive, ease: "power2.inOut" }, curT);
        const sign = signRefs.current[i];
        if (sign) {
          tl.fromTo(
            sign,
            { scale: 1 },
            {
              scale: 1.18,
              duration: 0.15,
              yoyo: true,
              repeat: 1,
              transformOrigin: "center bottom",
              ease: "power2.out",
            },
            curT
          );
        }

        // Open Stop Iris around cart
        const irisAt = curT + 0.1;
        tl.to(open[i], { v: 1, duration: 0.4, ease: "power2.in" }, irisAt);
        tl.add(() => {
          if (lastStopFired !== i) {
            lastStopFired = i;
            spawnBurst(clip.clientWidth * 0.35, clip.clientHeight * 0.42, 16);
          }
        }, irisAt + 0.15);

        // Ticket pop + Polaroid drop
        const ticket = ticketRefs.current[i];
        if (ticket) {
          tl.fromTo(
            ticket,
            { opacity: 0, scale: 1.08, rotation: 3 },
            {
              opacity: 1,
              scale: 1,
              rotation: 0,
              duration: S.note,
              ease: "back.out(1.7)",
            },
            irisAt + 0.12
          );
        }
        const board = boardRefs.current[i];
        const pols = board?.querySelectorAll(".cz-polaroid");
        if (pols && pols.length) {
          tl.fromTo(
            pols,
            { opacity: 0, y: -90, rotation: (n) => (n % 2 ? 12 : -12) },
            {
              opacity: 1,
              y: 0,
              rotation: (n) => (n % 2 === 0 ? -5 : 4),
              duration: S.drop,
              stagger: 0.07,
              ease: "back.out(1.5)",
            },
            irisAt + 0.18
          );
        }

        const holdEnd = curT + S.arrive + S.hold;
        // Close iris & zoom push back out
        tl.to(open[i], { v: 0, duration: S.leave, ease: "power2.out" }, holdEnd);
        tl.to(state, { push: 0, duration: S.leave, ease: "power2.inOut" }, holdEnd);
        curT = holdEnd + S.leave;

        const dur = tl.duration() || 1;
        irises.push([irisAt / dur, (irisAt + 0.4) / dur]);
      }

      // Final Outro ride to end gate
      tl.to(state, { pos: 1, duration: S.ride, ease: "none" }, curT);
    }, stage);

    const onStageClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, dialog")) return;
      const r = clip.getBoundingClientRect();
      spawnBurst(e.clientX - r.left, e.clientY - r.top, 14);
    };

    const onResize = () => renderFrame();
    clip.addEventListener("click", onStageClick);
    window.addEventListener("resize", onResize);

    return () => {
      ctx.revert();
      clip.removeEventListener("click", onStageClick);
      window.removeEventListener("resize", onResize);
    };
  }, [track]);

  return (
    <section id="experience" className="relative bg-[var(--paper)]">
      {/* Section Header */}
      <div className="shell pt-[var(--v)] pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label">
              <span className="label-idx">{COASTER_CONTENT.kickerIndex}</span>
              <span>{COASTER_CONTENT.kickerLabel}</span>
            </div>
            <h2
              data-split
              className="mt-2 font-display text-[clamp(2rem,1.4rem+2.5vw,3.4rem)] font-extrabold"
            >
              {COASTER_CONTENT.heading}
            </h2>
          </div>
          <p className="mono text-xs text-[var(--ink-faint)] max-w-[38ch]">
            {COASTER_CONTENT.subtitle}
          </p>
        </div>
      </div>

      {/* Reduced-motion accessible fallback timeline */}
      <div className="hidden motion-reduce:block shell pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COASTER_CONTENT.stops.map((stop) => (
            <article
              key={stop.id}
              className="rounded-[20px] border-2 border-[var(--ink)] bg-[var(--card)] p-6"
              style={{
                boxShadow: `8px 8px 0 0 ${ACCENT_HEX[stop.accent]}`,
              }}
            >
              <div className="mono text-xs text-[var(--ink-faint)]">
                {UI_LABELS.coasterStopPrefix} {stop.num} · {stop.period}
              </div>
              <h3 className="mt-2 font-display text-2xl font-extrabold">{stop.role}</h3>
              <div className="mt-1 font-semibold text-[var(--ink-soft)]">{stop.company}</div>
              <p className="mt-3 text-sm text-[var(--ink-soft)]">{stop.summary}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Scroll-Scrubbed Coaster Stage */}
      <div
        id="coaster"
        ref={stageRef}
        className="motion-reduce:hidden relative h-[860vh] min-h-[6000px]"
      >
        <div
          ref={clipRef}
          className="sticky top-[var(--bar)] h-[calc(100vh-var(--bar))] min-h-[480px] w-full overflow-hidden border-y border-[var(--hair)] bg-[var(--paper)] cursor-crosshair"
        >
          {/* 0.3x Parallax Sky: 22 Drifting Clouds & Background Ferris Wheels */}
          <svg
            ref={skyRef}
            className="pointer-events-none absolute left-0 top-0 h-full w-[3800px]"
            viewBox="0 0 3800 620"
            preserveAspectRatio="xMinYMid slice"
            aria-hidden="true"
          >
            {CLOUDS.map((c, idx) => (
              <g
                key={idx}
                transform={`translate(${c.x}, ${c.y}) scale(${c.scale})`}
                opacity="0.72"
              >
                <g
                  className="cz-drift"
                  style={{ ["--d" as string]: `${c.dur}s` }}
                >
                  <ellipse cx="0" cy="14" rx="48" ry="18" fill="#FCFBF8" />
                  <ellipse cx="-20" cy="4" rx="26" ry="18" fill="#FCFBF8" />
                  <ellipse cx="18" cy="2" rx="30" ry="20" fill="#FCFBF8" />
                </g>
              </g>
            ))}

            <FerrisWheel x={580} y={310} r={105} />
            <FerrisWheel x={1650} y={290} r={125} />
            <FerrisWheel x={2820} y={315} r={110} />
          </svg>

          {/* Click & Stop Fireworks Layer */}
          <div
            ref={fxLayerRef}
            className="pointer-events-none absolute inset-0 z-15 overflow-hidden"
            aria-hidden="true"
          />

          {/* Panning & Scaling World Layer */}
          <div
            ref={worldRef}
            className="absolute left-0 top-0 origin-top-left will-change-transform"
            style={{ width: WORLD_W, height: WORLD_H }}
          >
            <svg
              width={WORLD_W}
              height={WORLD_H}
              viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
              fill="none"
              className="block"
              aria-hidden="true"
            >
              {/* Ground Horizon + Dashed Road */}
              <rect
                x="0"
                y={GROUND_Y}
                width={WORLD_W}
                height={WORLD_H - GROUND_Y}
                fill="rgba(235,231,221,0.65)"
              />
              <line
                x1="0"
                y1={GROUND_Y}
                x2={WORLD_W}
                y2={GROUND_Y}
                stroke="rgba(19,17,26,0.22)"
                strokeWidth="2.5"
              />
              <line
                x1="0"
                y1={GROUND_Y + 34}
                x2={WORLD_W}
                y2={GROUND_Y + 34}
                stroke="rgba(19,17,26,0.16)"
                strokeWidth="3"
                strokeDasharray="22 18"
              />

              {/* Background Striped Circus Tents */}
              {[980, 2640, 4420].map((tx, tid) => (
                <g key={tx} transform={`translate(${tx}, ${GROUND_Y - 110})`} opacity="0.28">
                  <polygon points="0,110 75,28 150,110" fill={tid % 2 === 0 ? "#E0206A" : "#2B4BFF"} />
                  <polygon points="35,110 75,28 115,110" fill="#FCFBF8" />
                  <line x1="75" y1="0" x2="75" y2="28" stroke="#13111A" strokeWidth="3" />
                  <polygon points="75,2 96,10 75,18" fill="#E09200" />
                </g>
              ))}

              {/* Vertical Support Columns */}
              {track.supports.map((sup, i) => (
                <g key={i} opacity="0.2">
                  <line
                    x1={sup.x}
                    y1={sup.y1}
                    x2={sup.x}
                    y2={sup.y2}
                    stroke="#13111A"
                    strokeWidth="3"
                  />
                  {i % 2 === 0 && sup.y2 - sup.y1 > 90 && (
                    <line
                      x1={sup.x}
                      y1={sup.y1 + 24}
                      x2={round1(sup.x + 56)}
                      y2={sup.y2}
                      stroke="#13111A"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              ))}

              {/* 3-Ring Chasing Entry Marquee Gate */}
              <g transform="translate(110, 286)">
                <rect x="20" y="74" width="8" height="170" fill="#13111A" />
                <rect x="220" y="74" width="8" height="170" fill="#13111A" />
                <rect
                  x="0"
                  y="0"
                  width="248"
                  height="78"
                  rx="14"
                  fill="#13111A"
                  transform="translate(8, 8)"
                  fillOpacity="0.16"
                />
                <rect
                  x="0"
                  y="0"
                  width="248"
                  height="78"
                  rx="14"
                  fill="#FCFBF8"
                  stroke="#13111A"
                  strokeWidth="3"
                />
                {/* 3 staggered pathLength marquee bulb rings */}
                {[0, 1, 2].map((phase) => (
                  <g key={phase}>
                    <rect
                      x="7"
                      y="7"
                      width="234"
                      height="64"
                      rx="9"
                      pathLength={78}
                      stroke="#FFCB3D"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="0 3"
                      strokeDashoffset={phase}
                      opacity="0.2"
                      className={`cz-bulb-${phase}`}
                    />
                    <rect
                      x="7"
                      y="7"
                      width="234"
                      height="64"
                      rx="9"
                      pathLength={78}
                      stroke="#FFCB3D"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray="0 3"
                      strokeDashoffset={phase}
                      className={`cz-bulb-${phase}`}
                    />
                  </g>
                ))}
                <text
                  x="124"
                  y="45"
                  textAnchor="middle"
                  fill="#13111A"
                  fontFamily="var(--display)"
                  fontWeight="800"
                  fontSize="16"
                  letterSpacing="1"
                >
                  {COASTER_CONTENT.entryGate}
                </text>
              </g>

              {/* Stations, Road Signs, Bobbing Balloon Frames & Bunting */}
              {COASTER_CONTENT.stops.map((stop, idx) => {
                const bx = idx === 0 ? 2000 : idx === 1 ? 3740 : 4860;
                const by = idx === 0 ? 290 : idx === 1 ? 285 : 305;
                const accent = ACCENT_HEX[stop.accent];
                return (
                  <g key={stop.id}>
                    {/* Bobbing 3-Balloon Photo Sign */}
                    <g transform={`translate(${bx - 270}, ${by - 150})`}>
                      <g className="cz-bob">
                        <line x1="42" y1="62" x2="42" y2="112" stroke="#13111A" strokeWidth="1.5" />
                        <circle cx="24" cy="24" r="15" fill="#E0206A" stroke="#13111A" strokeWidth="2" />
                        <circle cx="42" cy="14" r="16" fill="#2B4BFF" stroke="#13111A" strokeWidth="2" />
                        <circle cx="60" cy="24" r="15" fill="#E09200" stroke="#13111A" strokeWidth="2" />
                        <rect
                          x="14"
                          y="58"
                          width="56"
                          height="42"
                          rx="6"
                          fill="#FCFBF8"
                          stroke="#13111A"
                          strokeWidth="2.5"
                        />
                        <text
                          x="42"
                          y="84"
                          textAnchor="middle"
                          fill="#13111A"
                          fontFamily="var(--mono)"
                          fontWeight="700"
                          fontSize="11"
                        >
                          {stop.num}
                        </text>
                      </g>
                    </g>

                    {/* Bouncing Road Sign */}
                    <g
                      ref={(el) => {
                        signRefs.current[idx] = el;
                      }}
                      transform={`translate(${bx - 165}, ${GROUND_Y - 104})`}
                    >
                      <rect x="64" y="46" width="6" height="58" fill="#13111A" />
                      <rect
                        x="6"
                        y="6"
                        width="130"
                        height="46"
                        rx="8"
                        fill={accent}
                      />
                      <rect
                        x="0"
                        y="0"
                        width="130"
                        height="46"
                        rx="8"
                        fill="#00967F"
                        stroke="#13111A"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="4"
                        y="4"
                        width="122"
                        height="38"
                        rx="5"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <text
                        x="65"
                        y="27"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontFamily="var(--mono)"
                        fontWeight="700"
                        fontSize="10"
                      >
                        {stop.signText}
                      </text>
                    </g>

                    {/* Green & White Striped Station Awning */}
                    <g transform={`translate(${bx}, ${by})`}>
                      <rect x="18" y="50" width="8" height={GROUND_Y - by - 50} fill="#13111A" />
                      <rect x="214" y="50" width="8" height={GROUND_Y - by - 50} fill="#13111A" />
                      <rect
                        x="0"
                        y="0"
                        width="240"
                        height="52"
                        rx="12"
                        fill="#FCFBF8"
                        stroke="#13111A"
                        strokeWidth="3"
                      />
                      {Array.from({ length: 6 }).map((_, stripe) => (
                        <rect
                          key={stripe}
                          x={stripe * 40 + 4}
                          y="4"
                          width="20"
                          height="16"
                          rx="3"
                          fill={stripe % 2 === 0 ? "#00967F" : "#FFFFFF"}
                        />
                      ))}
                      <text
                        x="120"
                        y="40"
                        textAnchor="middle"
                        fill="#13111A"
                        fontFamily="var(--mono)"
                        fontWeight="700"
                        fontSize="12"
                      >
                        {UI_LABELS.coasterStopPrefix} {stop.num} · {stop.period}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 3-Ring Chasing End Sign */}
              <g transform="translate(5140, 306)">
                <rect x="96" y="70" width="8" height="154" fill="#13111A" />
                <rect
                  x="0"
                  y="0"
                  width="204"
                  height="70"
                  rx="14"
                  fill="#13111A"
                />
                {[0, 1, 2].map((phase) => (
                  <rect
                    key={phase}
                    x="7"
                    y="7"
                    width="190"
                    height="56"
                    rx="9"
                    pathLength={78}
                    stroke="#FFCB3D"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="0 3"
                    strokeDashoffset={phase}
                    className={`cz-bulb-${phase}`}
                  />
                ))}
                <text
                  x="102"
                  y="40"
                  textAnchor="middle"
                  fill="#F5F3EE"
                  fontFamily="var(--display)"
                  fontWeight="800"
                  fontSize="14"
                >
                  {COASTER_CONTENT.endGate}
                </text>
              </g>

              {/* Perpendicular Rail Ties */}
              {track.ties.map((tie, idx) => (
                <line
                  key={idx}
                  x1={tie.x1}
                  y1={tie.y1}
                  x2={tie.x2}
                  y2={tie.y2}
                  stroke="#13111A"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              ))}

              {/* Base Dark Track Rail */}
              <path
                d={track.pathD}
                stroke="#13111A"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Colored Progress Rail Fill */}
              <path
                ref={railFillRef}
                d={track.pathD}
                stroke="#E0206A"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* White Center Track Gap */}
              <path
                d={track.pathD}
                stroke="#FCFBF8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>

            {/* Original Inline SVG Pink 3-Rider Coaster Car */}
            <div
              ref={cartRef}
              id="cz-cart"
              className="pointer-events-none absolute left-0 top-0 h-[116px] w-[140px] will-change-transform"
              style={{ transformOrigin: "70px 102px" }}
            >
              <svg width="140" height="116" viewBox="0 0 140 116" fill="none" aria-hidden="true">
                {/* 3 Cheering Colorful Riders */}
                <path d="M36 48 L26 30 M46 48 L52 32" stroke="#13111A" strokeWidth="3" strokeLinecap="round" />
                <circle cx="41" cy="40" r="8" fill="#2B4BFF" stroke="#13111A" strokeWidth="2.5" />
                <path d="M64 46 L56 26 M76 46 L84 26" stroke="#13111A" strokeWidth="3" strokeLinecap="round" />
                <circle cx="70" cy="37" r="8.5" fill="#F5B800" stroke="#13111A" strokeWidth="2.5" />
                <path d="M94 48 L88 31 M104 48 L114 30" stroke="#13111A" strokeWidth="3" strokeLinecap="round" />
                <circle cx="99" cy="40" r="8" fill="#00967F" stroke="#13111A" strokeWidth="2.5" />

                <path
                  d="M14 60 C14 52 22 48 32 48 H112 C124 48 132 56 132 68 V84 C132 88 128 92 122 92 H20 C16 92 14 88 14 84 Z"
                  fill="#E0206A"
                  stroke="#13111A"
                  strokeWidth="3"
                />
                <path
                  d="M22 68 H120"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <circle cx="126" cy="70" r="5" fill="#F5B800" stroke="#13111A" strokeWidth="2" />
                <circle cx="36" cy="98" r="10" fill="#FCFBF8" stroke="#13111A" strokeWidth="3" />
                <circle cx="36" cy="98" r="3.5" fill="#13111A" />
                <circle cx="104" cy="98" r="10" fill="#FCFBF8" stroke="#13111A" strokeWidth="3" />
                <circle cx="104" cy="98" r="3.5" fill="#13111A" />
              </svg>
            </div>
          </div>

          {/* Stop Iris Overlay Boards */}
          {COASTER_CONTENT.stops.map((stop, idx) => {
            const accent = ACCENT_HEX[stop.accent];
            return (
              <div
                key={stop.id}
                ref={(el) => {
                  boardRefs.current[idx] = el;
                }}
                className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-8"
                style={{
                  clipPath: "circle(0px at 50% 50%)",
                  backgroundColor: `color-mix(in srgb, ${accent} 18%, var(--paper))`,
                }}
              >
                <div className="shell grid grid-cols-1 min-[860px]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center gap-6 sm:gap-10">
                  {/* Perforated Ticket Card */}
                  <div
                    ref={(el) => {
                      ticketRefs.current[idx] = el;
                    }}
                    className="cz-ticket rounded-[22px] border-[3px] border-[var(--ink)] bg-[var(--card)] p-6 sm:p-8"
                    style={{ boxShadow: `12px 12px 0 0 ${accent}` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-[var(--hair)] pb-4">
                      <span
                        className="rounded-full px-3 py-1 mono text-xs font-bold text-white"
                        style={{ backgroundColor: accent }}
                      >
                        {UI_LABELS.coasterStopPrefix} {stop.num}
                      </span>
                      <span className="mono text-xs font-semibold text-[var(--ink-faint)]">
                        {stop.period}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-2xl sm:text-4xl font-extrabold text-[var(--ink)]">
                      {stop.role}
                    </h3>
                    <div className="mt-1 mono text-sm font-bold text-[var(--ink-soft)]">
                      {stop.company}
                    </div>
                    <p className="mt-4 text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
                      {stop.summary}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {stop.highlights.map((hl) => (
                        <span
                          key={hl}
                          className="rounded-full border border-[var(--hair)] bg-[var(--paper)] px-3 py-1 mono text-[0.72rem] font-semibold text-[var(--ink)]"
                        >
                          {hl}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Clickable Polaroid Cards -> Lightbox <dialog> */}
                  <div className="hidden sm:grid grid-cols-2 gap-4">
                    {stop.photos.map((ph, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => openLightbox(ph)}
                        className="cz-polaroid rounded-xl border-2 border-[var(--ink)] bg-[var(--card)] p-3 shadow-lg text-left hover:scale-[1.03] transition-transform cursor-pointer"
                        style={{
                          transform: `rotate(${pIdx % 2 === 0 ? -5 : 4}deg)`,
                        }}
                      >
                        <div className="aspect-[4/3] overflow-hidden rounded-lg border border-[var(--hair)] bg-[#DBD8CF]">
                          <img
                            src={ph.src}
                            alt={ph.caption}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="mt-2.5 text-center mono text-xs font-semibold text-[var(--ink-soft)]">
                          {ph.caption}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Polaroid Lightbox Modal */}
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto max-w-lg w-[90vw] rounded-[20px] border-[3px] border-[var(--ink)] bg-[var(--card)] p-4 sm:p-6 backdrop:bg-[var(--veil)]"
      >
        {lightboxPhoto && (
          <div>
            <div className="flex items-center justify-between gap-2 pb-3">
              <span className="mono text-xs font-bold text-[var(--ink-faint)]">
                {lightboxPhoto.caption}
              </span>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="ghost-circle"
                aria-label="Close photo"
              >
                ×
              </button>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[var(--hair)] bg-[#DBD8CF]">
              <img
                src={lightboxPhoto.src}
                alt={lightboxPhoto.caption}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
