"use client";

import { useEffect, useMemo, useRef } from "react";
import { ACCENT_HEX, COASTER_CONTENT, UI_LABELS } from "@/data/content";
import { ensureGsap, prefersReducedMotion } from "@/lib/gsap";

interface TrackSample {
  x: number;
  y: number;
  angle: number; // radians
  dist: number;
}

const WORLD_W = 5400;
const WORLD_H = 620;
const GROUND_Y = 530;

function sampleTrack(): {
  samples: TrackSample[];
  totalLen: number;
  pathD: string;
  supports: { x: number; y1: number; y2: number }[];
  ties: { x1: number; y1: number; x2: number; y2: number }[];
  stopTs: number[];
} {
  // Build continuous path points in world coordinates (0..5400, 0..620)
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

  // Lead-in platform -> first climb & drop into Loop 1
  pushCubic([80, 440], [260, 440], [340, 440], [480, 440], 24);
  pushCubic([480, 440], [640, 440], [720, 210], [920, 210], 34);
  pushCubic([920, 210], [1080, 210], [1160, 455], [1340, 455], 34);

  // Vertical Loop-the-Loop #1 (center x=1560, bottom y=455, radius=115)
  const l1cx = 1560;
  const l1cy = 340;
  const l1r = 115;
  pushCubic([1340, 455], [1440, 455], [1500, 455], [1560, 455], 16);
  for (let i = 1; i <= 64; i++) {
    const theta = Math.PI / 2 - (i / 64) * Math.PI * 2;
    const x = l1cx + Math.cos(theta) * l1r + (i / 64) * 32;
    const y = l1cy + Math.sin(theta) * l1r;
    raw.push({ x, y });
  }
  // Exit Loop 1 -> Stop 01 flat
  pushCubic([1592, 455], [1730, 455], [1820, 420], [1980, 420], 28);
  pushCubic([1980, 420], [2120, 420], [2200, 420], [2340, 420], 20);

  // Ride 2: Tall hill -> drop -> Loop 2
  pushCubic([2340, 420], [2500, 420], [2580, 175], [2760, 175], 36);
  pushCubic([2760, 175], [2920, 175], [2980, 460], [3140, 460], 34);

  // Vertical Loop-the-Loop #2 (center x=3320, radius=100)
  const l2cx = 3320;
  const l2cy = 360;
  const l2r = 100;
  pushCubic([3140, 460], [3220, 460], [3270, 460], [3320, 460], 16);
  for (let i = 1; i <= 60; i++) {
    const theta = Math.PI / 2 - (i / 60) * Math.PI * 2;
    const x = l2cx + Math.cos(theta) * l2r + (i / 60) * 28;
    const y = l2cy + Math.sin(theta) * l2r;
    raw.push({ x, y });
  }

  // Exit Loop 2 -> Stop 02 flat
  pushCubic([3348, 460], [3480, 460], [3560, 415], [3720, 415], 28);
  pushCubic([3720, 415], [3860, 415], [3940, 415], [4080, 415], 20);

  // Outro camelbacks -> Stop 03 -> End gate
  pushCubic([4080, 415], [4240, 415], [4300, 260], [4480, 260], 32);
  pushCubic([4480, 260], [4620, 260], [4700, 435], [4880, 435], 30);
  pushCubic([4880, 435], [5040, 435], [5160, 435], [5320, 435], 24);

  // Compute cumulative arc length
  const cum: number[] = [0];
  for (let i = 1; i < raw.length; i++) {
    const dx = raw[i].x - raw[i - 1].x;
    const dy = raw[i].y - raw[i - 1].y;
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  const totalLen = cum[cum.length - 1];

  // Uniform resample every ~6px
  const stepDist = 6;
  const count = Math.floor(totalLen / stepDist);
  const samples: TrackSample[] = [];
  let j = 0;
  for (let s = 0; s <= count; s++) {
    const target = (s / count) * totalLen;
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const u = (target - cum[j]) / seg;
    const x = raw[j].x + (raw[j + 1].x - raw[j].x) * u;
    const y = raw[j].y + (raw[j + 1].y - raw[j].y) * u;
    samples.push({ x, y, angle: 0, dist: target });
  }

  // Smooth continuous angles (unwrapped so loops rotate smoothly)
  for (let i = 0; i < samples.length; i++) {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    let ang = Math.atan2(next.y - prev.y, next.x - prev.x);
    if (i > 0) {
      while (ang - samples[i - 1].angle > Math.PI) ang -= Math.PI * 2;
      while (ang - samples[i - 1].angle < -Math.PI) ang += Math.PI * 2;
    }
    samples[i].angle = ang;
  }

  const pathD = samples
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const round1 = (n: number) => Math.round(n * 10) / 10;

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

  // Find t positions closest to x = 2120, 3860, 4960 (our 3 Stop booths)
  const findTAtX = (targetX: number) => {
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < samples.length; i++) {
      // Avoid matching loop backtrack
      const d = Math.abs(samples[i].x - targetX);
      if (d < bestDiff && samples[i].y > 380) {
        bestDiff = d;
        bestIdx = i;
      }
    }
    return bestIdx / (samples.length - 1);
  };

  const stopTs = [findTAtX(2120), findTAtX(3860), findTAtX(4980)];

  return { samples, totalLen, pathD, supports, ties, stopTs };
}

export function CoasterSection() {
  const track = useMemo(() => sampleTrack(), []);
  const stageRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<SVGSVGElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<SVGPathElement>(null);
  const boardRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    const applyAtT = (t: number) => {
      const clamped = Math.max(0, Math.min(1, t));
      const fIdx = clamped * (track.samples.length - 1);
      const i0 = Math.floor(fIdx);
      const i1 = Math.min(track.samples.length - 1, i0 + 1);
      const frac = fIdx - i0;
      const p0 = track.samples[i0];
      const p1 = track.samples[i1];

      const px = p0.x + (p1.x - p0.x) * frac;
      const py = p0.y + (p1.y - p0.y) * frac;
      const pAngle = p0.angle + (p1.angle - p0.angle) * frac;

      const vw = clip.clientWidth || 1200;
      const vh = clip.clientHeight || 680;
      const scale = Math.min(1.06, Math.max(0.58, vh / WORLD_H));

      // Camera centers cart horizontally around 44% viewport width
      const rawCamX = vw * 0.44 - px * scale;
      const minCamX = vw - WORLD_W * scale;
      const camX = Math.max(minCamX, Math.min(0, rawCamX));
      const camY = (vh - WORLD_H * scale) * 0.5;

      world.style.transform = `translate3d(${camX.toFixed(1)}px, ${camY.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      if (sky) {
        sky.style.transform = `translate3d(${(camX * 0.3).toFixed(1)}px, 0, 0)`;
      }

      // Cart rides tangent to curve
      const deg = (pAngle * 180) / Math.PI;
      cart.style.transform = `translate3d(${(px - 70).toFixed(1)}px, ${(py - 102).toFixed(1)}px, 0) rotate(${deg.toFixed(2)}deg)`;

      // Rail fill dashoffset
      railFill.style.strokeDashoffset = `${(totalLen * (1 - clamped)).toFixed(1)}`;

      // Determine stop iris boards
      let currentStop = -1;
      track.stopTs.forEach((st, sIdx) => {
        const dist = Math.abs(clamped - st);
        const halfWin = 0.055;
        const board = boardRefs.current[sIdx];
        if (dist < halfWin) {
          currentStop = sIdx;
          const v = 1 - Math.max(0, (dist - 0.015) / (halfWin - 0.015));
          const maxR = Math.hypot(vw, vh) * 0.65;
          if (board) {
            board.style.clipPath = `circle(${(v * maxR).toFixed(1)}px at 50% 50%)`;
            board.style.pointerEvents = v > 0.4 ? "auto" : "none";
          }
        } else if (board) {
          board.style.clipPath = "circle(0px at 50% 50%)";
          board.style.pointerEvents = "none";
        }
      });

      // Rail color updates with milestone progress
      const colorIdx =
        clamped < track.stopTs[0]
          ? 0
          : clamped < track.stopTs[1]
            ? 1
            : 2;
      const stopAccent =
        ACCENT_HEX[COASTER_CONTENT.stops[colorIdx]?.accent ?? "pink"];
      railFill.style.stroke = stopAccent;
    };

    applyAtT(0);
    if (prefersReducedMotion()) return;

    const { ScrollTrigger } = ensureGsap();
    const st = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8,
      onUpdate: (self) => applyAtT(self.progress),
    });

    const onResize = () => applyAtT(st.progress);
    window.addEventListener("resize", onResize);

    return () => {
      st.kill();
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
        className="motion-reduce:hidden relative h-[760vh] min-h-[5200px]"
      >
        <div
          ref={clipRef}
          className="sticky top-[var(--bar)] h-[calc(100vh-var(--bar))] min-h-[480px] w-full overflow-hidden border-y border-[var(--hair)] bg-[var(--paper)]"
        >
          {/* 0.3x Parallax Sky: Soft Clouds */}
          <svg
            ref={skyRef}
            className="pointer-events-none absolute left-0 top-0 h-full w-[2600px]"
            viewBox="0 0 2600 620"
            preserveAspectRatio="xMinYMid slice"
            aria-hidden="true"
          >
            {[180, 580, 1020, 1480, 1940, 2320].map((cx, idx) => (
              <g
                key={cx}
                transform={`translate(${cx}, ${70 + (idx % 3) * 42})`}
                opacity="0.72"
              >
                <ellipse cx="0" cy="14" rx="48" ry="18" fill="#FCFBF8" />
                <ellipse cx="-20" cy="4" rx="26" ry="18" fill="#FCFBF8" />
                <ellipse cx="18" cy="2" rx="30" ry="20" fill="#FCFBF8" />
              </g>
            ))}
          </svg>

          {/* Panning & Scaling World Layer */}
          <div
            ref={worldRef}
            className="absolute left-0 top-0 origin-top-left will-change-transform"
            style={{ width: WORLD_W, height: WORLD_H }}
          >
            {/* World SVG: Ground, Supports, Ties, Rails, Marquee Gates, Booths, Signs */}
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
                      x2={sup.x + 56}
                      y2={sup.y2}
                      stroke="#13111A"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              ))}

              {/* Entry Marquee Gate */}
              <g transform="translate(110, 290)">
                <rect x="20" y="70" width="8" height="170" fill="#13111A" />
                <rect x="220" y="70" width="8" height="170" fill="#13111A" />
                <rect
                  x="0"
                  y="0"
                  width="248"
                  height="74"
                  rx="14"
                  fill="#FCFBF8"
                  stroke="#13111A"
                  strokeWidth="3"
                />
                <text
                  x="124"
                  y="43"
                  textAnchor="middle"
                  fill="#13111A"
                  fontFamily="var(--display)"
                  fontWeight="800"
                  fontSize="16"
                  letterSpacing="1"
                >
                  {COASTER_CONTENT.entryGate}
                </text>
                {Array.from({ length: 9 }).map((_, b) => (
                  <circle
                    key={b}
                    cx={20 + b * 26}
                    cy={12}
                    r="4"
                    fill={b % 2 === 0 ? "#E0206A" : "#E09200"}
                    className={`cz-bulb-${b % 3}`}
                  />
                ))}
              </g>

              {/* Striped Station Booths & Blue/Teal Road Signs */}
              {COASTER_CONTENT.stops.map((stop, idx) => {
                const bx = idx === 0 ? 2000 : idx === 1 ? 3740 : 4860;
                const by = idx === 0 ? 290 : idx === 1 ? 285 : 305;
                return (
                  <g key={stop.id}>
                    {/* Blue/Teal Highway Road Sign */}
                    <g transform={`translate(${bx - 165}, ${GROUND_Y - 96})`}>
                      <rect x="56" y="42" width="6" height="54" fill="#13111A" />
                      <rect
                        x="0"
                        y="0"
                        width="118"
                        height="44"
                        rx="8"
                        fill="#00967F"
                        stroke="#13111A"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="4"
                        y="4"
                        width="110"
                        height="36"
                        rx="5"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <text
                        x="59"
                        y="26"
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

              {/* End Sign */}
              <g transform="translate(5140, 310)">
                <rect x="96" y="64" width="8" height="156" fill="#13111A" />
                <rect
                  x="0"
                  y="0"
                  width="200"
                  height="66"
                  rx="14"
                  fill="#13111A"
                />
                <text
                  x="100"
                  y="38"
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

            {/* Original Inline SVG Pink 4-Passenger Coaster Car */}
            <div
              ref={cartRef}
              id="cz-cart"
              className="pointer-events-none absolute left-0 top-0 h-[116px] w-[140px] will-change-transform"
              style={{ transformOrigin: "70px 102px" }}
            >
              <svg width="140" height="116" viewBox="0 0 140 116" fill="none" aria-hidden="true">
                {/* 3 Cheering Colorful Riders */}
                {/* Rider 1 (Blue) */}
                <path d="M36 48 L26 30 M46 48 L52 32" stroke="#13111A" strokeWidth="3" strokeLinecap="round" />
                <circle cx="41" cy="40" r="8" fill="#2B4BFF" stroke="#13111A" strokeWidth="2.5" />
                {/* Rider 2 (Yellow) */}
                <path d="M64 46 L56 26 M76 46 L84 26" stroke="#13111A" strokeWidth="3" strokeLinecap="round" />
                <circle cx="70" cy="37" r="8.5" fill="#F5B800" stroke="#13111A" strokeWidth="2.5" />
                {/* Rider 3 (Mint) */}
                <path d="M94 48 L88 31 M104 48 L114 30" stroke="#13111A" strokeWidth="3" strokeLinecap="round" />
                <circle cx="99" cy="40" r="8" fill="#00967F" stroke="#13111A" strokeWidth="2.5" />

                {/* Main Pink Coaster Car Chassis */}
                <path
                  d="M14 60 C14 52 22 48 32 48 H112 C124 48 132 56 132 68 V84 C132 88 128 92 122 92 H20 C16 92 14 88 14 84 Z"
                  fill="#E0206A"
                  stroke="#13111A"
                  strokeWidth="3"
                />
                {/* Glossy Accent Stripe */}
                <path
                  d="M22 68 H120"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                {/* Front Headlight */}
                <circle cx="126" cy="70" r="5" fill="#F5B800" stroke="#13111A" strokeWidth="2" />

                {/* Wheels Riding on Rail */}
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
                  {/* Ticket Card */}
                  <div
                    className="rounded-[22px] border-[3px] border-[var(--ink)] bg-[var(--card)] p-6 sm:p-8"
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

                  {/* Polaroid Cards */}
                  <div className="hidden sm:grid grid-cols-2 gap-4">
                    {stop.photos.map((ph, pIdx) => (
                      <div
                        key={pIdx}
                        className="rounded-xl border-2 border-[var(--ink)] bg-[var(--card)] p-3 shadow-lg"
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

