"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap, prefersReducedMotion, tweenNumber } from "@/lib/motion";

const quickAmounts = [10, 50, 100, 500];

const fieldClass =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/10";

const formatAmount = (value: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2 }).format(value);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Number that rolls to its new value instead of snapping. */
function AnimatedAmount({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [initialValue] = useState(value);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion()) {
      element.textContent = formatAmount(value);
      element.dataset.value = String(value);
      return;
    }
    tweenNumber(element, value, { duration: 0.55, ease: "power2.out", format: formatAmount });
  }, [value]);

  return (
    <span className="tabular-nums" data-value={initialValue} ref={ref}>
      {formatAmount(initialValue)}
    </span>
  );
}

export default function DonationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("50");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState<{ name: string; amount: number } | null>(
    null,
  );

  const errorRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);

  // Error: quick horizontal shake so it's felt, not just read
  useEffect(() => {
    const element = errorRef.current;
    if (!errorMessage || !element || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      element,
      { autoAlpha: 0, y: -6 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.35,
        ease: "power3.out",
      },
    );
    const shake = gsap.fromTo(
      element,
      { x: 0 },
      {
        keyframes: [
          { x: -8, duration: 0.07 },
          { x: 8, duration: 0.07 },
          { x: -5, duration: 0.07 },
          { x: 5, duration: 0.07 },
          { x: 0, duration: 0.07 },
        ],
        ease: "power1.inOut",
      },
    );
    return () => {
      tween.kill();
      shake.kill();
      gsap.set(element, { clearProps: "all" });
    };
  }, [errorMessage]);

  // Success: springy pop
  useEffect(() => {
    const element = successRef.current;
    if (!success || !element || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      element,
      { autoAlpha: 0, y: 16, scale: 0.94 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
    );
    return () => {
      tween.kill();
      gsap.set(element, { clearProps: "all" });
    };
  }, [success]);

  // Tactile feedback when a preset amount is picked
  function pulse(target: HTMLElement) {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      target,
      { scale: 0.92 },
      { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)", overwrite: "auto", clearProps: "transform" },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccess(null);

    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue < 1) {
      setErrorMessage("Choose an amount of at least AED 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          amount: amountValue,
        }),
      });

      if (!response.ok) {
        const responseBody: unknown = await response.json().catch(() => null);
        const message =
          isRecord(responseBody) && typeof responseBody.error === "string"
            ? responseBody.error
            : "We couldn’t process your donation. Please try again.";
        throw new Error(message);
      }

      setSuccess({ name: name.trim(), amount: amountValue });
      setName("");
      setEmail("");
      setAmount("50");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn’t process your donation. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="w-full max-w-[480px] rounded-2xl border border-line bg-white p-6 text-left shadow-[0_16px_40px_-20px_rgba(11,31,58,0.18)] sm:p-8"
      id="donate"
    >
      <h2 className="text-xl font-semibold tracking-tight text-ink">
        Make a donation
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-muted">
        Every gift joins a shared pool and goes to the most urgent needs each
        day.
      </p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Your name
            </span>
            <input
              autoComplete="name"
              className={fieldClass}
              maxLength={120}
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              required
              value={name}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Email address
            </span>
            <input
              autoComplete="email"
              className={fieldClass}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink">
            Amount (AED)
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                aria-pressed={Number(amount) === quickAmount}
                className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                  Number(amount) === quickAmount
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-ink hover:border-brand/50 hover:bg-brand-tint"
                }`}
                key={quickAmount}
                onClick={(event) => {
                  pulse(event.currentTarget);
                  setAmount(String(quickAmount));
                  setSuccess(null);
                }}
                type="button"
              >
                {quickAmount}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Custom amount
          </span>
          <span className="flex h-11 items-center rounded-lg border border-line bg-white transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
            <span className="pl-3.5 text-sm text-muted">AED</span>
            <input
              aria-label="Donation amount in UAE dirhams"
              className="h-full w-full bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted/60"
              inputMode="decimal"
              min="1"
              name="amount"
              onChange={(event) => {
                setAmount(event.target.value);
                setSuccess(null);
              }}
              placeholder="Enter an amount"
              required
              step="0.01"
              type="number"
              value={amount}
            />
          </span>
        </label>

        {errorMessage ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            ref={errorRef}
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {success ? (
          <p
            aria-live="polite"
            className="rounded-lg border border-brand/20 bg-brand-tint px-4 py-3 text-sm leading-6 text-ink"
            ref={successRef}
            role="status"
          >
            Thank you, {success.name}. Your AED {formatAmount(success.amount)} is now in the
            pool and will be allocated to the most urgent needs at the end of
            the day.
          </p>
        ) : null}

        <button
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              Processing…
            </>
          ) : (
            <>
              Donate AED <AnimatedAmount value={Number(amount) || 0} />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted">
        Demo mode: no real payment is taken.
      </p>
    </div>
  );
}
