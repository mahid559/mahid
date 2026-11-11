"use client";

import { useRef, useState } from "react";
import {
  ACCENT_HEX,
  CONTACT_CONTENT,
  PHONE_LINE,
  SITE_META,
  SOCIAL_LINKS,
  UI_LABELS,
} from "@/data/content";
import { prefersReducedMotion } from "@/lib/gsap";
import { ShapeTrail } from "./ShapeTrail";

const FAQ_JIGGLE: Keyframe[] = [
  { transform: "rotate(0deg)" },
  { transform: "rotate(-1.4deg)" },
  { transform: "rotate(0.9deg)" },
  { transform: "rotate(0deg)" },
];

const COPY_SPRING: Keyframe[] = [
  { transform: "scale(1) rotate(0deg)" },
  { transform: "scale(1.2) rotate(-8deg)" },
  { transform: "scale(1) rotate(0deg)" },
];

interface StickerSpec {
  id: string;
  size: number;
  color: string;
  clip: string;
  left: string;
  top: string;
  mobileLeft: string;
  mobileTop: string;
  rot: number;
}

const STICKERS: StickerSpec[] = [
  {
    id: "st-circle",
    size: 86,
    color: ACCENT_HEX.pink,
    clip: "circle(50% at 50% 50%)",
    left: "8%",
    top: "6%",
    mobileLeft: "4%",
    mobileTop: "10%",
    rot: -8,
  },
  {
    id: "st-square",
    size: 68,
    color: ACCENT_HEX.blue,
    clip: "inset(0 round 12px)",
    left: "40%",
    top: "0%",
    mobileLeft: "26%",
    mobileTop: "4%",
    rot: 3,
  },
  {
    id: "st-tri",
    size: 76,
    color: ACCENT_HEX.yellow,
    clip: "polygon(50% 6%, 94% 88%, 6% 88%)",
    left: "70%",
    top: "8%",
    mobileLeft: "50%",
    mobileTop: "12%",
    rot: 4,
  },
  {
    id: "st-hex",
    size: 80,
    color: ACCENT_HEX.mint,
    clip: "polygon(50% 4%, 93% 27%, 93% 73%, 50% 96%, 7% 73%, 7% 27%)",
    left: "22%",
    top: "46%",
    mobileLeft: "72%",
    mobileTop: "6%",
    rot: 16,
  },
  {
    id: "st-dia",
    size: 56,
    color: ACCENT_HEX.pink,
    clip: "polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)",
    left: "54%",
    top: "38%",
    mobileLeft: "16%",
    mobileTop: "52%",
    rot: 6,
  },
  {
    id: "st-pent",
    size: 62,
    color: ACCENT_HEX.blue,
    clip: "polygon(50% 4%, 95% 38%, 78% 92%, 22% 92%, 5% 38%)",
    left: "76%",
    top: "48%",
    mobileLeft: "44%",
    mobileTop: "50%",
    rot: -10,
  },
  {
    id: "st-star",
    size: 58,
    color: ACCENT_HEX.yellow,
    clip: "polygon(50% 2%, 63% 35%, 98% 37%, 71% 59%, 80% 94%, 50% 74%, 20% 94%, 29% 59%, 2% 37%, 37% 35%)",
    left: "44%",
    top: "68%",
    mobileLeft: "68%",
    mobileTop: "48%",
    rot: 8,
  },
];

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const zTopRef = useRef(10);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sentName, setSentName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [stickerOffsets, setStickerOffsets] = useState<
    Record<string, { x: number; y: number; rot: number; dragging: boolean; z: number }>
  >(() =>
    Object.fromEntries(
      STICKERS.map((s, idx) => [
        s.id,
        { x: 0, y: 0, rot: s.rot, dragging: false, z: idx + 1 },
      ])
    )
  );

  const handleStickerDown = (id: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture?.(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const base = stickerOffsets[id] ?? { x: 0, y: 0, rot: 0, dragging: false, z: 1 };
    const nextZ = ++zTopRef.current;

    setStickerOffsets((prev) => ({
      ...prev,
      [id]: { ...base, dragging: true, z: nextZ },
    }));

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setStickerOffsets((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          x: base.x + dx,
          y: base.y + dy,
          dragging: true,
        },
      }));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const nextRot = -15 + Math.random() * 30;
      setStickerOffsets((prev) => ({
        ...prev,
        [id]: { ...prev[id], dragging: false, rot: nextRot },
      }));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nextErrors: Record<string, boolean> = {};
    if (!name.trim()) nextErrors.name = true;
    if (!email.trim() || !email.includes("@")) nextErrors.email = true;
    if (!message.trim()) nextErrors.message = true;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      const input = document.getElementById(`contact-${firstKey}`);
      input?.focus();
      return;
    }

    const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID?.trim();
    if (!formspreeId) {
      const mailSubject = encodeURIComponent(
        subject.trim() || `Project inquiry from ${name.trim()}`
      );
      const mailBody = encodeURIComponent(
        `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`
      );
      window.location.href = `mailto:${SITE_META.email}?subject=${mailSubject}&body=${mailBody}`;
      setSentName(name.trim());
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        setSubmitError(CONTACT_CONTENT.form.errorMessage);
      } else {
        setSentName(name.trim());
      }
    } catch {
      setSubmitError(CONTACT_CONTENT.form.errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(SITE_META.email);
    } catch {
      // Fallback ignored if clipboard permission unavailable
    }
    setCopied(true);
    if (!prefersReducedMotion() && copyBtnRef.current?.animate) {
      copyBtnRef.current.animate(COPY_SPRING, {
        duration: 450,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      });
    }
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleFaqToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (prefersReducedMotion()) return;
    e.currentTarget.animate?.(FAQ_JIGGLE, {
      duration: 450,
      easing: "ease-out",
    });
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative sec-block bg-[var(--paper)] overflow-hidden"
    >
      <ShapeTrail containerRef={sectionRef} />

      <div className="shell relative z-10">
        {/* Top Hero + Tilted Pill Below + 7 Draggable Peel Stickers */}
        <div className="relative flex flex-col-reverse lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="label">
              <span className="label-idx">{CONTACT_CONTENT.kickerIndex}</span>
              <span>{CONTACT_CONTENT.kickerLabel}</span>
            </div>
            <h2 className="mt-3 max-w-[14ch] font-display text-[clamp(2.6rem,1.5rem+4.8vw,5.64rem)] font-extrabold leading-[1.12] tracking-[-0.03em]">
              <span className="c3-title-ul pb-1">{CONTACT_CONTENT.heading}</span>
            </h2>

            <div className="mt-5">
              <div
                className="inline-flex items-center gap-2 rounded-full border-[3px] border-white bg-[var(--card)] px-4 py-2 mono text-[0.74rem] font-semibold text-[var(--ink)]"
                style={{
                  transform: "rotate(-3deg)",
                  boxShadow: "0 8px 16px -10px rgba(19, 17, 26, 0.45)",
                }}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--mint)] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--mint)]" />
                </span>
                <span>{CONTACT_CONTENT.statusPill}</span>
              </div>
            </div>
          </div>

          {/* 7 Draggable Geometric Peel Stickers (Desktop right + Mobile above heading) */}
          <div className="c3-peel relative h-[126px] lg:h-[210px] w-full lg:w-[320px] shrink-0">
            {STICKERS.map((s) => {
              const st = stickerOffsets[s.id];
              return (
                <div
                  key={s.id}
                  onPointerDown={(e) => handleStickerDown(s.id, e)}
                  className={`c3-s ${st?.dragging ? "is-dragging" : ""} left-[var(--ml)] top-[var(--mt)] lg:left-[var(--dl)] lg:top-[var(--dt)]`}
                  style={{
                    width: s.size,
                    height: s.size,
                    zIndex: st?.z ?? 1,
                    ["--ml" as string]: s.mobileLeft,
                    ["--mt" as string]: s.mobileTop,
                    ["--dl" as string]: s.left,
                    ["--dt" as string]: s.top,
                    transform: `translate3d(${st?.x ?? 0}px, ${st?.y ?? 0}px, 0) scale(${
                      st?.dragging ? 1.1 : 1
                    }) rotate(${st?.rot ?? s.rot}deg)`,
                  }}
                  aria-hidden="true"
                >
                  <span
                    className="c3-s-back"
                    style={{ clipPath: s.clip }}
                  />
                  <span
                    className="c3-s-face"
                    style={{ backgroundColor: s.color, clipPath: s.clip }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Grid: Form Card + Direct Lines & FAQ */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-8 items-start">
          {/* Left Form Card */}
          <div
            id="form-card"
            className="rounded-[22px] border border-[var(--hair)] bg-[var(--card)] p-6 sm:p-10"
          >
            {sentName ? (
              <div className="relative py-8 text-center">
                <div className="c3-sent-pop mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full border-[5px] border-white bg-[var(--mint)] mono text-xs font-bold text-white shadow-lg">
                  {CONTACT_CONTENT.form.sentStamp}
                </div>
                <h3 className="font-display text-3xl font-extrabold text-[var(--ink)]">
                  {CONTACT_CONTENT.form.sentTitlePrefix} {sentName}
                </h3>
                <p className="mx-auto mt-3 max-w-[38ch] text-[var(--ink-soft)]">
                  {CONTACT_CONTENT.form.sentMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSentName(null);
                    setName("");
                    setEmail("");
                    setSubject("");
                    setMessage("");
                  }}
                  className="pill-btn pill-secondary mt-7"
                >
                  {CONTACT_CONTENT.form.resetLabel}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-1.5 block mono text-xs font-semibold uppercase tracking-wider text-[var(--ink-faint)]"
                    >
                      {CONTACT_CONTENT.form.nameLabel}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((p) => ({ ...p, name: false }));
                      }}
                      placeholder={CONTACT_CONTENT.form.namePlaceholder}
                      className={`min-h-[48px] w-full rounded-[14px] border bg-[var(--paper)] px-3.5 py-3 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--ink)] focus:shadow-[0_0_0_3px_var(--ring)] ${
                        errors.name ? "border-[var(--pink)]" : "border-[var(--hair)]"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-1.5 block mono text-xs font-semibold uppercase tracking-wider text-[var(--ink-faint)]"
                    >
                      {CONTACT_CONTENT.form.emailLabel}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((p) => ({ ...p, email: false }));
                      }}
                      placeholder={CONTACT_CONTENT.form.emailPlaceholder}
                      className={`min-h-[48px] w-full rounded-[14px] border bg-[var(--paper)] px-3.5 py-3 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--ink)] focus:shadow-[0_0_0_3px_var(--ring)] ${
                        errors.email ? "border-[var(--pink)]" : "border-[var(--hair)]"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-1.5 block mono text-xs font-semibold uppercase tracking-wider text-[var(--ink-faint)]"
                  >
                    {CONTACT_CONTENT.form.subjectLabel}
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={CONTACT_CONTENT.form.subjectPlaceholder}
                    className="min-h-[48px] w-full rounded-[14px] border border-[var(--hair)] bg-[var(--paper)] px-3.5 py-3 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--ink)] focus:shadow-[0_0_0_3px_var(--ring)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block mono text-xs font-semibold uppercase tracking-wider text-[var(--ink-faint)]"
                  >
                    {CONTACT_CONTENT.form.messageLabel}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message) setErrors((p) => ({ ...p, message: false }));
                    }}
                    placeholder={CONTACT_CONTENT.form.messagePlaceholder}
                    className={`min-h-[150px] w-full rounded-[14px] border bg-[var(--paper)] px-3.5 py-3 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--ink)] focus:shadow-[0_0_0_3px_var(--ring)] ${
                      errors.message ? "border-[var(--pink)]" : "border-[var(--hair)]"
                    }`}
                  />
                </div>

                {submitError && (
                  <p
                    role="alert"
                    className="rounded-xl border border-[var(--pink)] bg-[color-mix(in_srgb,var(--pink)_10%,var(--card))] px-3.5 py-2.5 text-sm font-medium text-[var(--pink-ink)]"
                  >
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="pill-btn pill-dark min-h-[48px] px-7 disabled:opacity-60"
                >
                  {sending
                    ? CONTACT_CONTENT.form.sendingLabel
                    : CONTACT_CONTENT.form.submitLabel}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Direct Lines + FAQ */}
          <div className="space-y-8">
            <div>
              <div className="mb-3 mono text-xs font-semibold tracking-[0.16em] text-[var(--ink-faint)]">
                {CONTACT_CONTENT.directLinesHeading}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email Card (Wide) */}
                <div
                  className="c3-line sm:col-span-2 flex items-center justify-between gap-3"
                  style={{
                    ["--c" as string]: ACCENT_HEX.pink,
                    ["--tilt" as string]: "-1.2deg",
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mono text-[0.68rem] font-semibold uppercase text-[var(--ink-faint)]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--pink)]" />
                      <span>{UI_LABELS.directEmailLabel}</span>
                    </div>
                    <div className="mt-1 truncate font-display text-base sm:text-lg font-bold text-[var(--ink)]">
                      {SITE_META.email}
                    </div>
                  </div>
                  <button
                    ref={copyBtnRef}
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded-full border border-[var(--hair)] bg-[var(--card)] px-3 py-1.5 mono text-xs font-semibold text-[var(--ink)] hover:border-[var(--ink)] cursor-pointer"
                  >
                    {copied ? UI_LABELS.copiedLabel : UI_LABELS.copyLabel}
                  </button>
                </div>

                {/* Phone Card (Wide, Direct Lines only) */}
                <a
                  href={PHONE_LINE.href}
                  className="c3-line sm:col-span-2 flex items-center justify-between gap-3"
                  style={{
                    ["--c" as string]: ACCENT_HEX.blue,
                    ["--tilt" as string]: "0.7deg",
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mono text-[0.68rem] font-semibold uppercase text-[var(--ink-faint)]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--blue)]" />
                      <span>{UI_LABELS.directPhoneLabel}</span>
                    </div>
                    <div className="mt-1 font-display text-base sm:text-lg font-bold text-[var(--ink)]">
                      {PHONE_LINE.display}
                    </div>
                  </div>
                  <span className="mono text-sm text-[var(--ink-faint)]" aria-hidden="true">
                    ↗
                  </span>
                </a>

                {/* Location Card */}
                <div
                  className="c3-line"
                  style={{
                    ["--c" as string]: ACCENT_HEX.mint,
                    ["--tilt" as string]: "1deg",
                  }}
                >
                  <div className="flex items-center gap-2 mono text-[0.68rem] font-semibold uppercase text-[var(--ink-faint)]">
                    <span
                      className="h-2.5 w-2.5 bg-[var(--mint)]"
                      style={{
                        clipPath:
                          "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                      }}
                    />
                    <span>{UI_LABELS.directLocationLabel}</span>
                  </div>
                  <div className="mt-1 font-display text-sm sm:text-base font-bold text-[var(--ink)]">
                    {SITE_META.location}
                  </div>
                </div>

                {/* Time Zone Card */}
                <div
                  className="c3-line"
                  style={{
                    ["--c" as string]: ACCENT_HEX.yellow,
                    ["--tilt" as string]: "-0.6deg",
                  }}
                >
                  <div className="flex items-center gap-2 mono text-[0.68rem] font-semibold uppercase text-[var(--ink-faint)]">
                    <span
                      className="h-2.5 w-2.5 bg-[var(--yellow)]"
                      style={{
                        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                      }}
                    />
                    <span>{UI_LABELS.directTimezoneLabel}</span>
                  </div>
                  <div className="mt-1 font-display text-sm sm:text-base font-bold text-[var(--ink)]">
                    {SITE_META.timezone}
                  </div>
                </div>

                {/* Social Link Cards (GitHub, LinkedIn, Facebook, Instagram, Fiverr) */}
                {SOCIAL_LINKS.map((s, idx) => {
                  const accents = [
                    ACCENT_HEX.blue,
                    ACCENT_HEX.yellow,
                    ACCENT_HEX.pink,
                    ACCENT_HEX.mint,
                    ACCENT_HEX.pink,
                  ];
                  const tilts = ["-0.8deg", "1.1deg", "-0.7deg", "0.9deg", "-0.6deg"];
                  const c = accents[idx % accents.length];
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c3-line sm:col-span-2 flex items-center justify-between gap-2"
                      style={{
                        ["--c" as string]: c,
                        ["--tilt" as string]: tilts[idx % tilts.length],
                      }}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0"
                          style={{ backgroundColor: c }}
                        />
                        <span className="font-display text-base font-bold text-[var(--ink)]">
                          {s.label}
                        </span>
                      </span>
                      <span className="mono text-sm text-[var(--ink-faint)]" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* FAQ Accordions */}
            <div>
              <div className="mb-3 mono text-xs font-semibold tracking-[0.16em] text-[var(--ink-faint)]">
                {CONTACT_CONTENT.faqHeading}
              </div>

              <div className="space-y-3">
                {CONTACT_CONTENT.faqs.map((faq) => {
                  const c = ACCENT_HEX[faq.accent];
                  return (
                    <details
                      key={faq.question}
                      onToggle={handleFaqToggle}
                      className="faq-item"
                      style={{ ["--c" as string]: c }}
                    >
                      <summary className="faq-summary text-sm sm:text-base text-[var(--ink)]">
                        <span>{faq.question}</span>
                        <span className="faq-plus" aria-hidden="true">
                          +
                        </span>
                      </summary>
                      <p className="pb-4 text-sm text-[var(--ink-soft)] leading-relaxed">
                        {faq.answer}
                      </p>
                    </details>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
