# Phase 2: Strict Mismatch List (`Reference` vs `My Build`)

Audited strictly against `docs/animation-inventory.md` across Desktop (`1440×900`) and Mobile (`390×844`).

---

## Batch A: Loader, Navbar, Mobile Menu & Page-Entry Sequence
1. **Loader `#progress` z-index & position:** Reference places `#progress` fixed at `top: 0; z-index: 56` (`body` top edge); mine places `#progress` inside `.topbar` at `bottom-0`.
2. **Preloader timing & globalTimeline gating:** Reference gates `gsap.globalTimeline` paused until `document.fonts.ready` + `700ms` min + active image decode + 3 calm rAF frames (`<=2500ms`), then triggers `.out` + `HERO.enter`; mine uses a flat `2200ms` delay and fires `"preloader:done"` simultaneously without pausing GSAP or triggering above-fold `[data-split]` at load.
3. **Navbar `#brand-word` opacity fade:** Reference animates `yPercent` **and** `opacity: 0 <-> 1` (`0.3s power2.in` out, `0.45s power3.out` in); mine only animates `yPercent` without `opacity`.
4. **Navbar `.hl` brush inset:** Reference uses `--hl-inset: 24% 5px 16%` (`inset` behind text baseline rather than full padding box); mine applies `inset: -0.06em -0.22em -0.08em` on the entire padded link box.
5. **Mobile Drawer link stagger:** Reference animates drawer links with `gsap.from("#drawer a[data-route]", { x: 26, opacity: 0, duration: 0.5, stagger: 0.05, delay: 0.12 })` on open; mine slides the drawer panel without staggering links.
6. **Above-fold `[data-split]` vs scroll trigger:** Reference animates above-fold `[data-split]` immediately on page entry (`delay: 0.08`) and below-fold via ScrollTrigger; mine attaches `ScrollTrigger` to all `[data-split]`.

---

## Batch B: Hero & ID Badge (`#ly-hero`)
7. **Hero entry timing & dot squash on period:** Reference delays `stampIn` to `0.15s`, staggers `[sub, punch, .ly-cta, .socials, .ly-hint]` at `0.50s`, pops the initial dot at `1.00s`, draws `.ly-ul` at `1.30s` with sweeping `ly-ul` `2.3s` animation, squashes the dot on the punctuation period at `2.00s` (`scaleX: 1.35, scaleY: 0.65, 0.14s`) then launches it (`vx = -0.55*s, vy = -0.84*s`) at `2.14s` while revealing `#ly-bops-wrap`; mine launches the dot immediately into gravity at t=0 without period squash/launch sequence.
8. **Verlet Lanyard ambient breeze, tilt, scroll kick & throw velocity:** Reference applies continuous ambient breeze (`sin(t*0.9)*14 + sin(t*2.3)*6`), `perspective(900px) rotateY(tilt)` driven by horizontal velocity, scroll-velocity vertical/horizontal kick, and `1800px/s` tracked pointer throw velocity; mine has no ambient breeze, no `rotateY` velocity tilt, no scroll kick, and no pointer release throw velocity.
9. **ID Badge metallic clip, front/back design & Flip impulse:** Reference uses CSS `.ly-badge::before` rounded metallic clip (`34×40px`, `linear-gradient(90deg, #8E8A99, #D9D6DE 45%, #8E8A99)`), a `0.8s` flip duration (`transition: transform 0.8s cubic-bezier(.22,1,.36,1)`), and adds random `(Math.random()-0.5)*12` impulse on flip; mine uses `0.5s` flip and no flip impulse. Also on mobile (`390×844`), our `#ly-badge-stage` bottom slightly overlaps `"Mohammad"` in `<h1>`.
10. **Multi-dot physics & letter/button collisions:** Reference supports spawning extra dots on hero click (up to `5` desktop / `3` touch, `back.out(3)` spawn), collides dots against individual `<h1>` letters and lead words (hopping letters `translateY(-16%)` `520ms` flashing dot color + spraying 4 `.ly-bit` particles), tilts CTA/social buttons (`-4→3→0deg` `360ms`) on collision, interacts with mouse bat (`r=24`), and bounces off the live `#ly-floor` wave surface; mine only has 1 dot colliding with hero edges, cursor, and badge (no letter/word/button collisions, no click-to-spawn, no sparks, no wave surface bounce).
11. **Mobile hero social pills & dot overlap:** Reference uses 4-col grid on mobile (`≤760px`); mine has 5 social pills (`flex-wrap`) — looks clean, keep 5-pill flex-wrap, just fix `#ly-badge-stage` mobile height so badge never overlaps `<h1>`.

---

## Batch C: Selected Work & Projects Grid
12. **Selected Work entry diagonal `.sc-wipe` reveal:** Reference wipes diagonal `.sc-wipe` ribbons open (`scaleX: 1 -> 0, 0.9s power3.inOut, stagger: 0.12` sorted by distance from active slide) on `ScrollTrigger start: "top 70%"` + staggers title/line/controls; mine keeps `.sc-wipe` static at `opacity: 0.78` on inactive slides without entry wipe animation.
13. **Selected Work caption transition & interactions:** Reference animates `.sc-title` / `.sc-line` out (`yPercent: -110`, `0.3s power2.in`) then in (`yPercent: 110 -> 0`, `0.6s power3.out` at `0.25s`), supports `ArrowLeft`/`ArrowRight` keyboard navigation and pointer drag/swipe (`|dx| > 50px`), and updates radial `.sc-btn` `--fx / --fy` on both enter and leave; mine fades the whole info block instead of masked slide, lacks keyboard/swipe support, and uses `--hx / --hy`.
14. **Projects Grid `ScrollTrigger.batch` reveal & directional entrance:** Reference uses `ScrollTrigger.batch("#all-cards .card", { start: "top 95%" })` animating `y: 100 -> 0` (scrolling down) / `-100 -> 0` (scrolling up) with `stagger: 0.06, 0.65s power3.out` and resetting on leave; mine has no scroll reveal on project cards (only filter click stagger).
15. **Dynamic Contact Title Hand-off:** Clicking Hero secondary / Bottom CTA / Coaster CTA in reference updates Contact's giant heading dynamically (`data-contact-title`) before scrolling/navigating; mine always shows static `"Let's build something great"`. *(Keep `"Let's build something great"` as default on navbar/direct `#contact`, and optionally support contextual title handoff on Bottom CTA / Coaster CTA or keep clean — let's check: user asked to keep their exact real copy `"Let's build something great"`, so we should keep `"Let's build something great"`!)*

---

## Batch D: Process Section (`#process`)
16. **Desktop pinned phases & exact timings:**
    - Reference pins `.pr-stage` (`sticky` inside `5701px`-tall `#process`), runs `FILL=1, BEAT=0.3, DWELL=0.5`, stamps intro kicker (`top 92%`), illuminates words `0.18 -> 1` (`stagger: { amount: 0.9 }`), expands Step 1 `clip-path` (`50% 50% round 24px -> 26% 24% -> 0% 0% round 0px`), scales bg `1.3 -> 1` + dwell drift `scale: 1 -> 1.06, xPercent: 0 -> -3`, wipes Steps 2–3 horizontally (`--cw: 100% -> 0%`) while outgoing bg shifts `xPercent: -3 -> -13` and outgoing copy exits `x: 0 -> -80, opacity: 0`, animates copy drift `y: 0 -> -24` and outline numbers `yPercent: 30 -> 0 -> -10`, fills the 3 `46×4px` bars sequentially (`scaleX: 0 -> 1`), and runs `@keyframes nm-hop` letter hop on active step title!
    - Mine lacks outgoing copy exit (`x: -80`), bg dwell drift (`scale 1.06, xPercent -3 -> -13`), copy dwell drift (`y: -24`), outline number entrance/drift, and active title `nm-hop` letter animation; also mine uses GSAP `pin: true` (fine, works great, just match the exact phases/timings!).
17. **Mobile Process statement scrub & carousel sync:** Reference scrubs mobile statement words `opacity: 0.5 -> 1` (`start: "top 85%", end: "bottom 50%", scrub: true`) and syncs `aria-disabled` on Prev/Next `.sc-btn` arrows cleanly; mine doesn't scrub mobile statement words.

---

## Batch E: About Section (`#about`)
18. **Turntable shuffle/pause visual controls & disc slide:** Reference has Pause/Resume spin button (`⏸ Pause` / `▶ Play`) and Shuffle/Cycle Deck button (`↻ Skip ahead` — lifting arm, sliding disc inside sleeve `-34% -> 0`, cycling caption) below the deck *(no audio, purely visual deck mechanics)*; mine lacks those two visual buttons below the deck.
19. **Tracklist brush sweep & `is-on` exit:** Reference sweeps `.a5-w::before` out to the right on deselect (`transform-origin` flip) and pauses `.a5-eq` + `.a5-spin` cleanly when paused; mine toggles `scaleX(0<->1)` from left only.
20. **Bio role underline `nm-line`:** Reference uses `.a5-role` sweeping `nm-line` (`6s cubic-bezier(.65,0,.35,1) infinite`) matching `.c3-title` rather than static `.ly-ul.is-drawn`; mine uses static `.ly-ul.is-drawn` (`scaleX(1)`).
21. **Codeblock typewriter caret & word-level scramble glitch:** Reference fades `.a5-caret` out `1.2s` after typing finishes and runs a realistic **5–8 word scramble glitch** (`0.06s` ticks over 4–7 holds, resolving letter-by-letter) that pauses on hover or text selection; mine keeps the caret blinking forever and only flashes a single random character.

---

## Batch F: Skills Section (`#skills-tinted`, `#skills`)
22. **Scroll-triggered initial reveal (`.sk.is-live`):** Reference only plays the tab shake/bar fill entrance when `#skills` scrolls into view (`ScrollTrigger start: "top 85%", once: true`); mine shows bars pre-filled on load without initial scroll reveal.
23. **Tab switch WAAPI shake, misregistration & stepped bar fills:**
    - Reference WAAPI shake includes `scale(1.012)` and `rotate(±0.5deg)` (not just `x/y` translation).
    - Reference `.sk-title` misregistration skews `-10deg -> 6deg -> -2deg -> 0` with `±8px` dual-accent text-shadow.
    - Reference bar fills use **2-layer staggered fills**: `::before` ghost fill (`0.45s`, `n*70ms + 150ms`) followed by stepped 20-segment `steps(--s)` fill (`0.7s`, `n*70ms + 320ms`) and `.sk-val` pop (`0.35s`, `n*70ms + 600ms`); mine uses a single linear CSS transition (`0.65s`).
24. **Arrow key navigation on tabs:** Reference supports `ArrowLeft`, `ArrowRight`, `Home`, `End` on `[role="tab"]`; mine only handles click.

---

## Batch G: Experience / Coaster (`#coaster`)
25. **Speed-coupled physics, `+30%` zoom `push` & smooth look-ahead camera:** Reference accelerates cart downhill / slows at loop & hill crests, zooms camera `+30%` (`z = k * (1 + push * 0.3)`) at each stop, uses `tanh` look-ahead damping, and snaps out of iris transitions (`snap` on ScrollTrigger); mine moves linearly by arc length with no zoom push, no speed coupling, and no ScrollTrigger `snap`.
26. **Richer Coaster World Scenery & Props:** Reference includes `22` drifting parallax clouds (`45–74s`), `3`-ring chasing marquee gates (`pathLength=78` + halo glow), road sign scale bounce (`1 -> 1.18 -> 1`, `0.15s` yoyo) on stop arrival, striped circus tents, rotating Ferris wheels (`40s`), bunting flags, floating bobbing balloon photo frames (`cz-bob 3s`), and trackside photo post signs; mine only has 6 clouds, 1-ring marquee, static signs, and lacks circus tents / bunting / Ferris wheels / bobbing balloons / sign bounce.
27. **Stop Iris centering on cart, ticket pop, polaroid drop & lightbox:**
    - Reference opens iris centered on the cart `(ax, ay - 60*k)`, pops `.cz-ticket` (`scale: 1.08->1, rot: 3->0, 0.3s back.out(1.7)`), drops polaroids (`y: -90->0, rot: ±12deg->0, 0.3s back.out(1.5), stagger: 0.07`), and opens a `<dialog>` lightbox when a polaroid is clicked!
    - Mine opens iris centered at `50% 50%` without ticket pop animation, polaroid drop animation, or polaroid click lightbox.
28. **Coaster Particle Fireworks (`.cz-fx`):** Reference bursts pixel/shape fireworks in the sky while riding AND on clicking the coaster stage; mine has no coaster fireworks.

---

## Batch H: Contact, Bottom CTA & Footer
29. **7 Draggable Peel Stickers (`.c3-s` in `.c3-peel`):** Reference's 7 top-right geometric stickers are **draggable** (`pointerdown/move/up`, lifts `scale(1.1)`, raises `zIndex`, drops with spring random rotation `[-15deg, 15deg]` `500ms`) and reposition above the Contact heading on mobile (`≤760px`); mine renders them as static non-draggable shapes `hidden` on mobile (`hidden lg:block`).
30. **Contact Title `.nm` underline behavior:** Reference applies `.nm` (`nm-line 6s`) only on the emphasized portion or cleanly without thick overlap, triggered after stamp-in (`.stamp.is-idle`); mine runs `nm-line` unconditionally on both wrapped lines.
31. **Submit Confirmation Spring Stamp:** Reference pops a circular tilted `"Sent!"` sticker with `scale: 2.4 -> 1, rotate: -44deg -> -10deg` (`560ms`); mine shows `"RECEIVED ✓"` statically without the pop animation.
32. **Bottom CTA (`.band`) cursor shape trail:** Reference attaches `initShapeFx` (`.band-fx`) inside the Bottom CTA card; mine lacks `ShapeTrail` on `BottomCtaSection`.
33. **Footer & `#to-top` observer:** Reference triggers `#to-top` using a `0px` top sentinel (`IntersectionObserver` as soon as user scrolls down slightly past top) and displays a 2-column `.foot-links` grid on mobile (`≤760px`); mine waits until `scrollY > 60vh` and uses flex-wrap on mobile footer links.

---

## Batch I: Global Effects & Mobile Pass
34. **Lenis smooth scroll:** Reference does **NOT** use Lenis (`hasLenis: false`) — keep native scroll + GSAP ScrollTrigger.
35. **Wave Dividers (`#ly-floor`, `#foot-wave`) physics & stroke:** Reference uses 1D PDE spring wave (`FK=26, FD=3.4, N=24..72`), `stroke: var(--hair); stroke-width: 1.5; vector-effect: non-scaling-stroke`, reacts to dot floor bounces, and sleeps when idle; mine runs `rAF` continuously on 14 points without top hairline stroke and without dot-bounce coupling.
36. **Full Mobile (`390×844`) Audit:** Re-verify `#ly-badge` vertical clearance above `<h1>`, mobile drawer stagger, portrait `4/5` carousel swipe, Process mobile scrub + circular arrows, Coaster mobile anchor `ax = 0.42*W`, Contact peel stickers on mobile, and `0` horizontal overflow across every section.

