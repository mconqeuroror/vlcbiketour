"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { buttonStyles } from "@/components/ui";

type Status = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "mt-2 w-full rounded-[var(--radius-field)] border border-[var(--color-border)] bg-white px-4 py-3 text-base text-[var(--color-brand-ink)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand-ink)]";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const tA11y = useTranslations("a11y");
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  // Spam time-trap value; never rendered, so no hydration concerns.
  const [renderedAt] = useState(() => Date.now());

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
          locale,
          website: String(data.get("website") ?? ""),
          renderedAt,
        }),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const submitting = status === "submitting";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate={false} className="mt-10 max-w-prose">
      <div className="space-y-6">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-semibold">
            {t("name")}{" "}
            <span className="font-normal text-[var(--color-text-muted)]">({tA11y("required")})</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={200}
            disabled={submitting}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-sm font-semibold">
            {t("email")}{" "}
            <span className="font-normal text-[var(--color-text-muted)]">({tA11y("required")})</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={320}
            disabled={submitting}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-semibold">
            {t("message")}{" "}
            <span className="font-normal text-[var(--color-text-muted)]">({tA11y("required")})</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={6}
            maxLength={5000}
            disabled={submitting}
            className={fieldClass}
          />
        </div>

        <div
          aria-hidden="true"
          className="absolute top-0 h-px w-px overflow-hidden [clip-path:inset(50%)]"
        >
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <button type="submit" disabled={submitting} className={buttonStyles("primary")}>
          {submitting ? t("sending") : t("send")}
        </button>
      </div>

      <div aria-live="polite" className="mt-6">
        {status === "success" ? (
          <p
            role="status"
            className="rounded-[var(--radius-md)] border border-[var(--color-success-700)] bg-white px-4 py-3 font-medium text-[var(--color-success-700)]"
          >
            {t("success")}
          </p>
        ) : null}
        {status === "error" ? (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--color-error-700)] bg-white px-4 py-3 font-medium text-[var(--color-error-700)]"
          >
            {t("error")}
          </p>
        ) : null}
      </div>
    </form>
  );
}
