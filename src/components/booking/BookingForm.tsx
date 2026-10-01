"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Clock3, MapPin, ChevronLeft, ChevronRight, ArrowLeft, LockKeyhole, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { bookingRequestSchema, bookingScheduleErrors, todayInTourTimezone } from "@/lib/booking/schema";
import { issuesToErrorKeys } from "@/lib/booking/issues";
import { getTour, defaultTour, tourPrice, formatEuro, startTimes, endTime } from "@/config/tours";
import styles from "./BookingForm.module.css";

type Draft = { tourId: string; language: string; date: string; time: string; people: number; name: string; email: string; phone: string; message: string };
const options = [
  { id: "shared-en", tourId: "valencia-group-tour", language: "en", label: "english" },
  { id: "shared-nl", tourId: "valencia-group-tour", language: "nl", label: "dutch" },
  { id: "private-city", tourId: "private-city", language: "en", label: "city" },
  { id: "private-architecture", tourId: "private-architecture", language: "en", label: "architecture" },
];
const draftKey = "biketourvlc-reservation-draft-v2";
function clearSavedDraft() {
  try { sessionStorage.removeItem(draftKey); } catch { /* Storage can be disabled in the browser. */ }
}
function dateInMonth(month: string, day: number) { return `${month}-${String(day).padStart(2, "0")}`; }
function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

export function BookingForm({ initialTourId, paymentReady = false }: { initialTourId: string; paymentReady?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("calendarBooking");
  const old = useTranslations("booking");
  const offers = useTranslations("offers");
  const nav = useTranslations("nav");
  const [draft, setDraft] = useState<Draft>({ tourId: initialTourId, language: "en", date: "", time: "", people: 1, name: "", email: "", phone: "", message: "" });
  const [today] = useState(() => todayInTourTimezone());
  const [month, setMonth] = useState(today.slice(0, 7));
  const [step, setStep] = useState<"calendar" | "details">("calendar");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [website, setWebsite] = useState("");
  const [paymentState, setPaymentState] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [renderedAt] = useState(Date.now);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const tour = getTour(draft.tourId) ?? defaultTour;
  const price = tourPrice(tour, draft.people, draft.language);
  const slots = startTimes(tour, draft.language);
  const dateLabel = (date: string, format: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) => new Intl.DateTimeFormat(locale, { ...format, timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  const available = (date: string, time: string) => !Object.keys(bookingScheduleErrors({ tourId: tour.id, date, departureTime: time })).length;
  const validDate = (date: string) => date >= today && slots.some((time) => available(date, time));
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const weekdayNames = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 5 + i))));
  const update = (patch: Partial<Draft>) => { setDraft((d) => ({ ...d, ...patch })); setErrors({}); setError(""); };
  const focus = () => requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: "instant" }); });

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const session = query.get("session_id");
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    const check = async () => {
      try {
        const response = await fetch(`/api/bookings/payment-status?session_id=${encodeURIComponent(session || "")}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (["paid_pending_confirmation", "confirmed", "refunded", "expired"].includes(result.status)) {
          setPaymentState(result.status); if (result.status !== "expired") clearSavedDraft(); return;
        }
      } catch { if (controller.signal.aborted) return; }
      if (++count < 15) timer = setTimeout(check, 2000); else setPaymentState("pendingLong");
    };
    const frame = requestAnimationFrame(() => {
    if (query.get("payment") === "cancelled") {
      setCancelled(true);
      try {
        const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null");
        if (saved?.draft && getTour(saved.draft.tourId)) { setDraft(saved.draft); setMonth(saved.draft.date?.slice(0, 7) || today.slice(0, 7)); setStep("details"); request.current = saved.request; }
      } catch { clearSavedDraft(); }
    }
      if (query.get("payment") === "success" && session) { setPaymentState("pending"); void check(); }
    });
    return () => { cancelAnimationFrame(frame); controller.abort(); clearTimeout(timer); };
  }, [today]);

  function selectTour(option: typeof options[number]) {
    update({ tourId: option.tourId, language: option.language, time: "", date: "", people: Math.min(draft.people, option.tourId === "valencia-group-tour" ? 20 : 10) });
    setStep("calendar");
  }
  async function pay(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const data = { tourId: tour.id, locale, date: draft.date, departureTime: draft.time, groupSize: draft.people, name: draft.name, email: draft.email, phone: draft.phone, guideLanguage: draft.language, message: draft.message, termsAccepted: agreed, website, renderedAt };
    const fingerprint = JSON.stringify({ ...data, renderedAt: undefined, website: undefined });
    if (!request.current || request.current.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() };
    const payload = { ...data, idempotencyKey: request.current.key };
    const parsed = bookingRequestSchema.safeParse(payload);
    const validation = parsed.success ? bookingScheduleErrors(parsed.data) : issuesToErrorKeys(parsed.error.issues);
    if (Object.keys(validation).length) { setErrors(validation); requestAnimationFrame(() => errorRef.current?.focus()); return; }
    if (!paymentReady) { setError(t("unavailable")); return; }
    setBusy(true);
    try {
      try { sessionStorage.setItem(draftKey, JSON.stringify({ draft, request: request.current })); }
      catch { /* Checkout still works when the browser disallows draft storage. */ }
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.url) {
        if (result.errors) setErrors(result.errors);
        if (["checkout_expired", "idempotency_conflict"].includes(result.code)) request.current = null;
        setError(t(result.code === "payment_unavailable" ? "unavailable" : result.code === "already_paid" ? "alreadyPaid" : result.code === "checkout_expired" ? "expiredRetry" : response.status === 429 ? "rateLimit" : "paymentError"));
        requestAnimationFrame(() => errorRef.current?.focus()); return;
      }
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Invalid checkout URL");
      window.location.assign(url.href);
    } catch { setError(t("paymentError")); }
    finally { setBusy(false); }
  }
  const errorText = (key: string) => old.has(`errors.${key}`) ? old(`errors.${key}`) : t("paymentError");

  if (paymentState) return <section className={styles.result} aria-live="polite">
    <Check size={36} aria-hidden />
    <h2>{t(["paid_pending_confirmation", "confirmed"].includes(paymentState) ? "paidTitle" : paymentState === "refunded" ? "refundedTitle" : paymentState === "expired" ? "expiredTitle" : "checkingTitle")}</h2>
    <p>{t(["paid_pending_confirmation", "confirmed"].includes(paymentState) ? "paidBody" : paymentState === "refunded" ? "refundedBody" : paymentState === "expired" ? "expiredBody" : paymentState === "pendingLong" ? "pendingLong" : "checkingBody")}</p>
    <Link href="/contact">{t("contact")}</Link>
    <Link href="/book" onClick={() => { setPaymentState(""); window.history.replaceState(null, "", window.location.pathname); }}>{t("newBooking")}</Link>
  </section>;

  return <div className={styles.scheduler} data-testid="booking-calendar">
    <aside className={styles.summary}>
      <p className={styles.eyebrow}>BikeTourVLC</p>
      <h2>{offers(`${tour.key}.name`)}</h2>
      <p className={styles.fact}><Clock3 size={18} aria-hidden />{t("duration")}</p>
      <p className={styles.fact}><MapPin size={18} aria-hidden /><span>Casa Fenicia<br />Calle Corretgeria 4, Valencia</span></p>
      <fieldset className={styles.tours} disabled={busy}><legend>{t("tour")}</legend>
        {options.map((option) => { const chosen = tour.id === option.tourId && (tour.private || draft.language === option.language); return <button key={option.id} type="button" data-tour={option.id} aria-pressed={chosen} onClick={() => selectTour(option)} className={chosen ? styles.selectedTour : ""}>
          <span>{t(option.label)}</span><small>{t(option.tourId === "valencia-group-tour" ? option.language === "nl" ? "dutchPrice" : "englishPrice" : "privatePrice")}</small>
          {chosen && <Check size={16} aria-hidden />}
        </button>; })}
      </fieldset>
      <label className={styles.label} htmlFor="groupSize">{t("people")}</label>
      <select id="groupSize" value={draft.people} disabled={busy} onChange={(e) => update({ people: Number(e.target.value) })} className={styles.input}>
        {Array.from({ length: tour.private ? 10 : 20 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
      </select>
      {tour.private && <><label className={styles.label} htmlFor="guideLanguage">{old("form.guideLanguage")}</label><select id="guideLanguage" className={styles.input} value={draft.language} disabled={busy} onChange={(e) => update({ language: e.target.value })}>{tour.guideLanguages.map((lang) => <option key={lang} value={lang}>{nav(`languages.${lang}`)}</option>)}</select><Link className={styles.more} href="/contact">{t("largerGroup")}</Link></>}
      <div className={styles.total}><span>{t("dueNow")}</span><strong data-testid="reservation-total">{price ? formatEuro(price.totalCents, locale) : "—"}</strong><small>{tour.private ? t("privatePrice") : t("priceCalculation", { people: draft.people, price: formatEuro(price?.perPersonCents ?? 0, locale) })}</small></div>
      <p className={styles.note}>{t(tour.private ? "privateNotice" : "sharedNotice")}</p>
    </aside>
    <div className={styles.main}>
      <div className={styles.steps}><span className={step === "calendar" ? styles.currentStep : ""}>1 · {t("dateTime")}</span><span className={step === "details" ? styles.currentStep : ""}>2 · {t("details")}</span><span>3 · {t("payment")}</span></div>
      {cancelled && <p role="status" className={styles.notice}>{t("cancelled")}</p>}
      <h2 ref={heading} tabIndex={-1} className={styles.heading}>{t(step === "calendar" ? "chooseDate" : "enterDetails")}</h2>
      {step === "calendar" ? <>
        <p className={styles.note}>{t("timezone")}</p>
        <div className={styles.dateTime}>
          <div>
            <div className={styles.monthNav}><h3 aria-live="polite">{dateLabel(month + "-01", { month: "long", year: "numeric" })}</h3><div><button type="button" aria-label={t("previousMonth")} disabled={month <= today.slice(0, 7)} onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={20} aria-hidden /></button><button type="button" aria-label={t("nextMonth")} disabled={month >= shiftMonth(today.slice(0, 7), 11)} onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={20} aria-hidden /></button></div></div>
            <div className={styles.calendar} role="group" aria-label={t("chooseDate")}>
              {weekdayNames.map((name, i) => <span className={styles.weekday} key={i} aria-hidden>{name}</span>)}
              {Array.from({ length: offset }, (_, i) => <span key={`empty-${i}`} />)}
              {Array.from({ length: days }, (_, i) => { const day = dateInMonth(month, i + 1); return <button type="button" key={day} data-date={day} aria-label={dateLabel(day, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} aria-pressed={draft.date === day} aria-current={day === today ? "date" : undefined} disabled={!validDate(day)} className={draft.date === day ? styles.selectedDate : ""} onClick={() => update({ date: day, time: "" })}>{new Intl.NumberFormat(locale).format(i + 1)}</button>; })}
            </div>
          </div>
          <div className={styles.times} aria-live="polite"><h3>{draft.date ? dateLabel(draft.date, { weekday: "short", day: "numeric", month: "short" }) : t("selectDateHint")}</h3>
            {draft.date ? <><p className={styles.note}>{t(tour.private ? "privateTimes" : "fixedTime")}</p><div className={styles.slotList}>{slots.map((time) => <button type="button" key={time} data-time={time} disabled={!available(draft.date, time)} aria-pressed={draft.time === time} className={draft.time === time ? styles.selectedTime : ""} onClick={() => update({ time })}>{time}<span>{t("ends", { time: endTime(time) })}</span></button>)}</div></> : <CalendarDays className={styles.calendarIcon} size={44} aria-hidden />}
          </div>
        </div>
        <div className={styles.continue}><button type="button" className={styles.primary} disabled={!draft.date || !draft.time || !available(draft.date, draft.time)} onClick={() => { setStep("details"); focus(); }}>{t("continue")}</button></div>
      </> : <form onSubmit={pay} noValidate>
        <button type="button" className={styles.back} disabled={busy} onClick={() => { setStep("calendar"); focus(); }}><ArrowLeft size={16} aria-hidden />{t("changeDate")}</button>
        <div className={styles.chosen}><CalendarDays size={20} aria-hidden /><div><strong>{draft.date && dateLabel(draft.date)}</strong><span>{draft.time}–{draft.time && endTime(draft.time)} · {nav(`languages.${draft.language}`)} · {t("timezone")}</span></div></div>
        {(error || Object.keys(errors).length > 0) && <div role="alert" tabIndex={-1} ref={errorRef} className={styles.error}>{error && <p>{error}</p>}{Object.entries(errors).map(([field, key]) => <p key={field}>{errorText(key)}</p>)}</div>}
        <div className={styles.fields}>{(["name", "email", "phone"] as const).map((field) => <div key={field}><label className={styles.label} htmlFor={field}>{old(`form.${field}`)}</label><input className={styles.input} id={field} name={field} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} autoComplete={field === "phone" ? "tel" : field} required={field !== "phone"} disabled={busy} value={draft[field]} maxLength={field === "name" ? 120 : field === "email" ? 254 : 32} aria-invalid={Boolean(errors[field])} onChange={(e) => update({ [field]: e.target.value })} /></div>)}</div>
        <label className={styles.label} htmlFor="message">{old("form.message")}</label><textarea className={styles.input} id="message" rows={3} value={draft.message} maxLength={2000} disabled={busy} onChange={(e) => update({ message: e.target.value })} />
        <div hidden aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
        <label className={styles.consent}><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={busy} /><span>{t("consent")} <Link href="/booking-terms" target="_blank">{t("terms")}</Link> {t("and")} <Link href="/privacy" target="_blank">{t("privacy")}</Link>.</span></label>
        <p className={styles.note}>{t("paymentNotice")}</p>
        {!paymentReady && <p className={styles.notice} role="status">{t("unavailable")}</p>}
        <button type="submit" className={styles.primary} disabled={busy} data-testid="pay-reservation"><LockKeyhole size={18} aria-hidden />{busy ? t("redirecting") : t("pay", { amount: formatEuro(price?.totalCents ?? 0, locale) })}</button>
        <p className={styles.secure}>{t("secure")}</p>
      </form>}
    </div>
  </div>;
}
