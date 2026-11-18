"use client";

import { useEffect, useRef, useState } from "react";
import {
  MQ,
  ScrollTrigger,
  bindSpotlight,
  gsap,
  spotlightLight,
  splitWords,
  tweenNumber,
  useIsoLayoutEffect,
} from "@/lib/motion";

type PlatformStats = {
  totalDonatedAed: number;
  donationCount: number;
  averageDonationAed: number;
  ngoCount: number;
  refugeeCount: number;
  openNeedCount: number;
  totalDistributedAed: number;
  totalPendingAed: number;
};

type ImpactMetric = {
  label: string;
  value: number;
  prefix?: string;
};

function isPlatformStats(value: unknown): value is PlatformStats {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const stats = value as Record<string, unknown>;
  return [
    "totalDonatedAed",
    "donationCount",
    "averageDonationAed",
    "ngoCount",
    "refugeeCount",
    "openNeedCount",
    "totalDistributedAed",
    "totalPendingAed",
  ].every((key) => typeof stats[key] === "number" && Number.isFinite(stats[key]));
}

function formatValue(value: number) {
  return new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2 }).format(
    value,
  );
}

/** Whole numbers count up as integers; decimals keep two places so digits don't jitter. */
function formatterFor(target: number) {
  return Number.isInteger(target)
    ? (value: number) => formatValue(Math.round(value))
    : (value: number) =>
        new Intl.NumberFormat("en-AE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
}

export default function ImpactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      try {
        const response = await fetch("/api/stats", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Stats request failed with status ${response.status}`);
        }

        const payload: unknown = await response.json();
        if (!isPlatformStats(payload)) {
          throw new Error("Stats response did not match the expected format.");
        }
        setStats(payload);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }
        setError("Live impact is temporarily unavailable. Please check back soon.");
        console.error("Unable to load RefuBridge impact stats:", fetchError);
      }
    }

    void loadStats();
    return () => controller.abort();
  }, []);

  // Heading: masked word reveal on scroll. Also the "live" indicator's radar pings.
  useIsoLayoutEffect(() => {
    const title = sectionRef.current?.querySelector<HTMLElement>("#impact-title");
    if (!title) return;

    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      const rings = sectionRef.current?.querySelectorAll<HTMLElement>(".live-ring");
      if (rings && rings.length) {
        const ping = gsap.fromTo(
          rings,
          { scale: 1, opacity: 0.55 },
          { scale: 3.4, opacity: 0, duration: 2, ease: "power1.out", stagger: 1, repeat: -1 },
        );
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? ping.resume() : ping.pause()),
        });
      }

      const split = splitWords(title);
      gsap.from(split.words, {
        yPercent: 115,
        rotate: 4,
        transformOrigin: "0% 100%",
        duration: 1.1,
        stagger: 0.06,
        ease: "expo.out",
        scrollTrigger: { trigger: title, start: "top 86%", once: true },
      });
      return () => split.revert();
    });
    return () => mm.revert();
  }, []);

  // Metric cards + counters, once the live numbers arrive
  useIsoLayoutEffect(() => {
    const root = sectionRef.current;
    if (!stats || !root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>(".impact-card"));
    const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"));
    const mm = gsap.matchMedia();

    mm.add(MQ.motion, () => {
      gsap.set(cards, { autoAlpha: 0, y: 36 });
      ScrollTrigger.batch(cards, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            stagger: 0.08,
            ease: "expo.out",
            overwrite: true,
          }),
      });

      counters.forEach((element) => {
        const target = Number(element.dataset.count);
        ScrollTrigger.create({
          trigger: element,
          start: "top 94%",
          once: true,
          onEnter: () =>
            tweenNumber(element, target, {
              duration: 1.8,
              ease: "power3.out",
              format: formatterFor(target),
            }),
        });
      });
    });

    mm.add(MQ.reduce, () => {
      counters.forEach((element) => {
        element.textContent = formatValue(Number(element.dataset.count));
      });
    });

    mm.add(`${MQ.motion} and ${MQ.fine}`, () => bindSpotlight(cards));

    // Skeleton → cards can change section height; re-measure downstream triggers
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(frame);
      mm.revert();
    };
  }, [stats]);

  const metrics: ImpactMetric[] = stats
    ? [
        { label: "Total donated", value: stats.totalDonatedAed, prefix: "AED" },
        {
          label: "Funds distributed",
          value: stats.totalDistributedAed,
          prefix: "AED",
        },
        {
          label: "Pending in the pool",
          value: stats.totalPendingAed,
          prefix: "AED",
        },
        {
          label: "Average donation",
          value: stats.averageDonationAed,
          prefix: "AED",
        },
        { label: "Open needs", value: stats.openNeedCount },
        { label: "Refugee profiles", value: stats.refugeeCount },
        { label: "Partner NGOs", value: stats.ngoCount },
        { label: "Community donations", value: stats.donationCount },
      ]
    : [];

  return (
    <section
      aria-labelledby="impact-title"
      className="bg-surface px-5 py-20 sm:px-8 sm:py-28"
      id="impact"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2
              className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl"
              id="impact-title"
            >
              Every number has a story.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              A real-time view of gifts, urgent needs and the community bringing
              them together.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              {!error && (
                <>
                  <span className="live-ring absolute inset-0 rounded-full bg-brand" />
                  <span className="live-ring absolute inset-0 rounded-full bg-brand" />
                </>
              )}
              <span
                className={`relative h-2 w-2 rounded-full ${
                  error ? "bg-amber-500" : "bg-brand"
                }`}
              />
            </span>
            {error ? "Data connection paused" : "Connected to live data"}
          </div>
        </div>

        <div
          aria-label="Live platform statistics"
          className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
          role="group"
        >
          {metrics.length > 0
            ? metrics.map((metric) => (
                <article
                  className={`impact-card ${spotlightLight} bg-white p-6`}
                  key={metric.label}
                >
                  <p className="text-sm text-muted">{metric.label}</p>
                  <p className="mt-5 text-3xl font-semibold tracking-tight text-ink tabular-nums">
                    {metric.prefix ? (
                      <span className="mr-1.5 text-sm font-medium text-muted">
                        {metric.prefix}
                      </span>
                    ) : null}
                    <span
                      aria-label={`${metric.prefix ? `${metric.prefix} ` : ""}${formatValue(metric.value)}`}
                      data-count={metric.value}
                    >
                      0
                    </span>
                  </p>
                </article>
              ))
            : Array.from({ length: 8 }, (_, index) => (
                <div
                  aria-hidden="true"
                  className="h-[132px] animate-pulse bg-white"
                  key={index}
                />
              ))}
        </div>

        <p
          aria-live="polite"
          className={`mt-6 min-h-6 text-sm ${
            error ? "text-amber-800" : "text-muted"
          }`}
          role={error ? "status" : undefined}
        >
          {error || (stats ? "Numbers update from the RefuBridge platform." : "Loading live impact…")}
        </p>
      </div>
    </section>
  );
}
