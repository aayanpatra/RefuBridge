"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import DonationForm from "@/components/donation-form";
import Icon from "@/components/icon";
import ImpactSection from "@/components/impact-section";
import SiteNav from "@/components/site-nav";

const challenges = [
  {
    icon: "copy" as const,
    title: "Scattered data",
    description:
      "Important requests live across forms, inboxes and spreadsheets that rarely line up.",
  },
  {
    icon: "people" as const,
    title: "Repeated records",
    description:
      "Without shared context, the same request can appear more than once.",
  },
  {
    icon: "receipt" as const,
    title: "No shared picture",
    description:
      "Donors and partners need a clearer view of where support is going.",
  },
  {
    icon: "clock" as const,
    title: "Slow response",
    description:
      "Time spent reconciling records is time not spent meeting urgent needs.",
  },
];

const steps = [
  {
    number: "01",
    title: "Donate",
    description:
      "A contribution joins a shared pool instead of being tied to a single request.",
  },
  {
    number: "02",
    title: "Pool",
    description:
      "Donations come together so support can reach needs that might otherwise be missed.",
  },
  {
    number: "03",
    title: "Prioritize",
    description:
      "At the end of each day, AI sorts verified needs by urgency—not by who asked first.",
  },
  {
    number: "04",
    title: "Account for every step",
    description:
      "NGOs receive allocated funds with a spending spreadsheet to support clear follow-through.",
  },
];

const goals = [
  {
    icon: "spark" as const,
    title: "Needs, not equal shares",
    description:
      "Allocate against urgency and verified need so limited support can do more good.",
    detail: "Urgency-led distribution",
  },
  {
    icon: "shield" as const,
    title: "Build in accountability",
    description:
      "Background checks, pattern recognition, proof of need and proof of expenditure.",
    detail: "Checks at every stage",
  },
  {
    icon: "receipt" as const,
    title: "Make giving visible",
    description:
      "Clear records connect donations to allocation and reported spending.",
    detail: "Traceable by design",
  },
  {
    icon: "lock" as const,
    title: "Protect personal privacy",
    description:
      "NGOs see only the information they need to coordinate and deliver support.",
    detail: "Privacy by default",
  },
];

const support = [
  { icon: "food" as const, label: "Food" },
  { icon: "health" as const, label: "Healthcare" },
  { icon: "home" as const, label: "Shelter" },
];

function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      return;
    }

    // One page-load moment: the hero settles in. Everything else stays still.
    const context = gsap.context(() => {
      gsap.from(".hero-entrance", {
        autoAlpha: 0,
        y: 16,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.05,
      });
    }, pageRef);

    return () => context.revert();
  }, []);

  return (
    <div className="min-h-screen bg-white text-ink" ref={pageRef}>
      <SiteNav />
      <main>
        <section
          aria-labelledby="hero-title"
          className="border-b border-line bg-surface px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40"
          id="top"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_480px] lg:gap-20">
            <div>
              <h1
                className="hero-entrance max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl"
                id="hero-title"
              >
                Bridging generosity to need.
              </h1>
              <p className="hero-entrance mt-6 max-w-lg text-lg leading-8 text-muted">
                Your generosity, connected to the most urgent needs—with
                clarity, care and accountability at every step.
              </p>
              <a
                className="hero-entrance mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
                href="#how-it-works"
              >
                See how it works
              </a>
            </div>

            <div className="hero-entrance lg:justify-self-end">
              <DonationForm />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="problem-title"
          className="px-5 py-20 sm:px-8 sm:py-28"
          id="problem"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
              <h2
                className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl"
                id="problem-title"
              >
                Good intentions shouldn’t get lost in the handoff.
              </h2>
              <p className="max-w-xl text-base leading-7 text-muted">
                When information is scattered, repeated and slow to verify,
                urgent support can take longer to reach the people who need it.
                RefuBridge brings the picture together—without losing sight of
                the person behind each request.
              </p>
            </div>

            <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {challenges.map((challenge) => (
                <article className="border-t border-line pt-6" key={challenge.title}>
                  <Icon name={challenge.icon} className="h-5 w-5 text-brand" />
                  <h3 className="mt-4 text-base font-semibold text-ink">
                    {challenge.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {challenge.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-16 flex flex-col gap-8 rounded-2xl border border-line bg-surface p-7 sm:p-9 md:flex-row md:items-center md:justify-between">
              <p className="max-w-md text-lg font-medium leading-7 text-ink">
                Food on the table. Medicine within reach. A safer place to
                rest.
              </p>
              <ul className="flex flex-wrap gap-x-8 gap-y-4">
                {support.map((item) => (
                  <li
                    className="flex items-center gap-3 text-sm font-medium text-ink"
                    key={item.label}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-brand">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="process-title"
          className="border-y border-line bg-surface px-5 py-20 sm:px-8 sm:py-28"
          id="how-it-works"
        >
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="h-fit lg:sticky lg:top-28">
              <h2
                className="max-w-lg text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl"
                id="process-title"
              >
                A thoughtful path from gift to good.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-muted">
                A simple, accountable loop keeps generosity moving toward
                verified, time-sensitive needs.
              </p>

              <aside className="mt-10 border-l-2 border-brand pl-5">
                <p className="text-sm text-muted">An illustrative example</p>
                <h3 className="mt-2 text-lg font-semibold text-ink">
                  Meet Sammy.
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Sammy needs heart medication. His family’s request joins the
                  verified pool, where it can be considered alongside other
                  urgent needs—not lost in a stack of separate lists.
                </p>
              </aside>
            </div>

            <ol className="border-b border-line">
              {steps.map((step) => (
                <li
                  className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line py-7"
                  key={step.number}
                >
                  <span className="pt-1 text-sm font-medium text-brand tabular-nums">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 max-w-xl text-base leading-7 text-muted">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="goals-title"
          className="px-5 py-20 sm:px-8 sm:py-28"
          id="goals"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl"
              id="goals-title"
            >
              Trust is built into the process.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Thoughtful systems can make aid more responsive while keeping
              dignity, transparency and privacy in view.
            </p>

            <div className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
              {goals.map((goal) => (
                <article className="flex gap-5" key={goal.title}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                    <Icon name={goal.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">
                      {goal.title}
                    </h3>
                    <p className="mt-2 max-w-md text-base leading-7 text-muted">
                      {goal.description}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-brand">
                      <Icon name="check" className="h-4 w-4" />
                      {goal.detail}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ImpactSection />

        <section className="bg-brand px-5 py-16 text-white sm:px-8 sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Together, we can make the distance to help shorter.
            </h2>
            <a
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3.5 text-sm font-medium text-brand transition-colors hover:bg-brand-tint"
              href="#donate"
            >
              Make a donation
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <a className="flex items-center gap-2.5 text-ink" href="#top">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <Icon name="bridge" className="h-5 w-5" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              RefuBridge
            </span>
          </a>
          <p className="text-sm text-muted">
            Co-created by Aayan Patra and Aarav Pratap
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a
              className="text-muted transition-colors hover:text-ink"
              href="#top"
            >
              Back to top
            </a>
            <a
              className="font-medium text-brand transition-colors hover:text-brand-dark"
              href="/admin"
            >
              Admin
            </a>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-muted">
          A platform concept built around care, clarity and accountability.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
