"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

  useEffect(() => {
    if (!stats || !sectionRef.current) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const context = gsap.context(() => {
      const counters =
        sectionRef.current?.querySelectorAll<HTMLElement>("[data-count]");
      counters?.forEach((element) => {
        const target = Number(element.dataset.count);
        if (reducedMotion) {
          element.textContent = formatValue(target);
          return;
        }

        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
          onUpdate: () => {
            element.textContent = formatValue(counter.value);
          },
        });
      });
    }, sectionRef);

    return () => context.revert();
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
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                error ? "bg-amber-500" : "bg-brand"
              }`}
            />
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
                <article className="bg-white p-6" key={metric.label}>
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
