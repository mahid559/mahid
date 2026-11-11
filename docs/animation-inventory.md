# Animation & Design Inventory — Reference (`https://createdbywilliam.co.za/`)

> Captured from live DOM, `document.styleSheets`, computed CSS, `ScrollTrigger.getAll()`, and interactive behavior at Desktop (`1440×900`, inner `1440×754`) and Mobile (`390×844`).
> Note: Playground (`#play`), Live OS embed (`.os-sec`), GSAP Showcase Winner badge/dome, Spider-Man content, and WebAudio/music controls are intentionally excluded per project scope.

---

## 1. Routes & Single-Page Mapping

| Reference Route | Contents on Reference | How Represented in Single-Page Build |
|---|---|---|
| `#portfolio` (default) | `#ly-hero` + `#ly-floor` wave, `.showcase` (5 featured sites), `#process` (pinned 3-step storytelling), `.os-sec` *(omitted)*, Bottom `.band` CTA | Rendered sequentially inside `#portfolio` (`HeroSection`, `WaveDivider`, `SelectedWorkSection`, `ProcessSection`) |
| `#about` | `.a5` Turntable deck + tracklist + bio + glitching `.codeblock`, `#skills-tinted` (4-tab matrix + `#skills-fx`), `#coaster` (horizontal scroll-scrubbed career rollercoaster + iris stops + polaroid lightbox), `.tinted-2` After Hours *(removed per user)*, Bottom `.band` CTA | Rendered sequentially inside `#about` (`AboutSection`, `SkillsSection`, `CoasterSection`) |
| `#projects` | `.showcase` featured carousel, `#all-cards` 3-col filterable project grid with `ScrollTrigger.batch`, Bottom `.band` CTA | `ProjectsSection` (`#projects`) with category filter pills + batch scroll reveal (carousel already sits above in `#portfolio`, with `"All projects →"` scrolling to `#projects`) |
| `#play` | Interactive shape playground + OS window | **Omitted** per project rules |
| `#contact` | `#contact-fx` trail, `.c3-head` with dynamic `.c3-title` + tilted `.status` pill + 7 draggable peel stickers (`.c3-peel`), `#form-card`, `.lines` Direct Lines + `Copy`, 3 FAQ `<details>` | `ContactSection` (`#contact`) + `BottomCtaSection` (`#contact` CTA) + dynamic contact-title update when clicking any `#contact` CTA link |

---

## 2. Global Design Tokens & Layout Specs (`:root`)

- **Surfaces:** `--paper: #F5F3EE`, `--shell: #EBE7DD`, `--tint: #E4EDE9`, `--tint-2: #EDE8F2`, `--card: #FCFBF8`, `--veil: rgba(19, 17, 26, 0.50)`
- **Inks & Borders:** `--ink: #13111A`, `--ink-soft: #4D4860`, `--ink-faint: #615C72`, `--hair: rgba(19, 17, 26, 0.14)`, `--hair-soft: rgba(19, 17, 26, 0.07)`
- **Accents:** `--pink: #E0206A`, `--pink-ink: #B31D58`, `--blue: #2B4BFF`, `--yellow: #E09200`, `--mint: #00967F`, `--mint-ink: #057365`, `--on-accent: #FFFFFF`
- **Fonts:** Display `"Saira"` (`800`, `-0.03em`, `1.02` lh); Body `"Barlow"` (`400/600/700/800`, `clamp(1rem, 0.97rem + 0.16vw, 1.08rem)`, `1.6` lh); Mono `"JetBrains Mono"`; Loader `"Bricolage Loader"` / `"Bricolage Grotesque"` (`800`).
- **Grid & Spacing:** `.shell` `max-width: 1280px`, `--gut: clamp(20px, 5vw, 56px)`, `--v: clamp(34px, 4.6vw, 62px)`, `--bar: 66px`, `--floor: clamp(64px, 9vh, 104px)`, `--r: 14px`, `--r-lg: 20px`, `--ease: cubic-bezier(.22,1,.36,1)`.
- **Paper Grain (`body::before`):** `position: fixed; inset: -10px; z-index: 60; pointer-events: none; background: radial-gradient(rgba(19,17,26,.045) 1px, transparent 1.15px) 0 0 / 4px 4px`.

---

## 3. Complete Animation & Interaction Inventory

### A. Preloader & Global Page-Entry
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| `#loader` backdrop & wedge | Page load | `--wipe` color + 4px dot grain; `::before` black angled overhang above top (`top: -75%`); collapses upward on lift | Exit `0.6s`, delay `0.1s`, `cubic-bezier(1, 0.885, 0.32, 1)`; bailout `4s` | `scaleY(1 -> 0)`, `transform-origin: center bottom` |
| `.loader-ring` & 15 `<span>` chars | Page load | Ring spins; 15 radial chars (`72px` radius) bob radially | Ring `5s linear infinite`; char bob `0.25s ease-in-out infinite alternate`, stagger `-0.0625s * i`; ring fade `0.3s` on exit | `rotate(0->360deg)`, `translateY(0->10px)` |
| `[data-stamp]` titles | Load (`0.35s`) / Scroll (`top 88%`, `once`) | `stampIn`: split letters `.nm-w > span` pop up; adds `.is-idle` | `0.6s`, `back.out(1.6)`, stagger `0.035` | `yPercent: 40 -> 0`, `opacity: 0 -> 1` |
| `[data-split]` headings | Load (`idx < 2` above fold) / Scroll (`top 88%`, `once`) | Word mask reveal `<span class="w"><span>word</span></span>`; adds `.is-in` | `0.9s`, delay `0.08s`, `power3.out`, stagger `0.035` | `yPercent: 115 -> 0`, `opacity: 0 -> 1` |
| `[data-anim="up"]` blocks | Scroll (`top 92%`, `once`) | Fade slide upward | `0.75s`, `power3.out` | `y: 32 -> 0`, `opacity: 0 -> 1` |

### B. Navbar, Progress Bar & Mobile Drawer
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| `#progress` | Scroll (`0` to `max`) | Fixed `2px` pink bar at `top: 0` (`z-index: 56`) | `scrub: 0.3`, `ease: "none"` | `scaleX: 0 -> 1` |
| `.topbar` | Scroll | Sticky `66px`, `color-mix(--shell 92%, transparent)` + `blur(14px)` | Static sticky (no hide/shrink) | `z-index: 50` |
| `.brand-icon` & `.morph` | Interval (`2000ms`) & hover | Cycles 7 polygon shapes + 4 colors; hover tilts icon | Shape `0.6s ease-in-out`; hover `0.25s cubic-bezier(.22,1,.36,1)` | `circle/pink → square/blue → triangle/yellow → hexagon/mint → diamond/pink → pentagon/blue → star/yellow`; hover `rotate(-8deg) scale(1.08)` |
| `#brand-word` | Interval (`2.4s`) | Vertical masked role cycling | Out `0.3s power2.in`, In `0.45s power3.out` | `yPercent: 0 -> -110` then `110 -> 0`, `opacity: 0 <-> 1` |
| `.hl-name` | Initial load | Mint highlighter brush draw | `0.7s`, delay `0.5s`, `cubic-bezier(0.65, 0, 0.35, 1)` | `--hl-off` → `--hl-on` (`rotate: -1.5deg`) |
| `.hl` nav links | Hover & `[aria-current="page"]` | Slanted `clip-path` highlighter wipe (`30%` hover, `42%` active) | `0.4s cubic-bezier(0.65, 0, 0.35, 1)` | `--hl-off` → `--hl-on` |
| `#drawer` & `#scrim` | `#burger` click / `Escape` / scrim | Slide-over `min(88vw, 360px)` panel + backdrop fade + staggered link entrance | Drawer `0.42s cubic-bezier(.22,1,.36,1)`; scrim `0.3s`; links `0.5s power3.out`, stagger `0.05`, delay `0.12s` | `translateX(102% -> 0)`, links `x: 26 -> 0` |

### C. Hero & ID Badge (`#ly-hero`)
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| `#ly-name` | Hero enter (`0.15s`) | `stampIn` per-letter reveal | `0.6s`, `back.out(1.6)`, stagger `0.035` | `yPercent: 40 -> 0`, `opacity: 0 -> 1` |
| `#ly-sub`, `#ly-punch`, `.ly-cta`, `.socials`, `.ly-hint` | Hero enter (`0.50s`) | Staggered upward entrance | `0.7s`, `power3.out`, stagger `0.07` | `y: 18 -> 0`, `opacity: 0 -> 1` |
| `.ly-ul` underline | Hero enter (`1.30s`) | Animated sweeping underline (`@keyframes ly-ul`) | `2.3s cubic-bezier(.65,0,.35,1) forwards` | `background-size: 0% -> 100%` then `background-position: 100%`, `0%` |
| Initial bouncy dot | Hero enter (`1.00s` & `2.00s`) | Pops on period, squashes (`scaleX 1.35, scaleY 0.65`), springs (`back.out(3)`), launches | Pop `0.45s`; squash `0.14s`; spring `0.3s` | Launches `vx = -0.55*s`, `vy = -0.84*s` |
| `#ly-badge` & Verlet rope | Continuous `rAF`, drag, scroll, click | 12-seg Verlet rope (`G=1900, DT=1/120, DAMP=0.986, ITER=14`), ambient breeze, 3D tilt from velocity, scroll kick, pointer throw (clamp `1800px/s`) | Continuous physics | `perspective(900px) rotateY(tilt)` + `rotate(ang)` |
| `#ly-tp` strap text | Continuous `rAF` | Repeating tech stack `<textPath>` along pink strap | `26px/s` continuous | Cycles leading tokens seamlessly |
| `.ly-flip` & `#ly-turn` | Click badge (`<5px` drag) or `Flip ↻` | 3D Y-axis card flip + horizontal rope nudge | `0.8s cubic-bezier(.22,1,.36,1)` | `rotateY(0 -> 180deg)`, impulse `±6` |
| Multi-dot physics + `bops` | Continuous `rAF` & hero click | Up to 5 dots (`3` touch) morph across 7 shapes/4 inks, bounce off letters, words, buttons (tilting buttons `-4→3→0deg` `360ms`), badge, cursor bat (`r=24`), wave surface; background click spawns new dot | `rAF` + `520ms` letter hop + `500ms` `.ly-bit` sparks | Letter hop `translateY(-16%)`; `bops === 1000` triggers 72-piece confetti |

### D. Wave Dividers (`#ly-floor`, `#foot-wave`)
| Element | Trigger | Behavior | Parameters |
|---|---|---|---|
| Wave SVG `<path>` | Pointer hover, scroll velocity, dot bounce | 1D spring-coupled PDE (`24–72` segments, quadratic spline) | `FK=26, FD=3.4, T=(720/S)^2, DT=1/120`; sleeps when calm |

### E. Selected Work (`.showcase`)
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| `.sc-wipe` ribbons | Scroll (`top 70%`, `once`) | Diagonal colored overlays wipe open right-to-left | `0.9s`, `power3.inOut`, stagger `0.12` by distance | `scaleX: 1 -> 0`, `transform-origin: right` |
| `.sc` coverflow slides | Click `←`/`→`, side slide, `ArrowLeft/Right`, swipe (`>50px`) | Circular `scPlace` wrap positioning | `0.9s power3.inOut` | `translateX(d * step) scale(1 - 0.2*a)`, `opacity: 1 - 0.35*a` |
| `.sc-title` & `.sc-line` | Slide change | Masked slide out/in | Out `0.3s power2.in`, In `0.6s power3.out` at `0.25s` | `yPercent: 0 -> -110` then `110 -> 0` |
| `.sc-btn` | Pointer enter/leave | Cursor-originated radial `--pink` fill (`--fx`, `--fy`) | `0.4s cubic-bezier(.22,1,.36,1)` | `scale: 0 -> 1` (`width: 230%`) |

### F. Process (`#process`)
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| Desktop pinned stage | Scroll (`top top`, `+=run*100lvh`, `scrub: 1`) | Statement words illuminate (`0.18->1`), Step 1 `clip-path` expands (`50%->26% 24%->0%`), intro scales `1->0.9` & fades, Steps 2–3 wipe horizontally (`--cw: 100%->0%`) with parallax bg (`scale 1.12->1`, `xPercent 12->0` / `-3->-13`), copy staggers & drifts, outline nums enter, 3 `46×4px` white bars fill | `tl.duration() ≈ 6.9s` | `FILL=1, BEAT=0.3, DWELL=0.5` |
| `.pr-step.is-on` title | Step active | Letter wave hop (`nm-hop`) | `6s ease-in-out infinite`, stagger `45ms` | Subtle vertical letter hop |
| Mobile `≤760px` | Scroll & Prev/Next `.sc-btn` | Unpinned statement scrub (`opacity 0.5->1`), horizontal scroll-snap cards (`86%` width), `#pr-count` update | Scroll-snap smooth | `"01 / 03"` ↔ `"03 / 03"` |

### G. About (`#about`)
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| Deck & tracks entrance | Route/section enter (`0.35s`) | Tracklist stagger, sleeve tilt-in, controls fade, `#disc` slides out (`-34% -> 0`), needle drops | Tracks `0.7s` (`stagger: 0.07`); sleeve `0.8s` (`y:28, rot:-4`); disc `0.9s power3.inOut`; arm `0.8s` | Arm `rotate(-30deg -> 0deg)` |
| Disc spin & track cycle | Continuous (`2.6s`) | `.a5-spin` rotates; tracks cycle `A1..B2` with `.a5-w` brush sweep + `.a5-eq` bars | Spin `2.6s linear infinite`; brush `0.5s cubic-bezier(.65,0,.35,1)`; EQ `0.8s alternate` | Disc `rotate(0->360deg)` |
| `.a5-role` underline | Parent `[data-split].is-in` | Pink underline sweeps left-to-right | `6s cubic-bezier(0.65, 0, 0.35, 1) 0.1s infinite` | `nm-line` |
| `.codeblock` typewriter & glitch | Scroll (`top 92%`, `once`) + hover | Linear char typing (`0.016s/char`), blinking caret fades after `1.2s`, random `1–3s` glyph glitch across 5–8 words; **pauses on hover/selection** | `0.06s` scramble ticks (4–7 holds) | `#B31D58` glitch chars |

### H. Skills (`#skills-tinted`, `#skills`)
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| `.sk` entrance & tab switch | Scroll (`top 85%`, `once`) & tab click/arrow keys | Container WAAPI `SHAKE`, `.sk-panel` `sk-pop`, halftone `sk-flash`, `.sk-title` RGB `sk-misreg`, staggered ghost bar + stepped 20-segment `steps(--s)` bar fill + `.sk-val` pop | Shake `460ms`; pop `0.38s`; flash `0.5s`; misreg `0.6s`; bars `70ms` stagger (`0.45s` ghost, `0.7s` fill, `0.35s` val) | 20 segments (`5%` steps) |
| `#skills-fx` shape trail | Mouse move (`>=26px`, non-interactive) | Pooled geometric shapes pop and fall-fade | Pop `0.35s back.out(2.5)`; fall `0.7s power1.in` at `0.15s` | `scale: 0->1`, `y: +40..80px`, `opacity: 0` |

### I. Experience / Coaster (`#coaster`)
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| Track & pink car | Scroll (`top top`, `scrub: 0.8`, `snap`) | Speed-coupled ride across `LEAD_IN`, `RIDES[0..1]` (**hills + 2 loops**: `230px` & `200px`), `OUTRO`; draws colored `.cz-fill`, pans world + `0.3×` parallax sky, `+30%` zoom `push` at stops | `tl.duration() ≈ 11.4s`, `scrub: 0.8`, snap `0.2–0.6s` | `z = k * (1 + push * 0.3)` |
| Marquee gates, signs, balloons, Ferris wheels | Continuous & stop arrival | 3-phase chasing bulbs (`0.6s`), bobbing balloons (`3s`), Ferris wheel spin (`40s`), road sign scale bounce (`1->1.18->1`, `0.15s` yoyo) | Continuous CSS + arrival tween | `cz-chase`, `cz-bob`, `cz-spin` |
| Stop Iris, ticket & polaroids | Stop arrival in scroll | Circular `clip-path` iris opens around cart (`0.4s power2.in`), `.cz-ticket` pops (`0.3s back.out(1.7)`), 3 tilted polaroids drop (`0.3s back.out(1.5)`, stagger `0.07`) | Iris `0.4s`, ticket `0.3s`, polaroids `0.3s` | Polaroid `y: -90->0`, `rot: ±12deg->0` |
| `.cz-fx` fireworks | Riding & click on stage | Pooled sprite/particle fireworks burst in sky & on click | `rAF` sprite frames | Sky bursts + click bursts |

### J. Projects Grid, Contact, CTA, Footer & To-Top
| Element | Trigger | Behavior | Duration / Delay / Easing / Stagger | Values |
|---|---|---|---|---|
| `#all-cards .card` | Scroll (`ScrollTrigger.batch`) & filter click | Enter `y: 100->0` / `-100->0`, `opacity: 0->1`; filter animates matching cards | `0.65s power3.out`, stagger `0.06` | `start: "top 95%"` |
| `.c3-title` `.nm` underline | Hero stamp `.is-idle` | Animated pink underline wipe | `6s cubic-bezier(.65,0,.35,1) 0.1s infinite` | `nm-line` |
| 7 `.c3-s` peel stickers | Pointer drag & drop | Draggable white-backed stickers; lifts `scale(1.1)`, raises `zIndex`, drops with spring random tilt `[-15deg, 15deg]` | `500ms cubic-bezier(.34,1.56,.64,1)` | 7 shapes above/right of header |
| `#contact-fx` & `.band-fx` | Mouse move (`>=26px`) | Same `initShapeFx` cursor shape burst trail | `0.35s` pop + `0.7s` fall-fade | 10-node pool |
| `.line` Direct Lines & `#c3-copy` | Hover & click | Cards straighten (`rotate(0) translateY(-3px)`, `0.3s`); `Copy` pops (`1 -> 1.2 rot -8deg -> 1`, `450ms`) & shows `"Copied ✓"` `2s` | `0.3s` / `450ms` | 5 tilted pastel cards |
| FAQ `<details>` | Click toggle | `+` badge rotates `45deg` (`0.3s`), card jiggles (`0 -> -1.4deg -> 0.9deg -> 0`, `450ms ease-out`) | `0.3s` / `450ms` | 3 accented items |
| `#to-top` | Scroll past `0px` sentinel | Slides up from bottom-left (`22px, 22px`) | `0.35s cubic-bezier(.22,1,.36,1)` | `translateY(140% -> 0)` |

