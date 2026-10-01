"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  bookingRequestSchema,
  todayInTourTimezone,
} from "@/lib/booking/schema";
import { issuesToErrorKeys } from "@/lib/booking/issues";
import { buttonStyles } from "@/components/ui";

interface BookingFormProps {
  tourId: string;
  tourName: string;
  departureTimes: string[];
  guideLanguages: readonly string[];
  groupSizeMin: number;
  groupSizeMax: number;
}

type Step = "form" | "review" | "success";
type FormErrorKind = "generic" | "rateLimit" | "duplicate";

const inputClass =
  "min-h-12 w-full rounded-[var(--radius-field)] border border-[#90969E] bg-white px-4 py-2.5 text-base text-[var(--color-brand-ink)] focus:border-[var(--color-link)]";
const labelClass =
  "mb-1.5 block text-[15px] font-semibold text-[var(--color-brand-ink)]";
const helpClass = "mt-1.5 text-sm text-[var(--color-text-muted)]";
const errorClass = "mt-1.5 text-sm font-medium text-[var(--color-error-700)]";

export function BookingForm({
  tourId,
  tourName,
  departureTimes,
  guideLanguages,
  groupSizeMin,
  groupSizeMax,
}: BookingFormProps) {
  const t = useTranslations("booking");
  const tNav = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();

  const [step, setStep] = useState<Step>("form");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [renderedAt] = useState(() => Date.now());
  const [minDate] = useState(() => todayInTourTimezone());

  const [date, setDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guideLanguage, setGuideLanguage] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<FormErrorKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const errorText = (key: string) =>
    t.has(`errors.${key}`) ? t(`errors.${key}`) : t("form.errorGeneric");

  const buildPayload = () => ({
    tourId,
    locale,
    date,
    departureTime,
    groupSize: groupSize === "" ? Number.NaN : Number(groupSize),
    name,
    email,
    phone,
    guideLanguage: guideLanguage || undefined,
    message,
    idempotencyKey,
    website,
    renderedAt,
  });

  const focusSummary = () => {
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const goToReview = () => {
    setFormError(null);
    const parsed = bookingRequestSchema.safeParse(buildPayload());
    if (!parsed.success) {
      setErrors(issuesToErrorKeys(parsed.error.issues));
      focusSummary();
      return;
    }
    setErrors({});
    setStep("review");
  };

  const submit = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (res.ok) {
        setStep("success");
        return;
      }
      if (res.status === 400) {
        const data: unknown = await res.json().catch(() => null);
        const serverErrors =
          data &&
          typeof data === "object" &&
          "errors" in data &&
          data.errors &&
          typeof data.errors === "object"
            ? (data.errors as Record<string, string>)
            : {};
        setErrors(serverErrors);
        setStep("form");
        focusSummary();
        return;
      }
      if (res.status === 409) setFormError("duplicate");
      else if (res.status === 429) setFormError("rateLimit");
      else setFormError("generic");
      setStep("form");
      focusSummary();
    } catch {
      setFormError("generic");
      setStep("form");
      focusSummary();
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (field: string) =>
    errors[field] ? (
      <p id={`${field}-error`} className={errorClass}>
        {errorText(errors[field])}
      </p>
    ) : null;

  const describedBy = (field: string, hasHelp: boolean) =>
    [
      hasHelp ? `${field}-help` : null,
      errors[field] ? `${field}-error` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const errorSummary =
    formError || Object.keys(errors).length > 0 ? (
      <div
        ref={summaryRef}
        role="alert"
        tabIndex={-1}
        className="mb-8 rounded-[var(--radius-field)] border-l-4 border-[var(--color-error-700)] bg-[#FEF4F2] p-5"
      >
        <p className="font-semibold text-[var(--color-brand-ink)]">
          {formError
            ? t(`form.error${formError === "rateLimit" ? "RateLimit" : formError === "duplicate" ? "Duplicate" : "Generic"}`)
            : tA11y("formErrorSummary")}
        </p>
        {!formError && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-brand-ink)]">
            {Object.entries(errors).map(([field, key]) => (
              <li key={field}>{errorText(key)}</li>
            ))}
          </ul>
        )}
      </div>
    ) : null;

  if (step === "success") {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-8 shadow-[var(--shadow-card)]"
      >
        <h2 className="text-2xl font-semibold text-[var(--color-brand-olive)]">
          {t("form.successTitle")}
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-[var(--color-brand-charcoal)]">
          {t("form.successBody", { name, groupSize, date, email })}
        </p>
        <div className="mt-6">
          <Link href="/" className={`${buttonStyles("secondary")} w-full sm:w-auto`}>
            {tNav("home")}
          </Link>
        </div>
      </div>
    );
  }

  if (step === "review") {
    const rows: Array<[string, string]> = [
      [t("form.tour"), tourName],
      [t("form.date"), date],
      [t("form.departureTime"), departureTime],
      [t("form.groupSize"), groupSize],
      [t("form.name"), name],
      [t("form.email"), email],
    ];
    if (phone) rows.push([t("form.phone"), phone]);
    rows.push([
      t("form.guideLanguage"),
      guideLanguage
        ? tNav(`languages.${guideLanguage as "en" | "es" | "fr" | "ar"}`)
        : t("form.guideLanguageAny"),
    ]);
    if (message) rows.push([t("form.message"), message]);

    return (
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-brand-ink)]">
          {t("form.review")}
        </h2>
        <dl className="mt-6 divide-y divide-[var(--color-border)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-8 shadow-[var(--shadow-card)]">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {label}
              </dt>
              <dd className="text-base text-[var(--color-brand-ink)] sm:col-span-2">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              className={`${buttonStyles("secondary")} w-full sm:w-auto`}
              onClick={() => setStep("form")}
              disabled={submitting}
            >
              {t("form.back")}
            </button>
            <button
              type="button"
              className={`${buttonStyles("primary")} w-full sm:w-auto`}
              onClick={submit}
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? t("form.submitting") : t("form.submit")}
            </button>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t("form.submitNote")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        goToReview();
      }}
      noValidate
    >
      {errorSummary}
      <div className="space-y-7">
        <div>
          <span className={labelClass} id="tour-label">
            {t("form.tour")}
          </span>
          <p
            aria-labelledby="tour-label"
            className="flex min-h-12 items-center rounded-[var(--radius-field)] border border-[var(--color-border)] bg-[var(--color-band)] px-4 py-2.5 text-base text-[var(--color-brand-ink)]"
          >
            {tourName}
          </p>
        </div>

        <div>
          <label htmlFor="date" className={labelClass}>
            {t("form.date")}
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={describedBy("date", true)}
          />
          <p id="date-help" className={helpClass}>
            {t("form.dateHelp")}
          </p>
          {fieldError("date")}
        </div>

        <div>
          <label htmlFor="departureTime" className={labelClass}>
            {t("form.departureTime")}
          </label>
          <select
            id="departureTime"
            name="departureTime"
            required
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className={inputClass}
            aria-invalid={errors.departureTime ? true : undefined}
            aria-describedby={describedBy("departureTime", true)}
          >
            <option value="" disabled>
              {t("form.departureTime")}
            </option>
            {departureTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          <p id="departureTime-help" className={helpClass}>
            {t("form.departureTimeHelp")}
          </p>
          {fieldError("departureTime")}
        </div>

        <div>
          <label htmlFor="groupSize" className={labelClass}>
            {t("form.groupSize")}
          </label>
          <input
            id="groupSize"
            name="groupSize"
            type="number"
            required
            min={groupSizeMin}
            max={groupSizeMax}
            step={1}
            inputMode="numeric"
            value={groupSize}
            onChange={(e) => setGroupSize(e.target.value)}
            className={inputClass}
            aria-invalid={errors.groupSize ? true : undefined}
            aria-describedby={describedBy("groupSize", true)}
          />
          <p id="groupSize-help" className={helpClass}>
            {t("form.groupSizeHelp")}
          </p>
          {fieldError("groupSize")}
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>
            {t("form.name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name", false)}
          />
          {fieldError("name")}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            {t("form.email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email", false)}
          />
          {fieldError("email")}
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            {t("form.phone")}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy("phone", true)}
          />
          <p id="phone-help" className={helpClass}>
            {t("form.phoneHelp")}
          </p>
          {fieldError("phone")}
        </div>

        <div>
          <label htmlFor="guideLanguage" className={labelClass}>
            {t("form.guideLanguage")}
          </label>
          <select
            id="guideLanguage"
            name="guideLanguage"
            value={guideLanguage}
            onChange={(e) => setGuideLanguage(e.target.value)}
            className={inputClass}
            aria-invalid={errors.guideLanguage ? true : undefined}
            aria-describedby={describedBy("guideLanguage", false)}
          >
            <option value="">{t("form.guideLanguageAny")}</option>
            {guideLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {tNav(`languages.${lang as "en" | "es" | "fr" | "ar"}`)}
              </option>
            ))}
          </select>
          {fieldError("guideLanguage")}
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>
            {t("form.message")}
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${inputClass} min-h-28`}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message", true)}
          />
          <p id="message-help" className={helpClass}>
            {t("form.messageHelp")}
          </p>
          {fieldError("message")}
        </div>

        <div
          aria-hidden="true"
          className="absolute top-auto h-px w-px overflow-hidden [clip-path:inset(50%)]"
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <button
            type="submit"
            className={`${buttonStyles("primary")} w-full sm:w-auto`}
          >
            {t("form.review")}
          </button>
        </div>
      </div>
    </form>
  );
}
