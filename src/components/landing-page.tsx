"use client";

import { useRef } from "react";
import DonationForm from "@/components/donation-form";
import Icon from "@/components/icon";
import ImpactSection from "@/components/impact-section";
import SiteNav from "@/components/site-nav";
import {
  CtaBurst,
  HeroRings,
  HeroSparks,
  JourneyBackdrop,
  ProcessFlow,
} from "@/components/ornaments";
import {
  MQ,
  ScrollTrigger,
  bindSpotlight,
  getLenis,
  gsap,
  initSmoothScroll,
  magnetic,
  scrollToHash,
  spotlightDark,
  splitWords,
  useIsoLayoutEffect,
  whileVisible,
} from "@/lib/motion";

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

const journeyDetails = [
  {
    icon: "shield" as const,
    eyebrow: "First, build confidence",
    title: "A request is checked with care.",
    description:
      "Partner NGOs review each request and its supporting information. Duplicate signals and unusual patterns can be flagged for a closer look, while people’s personal details stay protected.",
    note: "Verified needs enter the shared pool",
    doodle: "M8 18c4-12 16-12 20 0m-16 4c3-7 9-7 12 0",
  },
  {
    icon: "spark" as const,
    eyebrow: "Then, understand urgency",
    title: "Needs are considered together.",
    description:
      "At the end of the day, a prioritization process weighs urgency and the information available. It helps teams see what needs attention first—it supports human decisions, it doesn’t replace them.",
    note: "Urgency guides the daily review",
    doodle: "M4 20c8-1 8-15 16-16m-11 0h11v11",
  },
  {
    icon: "heart" as const,
    eyebrow: "Next, move support",
    title: "Pooled gifts reach partners.",
    description:
      "Donations are allocated to participating NGOs based on prioritized needs and available funds. Pooling can help resources reach needs that might be missed when gifts are tied to one request.",
    note: "A shared pool, matched to need",
    doodle: "M4 15c5-12 11 12 16 0m-16 5c5-8 11 8 16 0",
  },
  {
    icon: "receipt" as const,
    eyebrow: "Finally, show the follow-through",
    title: "Every allocation has a record.",
    description:
      "Partners receive an allocation record and spending spreadsheet to document how support was used. Clear reporting helps donors and coordinators follow the journey without exposing sensitive personal information.",
    note: "A visible trail from gift to spend",
    doodle: "M5 5h14v16l-4-2-3 2-3-2-4 2zm4 5h6m-6 4h6",
  },
];

function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<T>(selector));

    let alive = true;
    const mm = gsap.matchMedia();

    /* -- Anchor links: one delegated, interruptible GSAP scroll -------------- */
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute("href");
      if (hash && scrollToHash(hash)) event.preventDefault();
    };
    root.addEventListener("click", onClick);

    /* -- Smooth scroll: Lenis, registered first so everything below sees it --- */
    mm.add(MQ.motion, () => initSmoothScroll());

    /* -- Core motion: hero intro, text reveals, scroll-linked effects -------- */
    mm.add(MQ.motion, () => {
      const splits: Array<{ revert: () => void }> = [];

      // HERO — masked word rise, like the headline on gsap.com
      const heroTitle = root.querySelector<HTMLElement>("#hero-title");
      if (heroTitle) {
        const hero = splitWords(heroTitle);
        splits.push(hero);
        gsap.set(hero.words, { transformOrigin: "0% 100%" });

        const intro = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1 });
        intro
          .from(hero.words, { yPercent: 120, rotate: 6, duration: 1.4, stagger: 0.08 }, 0)
          .from($(".hero-fade"), { autoAlpha: 0, y: 26, duration: 1.1, stagger: 0.12 }, 0.45)
          .from($(".hero-card"), { autoAlpha: 0, y: 70, scale: 0.96, duration: 1.5 }, 0.3)
          .from(
            $(".hero-doodle .orbit"),
            { scale: 0.4, autoAlpha: 0, svgOrigin: "80 80", duration: 1.4, ease: "back.out(1.7)" },
            0.7,
          );
      }

      // Continuous orbit — paused whenever the hero is off-screen
      const orbit = $(".hero-doodle .orbit");
      if (orbit.length) {
        const spin = gsap.to(orbit, {
          rotation: 360,
          svgOrigin: "80 80",
          duration: 40,
          ease: "none",
          repeat: -1,
        });
        ScrollTrigger.create({
          trigger: "#top",
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? spin.resume() : spin.pause()),
        });
      }

      // HERO parallax — copy drifts up faster than the page, doodle slower
      gsap.to($(".hero-copy"), {
        yPercent: -14,
        ease: "none",
        scrollTrigger: { trigger: "#top", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to($(".hero-doodle"), {
        yPercent: 55,
        rotate: 25,
        ease: "none",
        scrollTrigger: { trigger: "#top", start: "top top", end: "bottom top", scrub: true },
      });

      // HEADINGS — masked word reveal as each one enters
      $("[data-split]")
        .filter((el) => el.id !== "hero-title")
        .forEach((el) => {
          const split = splitWords(el);
          splits.push(split);
          gsap.from(split.words, {
            yPercent: 115,
            rotate: 4,
            transformOrigin: "0% 100%",
            duration: 1.1,
            stagger: 0.06,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 86%", once: true },
          });
        });

      // PARAGRAPH — words light up as you scroll (scrubbed)
      $("[data-scrub-words]").forEach((el) => {
        const split = splitWords(el);
        splits.push(split);
        gsap.set(split.words, { opacity: 0.16 });
        gsap.to(split.words, {
          opacity: 1,
          stagger: 0.1,
          duration: 0.3,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: true },
        });
      });

      // GENERIC REVEALS — batched so neighbours cascade together
      const reveals = $(".reveal-up");
      gsap.set(reveals, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(reveals, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            stagger: 0.1,
            ease: "expo.out",
            overwrite: true,
          }),
      });

      // PROCESS — each step's top rule draws in as it scrolls into place
      $(".step").forEach((step) => {
        const line = step.querySelector<HTMLElement>(".step-line");
        if (!line) return;
        gsap.to(line, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: step, start: "top 85%", end: "top 50%", scrub: true },
        });
      });

      // GOALS — icons pop with a springy overshoot
      const goalIcons = $(".goal-icon");
      gsap.set(goalIcons, { scale: 0, rotate: -45 });
      ScrollTrigger.batch(goalIcons, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            scale: 1,
            rotate: 0,
            duration: 0.9,
            stagger: 0.1,
            ease: "back.out(2.2)",
            overwrite: true,
          }),
      });

      /* ---- SVG choreography -------------------------------------------- */

      // Hero rings: three layers turning against each other, a pulsing core, and an arch
      // that draws itself while a dot rides along it (MotionPath), then repeats.
      const rings = root.querySelector<SVGSVGElement>(".hero-rings");
      if (rings) {
        const q = <T extends Element = Element>(selector: string) => rings.querySelector<T>(selector);
        const spinRing = (selector: string, duration: number) =>
          gsap.to(q(selector), { rotation: duration > 0 ? 360 : -360, svgOrigin: "100 100", duration: Math.abs(duration), ease: "none", repeat: -1 });
        const spins = [spinRing(".ring-a", 90), spinRing(".ring-b", -55), spinRing(".ring-c", 32)];
        const pulse = gsap.to(q(".hero-rings-spark"), {
          scale: 1.6,
          svgOrigin: "100 100",
          duration: 1.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        const bridge = q<SVGPathElement>(".bridge-path");
        const dot = q<SVGCircleElement>(".bridge-dot");
        let arch: gsap.core.Timeline | null = null;
        if (bridge && dot) {
          gsap.set(bridge, { strokeDasharray: 1 });
          arch = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
          arch
            .set([bridge, dot], { autoAlpha: 1 })
            .fromTo(bridge, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" }, 0)
            .to(
              dot,
              {
                motionPath: { path: bridge, align: bridge, alignOrigin: [0.5, 0.5] },
                duration: 2.4,
                ease: "power2.inOut",
                immediateRender: true,
              },
              0,
            )
            .to([bridge, dot], { autoAlpha: 0, duration: 0.7, ease: "power1.in" }, "+=0.35");
        }

        gsap.from(rings, { autoAlpha: 0, scale: 0.8, svgOrigin: "100 100", duration: 1.8, ease: "expo.out", delay: 0.5 });
        whileVisible("#top", [...spins, pulse, arch]);
      }

      // Hero sparks: each one floats, spins at its own speed, and (squiggle) marches its dashes
      const sparks = $(".spark");
      if (sparks.length) {
        const loops: gsap.core.Tween[] = [];
        sparks.forEach((spark, index) => {
          const float = spark.querySelector<HTMLElement>(".spark-float");
          const svg = spark.querySelector<SVGSVGElement>("svg");
          if (float) {
            loops.push(
              gsap.to(float, {
                y: gsap.utils.random(-24, -10),
                rotate: gsap.utils.random(-14, 14),
                duration: gsap.utils.random(3, 5.5),
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: index * 0.25,
              }),
            );
          }
          const spin = Number(svg?.dataset.spin ?? 0);
          if (svg && spin !== 0) {
            loops.push(
              gsap.to(svg, { rotation: spin > 0 ? 360 : -360, transformOrigin: "50% 50%", duration: Math.abs(spin), ease: "none", repeat: -1 }),
            );
          }
          const squiggle = spark.querySelector<SVGPathElement>(".squiggle-path");
          if (squiggle) {
            loops.push(gsap.to(squiggle, { strokeDashoffset: -28, duration: 2.4, ease: "none", repeat: -1 }));
          }
        });
        gsap.from(sparks, { autoAlpha: 0, scale: 0, duration: 1.3, stagger: 0.1, ease: "back.out(2.4)", delay: 0.9 });
        whileVisible("#top", loops);
      }

      // Process flow: path draws, a dot rides it, and each node lights as it's reached —
      // all one scrubbed timeline tied to the step list.
      const flow = root.querySelector<SVGSVGElement>(".process-flow");
      const stepList = root.querySelector<HTMLElement>("#how-it-works ol");
      const flowPath = flow?.querySelector<SVGPathElement>(".flow-path");
      const flowDot = flow?.querySelector<SVGCircleElement>(".flow-dot");
      if (flow && stepList && flowPath && flowDot) {
        const cores = Array.from(flow.querySelectorAll<SVGCircleElement>(".flow-core"));
        gsap.set(flowPath, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(cores, { scale: 0, transformOrigin: "50% 50%" });

        const flowTl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stepList, start: "top 65%", end: "bottom 60%", scrub: 0.8 },
        });
        flowTl
          .to(flowPath, { strokeDashoffset: 0, duration: 1 }, 0)
          .to(
            flowDot,
            { motionPath: { path: flowPath, align: flowPath, alignOrigin: [0.5, 0.5] }, duration: 1, immediateRender: true },
            0,
          );
        cores.forEach((core, index) => {
          flowTl.to(core, { scale: 1, duration: 0.09, ease: "back.out(3)" }, Math.max(0, index / 3 - 0.02));
        });
      }

      // Journey backdrop: two rings scrubbed with the page (opposite ways), two on their own clock
      const backdrop = root.querySelector<SVGSVGElement>(".journey-backdrop");
      const journey = root.querySelector<HTMLElement>(".journey-section");
      if (backdrop && journey) {
        const origin = "200 200";
        const part = (selector: string) => backdrop.querySelector(selector);
        gsap.to(part(".jb-a"), {
          rotation: 140, svgOrigin: origin, ease: "none",
          scrollTrigger: { trigger: journey, start: "top bottom", end: "bottom top", scrub: 1 },
        });
        gsap.to(part(".jb-b"), {
          rotation: -200, svgOrigin: origin, ease: "none",
          scrollTrigger: { trigger: journey, start: "top bottom", end: "bottom top", scrub: 1.4 },
        });
        const loops = [
          gsap.to(part(".jb-c"), { rotation: 360, svgOrigin: origin, duration: 50, ease: "none", repeat: -1 }),
          gsap.to(part(".jb-d"), { rotation: -360, svgOrigin: origin, duration: 70, ease: "none", repeat: -1 }),
          gsap.to(part(".jb-spark"), { scale: 1.5, svgOrigin: origin, duration: 2, ease: "sine.inOut", yoyo: true, repeat: -1 }),
        ];
        whileVisible(journey, loops);
      }

      // CTA burst: rays ripple one after another, the whole burst turns with the scroll
      const burst = root.querySelector<SVGSVGElement>(".cta-burst");
      const cta = root.querySelector<HTMLElement>(".cta-section");
      if (burst && cta) {
        const origin = "100 100";
        const part = (selector: string) => burst.querySelector(selector);
        gsap.to(part(".burst-rays"), {
          rotation: 120, svgOrigin: origin, ease: "none",
          scrollTrigger: { trigger: cta, start: "top bottom", end: "bottom top", scrub: 1 },
        });
        const loops = [
          gsap.to(burst.querySelectorAll(".burst-ray"), {
            opacity: 0.25,
            duration: 0.9,
            ease: "sine.inOut",
            stagger: { each: 0.1, repeat: -1, yoyo: true },
          }),
          gsap.to(part(".burst-ring"), { rotation: -360, svgOrigin: origin, duration: 40, ease: "none", repeat: -1 }),
          gsap.to(part(".burst-core"), { scale: 1.35, svgOrigin: origin, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 }),
        ];
        whileVisible(cta, loops);
      }

      return () => splits.forEach((split) => split.revert());
    });

    /* -- Journey: pinned horizontal scroll with snap + progress (desktop) ---- */
    mm.add(`${MQ.motion} and ${MQ.desktop}`, () => {
      const section = root.querySelector<HTMLElement>(".journey-section");
      const viewport = section?.querySelector<HTMLElement>(".journey-viewport");
      const track = section?.querySelector<HTMLElement>(".journey-track");
      if (!section || !viewport || !track) return;

      const cards = Array.from(section.querySelectorAll<HTMLElement>(".journey-card"));
      const bar = section.querySelector<HTMLElement>(".journey-progress");
      const counter = section.querySelector<HTMLElement>(".journey-count");
      const setBar = bar ? gsap.quickSetter(bar, "scaleX") : null;

      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      // Scroll positions (0–1) where each card sits flush left — used for snapping
      const snapPoints = () => {
        const total = distance();
        if (total === 0 || cards.length === 0) return [0];
        const firstLeft = cards[0].getBoundingClientRect().left;
        return cards.map((card) =>
          Math.min(1, Math.max(0, (card.getBoundingClientRect().left - firstLeft) / total)),
        );
      };

      gsap.set(viewport, { overflow: "hidden" });

      // ScrollTrigger's own snap fights Lenis (both try to own the scroll position),
      // so with Lenis running we snap through Lenis instead — see below.
      const lenis = getLenis();

      let lastIndex = -1;
      const horizontal = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => `+=${distance()}`,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1, // pins must be measured before triggers below them
          snap: lenis
            ? undefined
            : {
                snapTo: (value) => gsap.utils.snap(snapPoints(), value),
                duration: { min: 0.25, max: 0.8 },
                delay: 0.08,
                ease: "power2.inOut",
              },
          onUpdate: (self) => {
            setBar?.(self.progress);
            if (!counter) return;
            const points = snapPoints();
            let nearest = 0;
            points.forEach((point, index) => {
              if (Math.abs(point - self.progress) < Math.abs(points[nearest] - self.progress)) {
                nearest = index;
              }
            });
            if (nearest !== lastIndex) {
              lastIndex = nearest;
              counter.textContent = `0${nearest + 1}`;
              gsap.fromTo(
                counter,
                { yPercent: 70, autoAlpha: 0 },
                { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out", overwrite: true },
              );
            }
          },
        },
      });

      cards.forEach((card) => {
        // Card eases into focus as it travels into the viewport
        gsap.fromTo(
          card,
          { autoAlpha: 0.45, scale: 0.94, y: 24 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontal,
              start: "left 88%",
              end: "left 45%",
              scrub: true,
            },
          },
        );

        // Doodle draws itself with the scroll
        const doodle = card.querySelector<SVGPathElement>(".journey-doodle");
        if (doodle) {
          gsap.fromTo(
            doodle,
            { strokeDasharray: 1, strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontal,
                start: "left 80%",
                end: "left 25%",
                scrub: true,
              },
            },
          );
        }
      });

      // Lenis snapping: once scrolling goes quiet inside the pinned range, glide to the nearest card
      let removeLenisSnap = () => {};
      const pinTrigger = horizontal.scrollTrigger;
      if (lenis && pinTrigger) {
        let timer = 0;
        const settle = () => {
          if (!pinTrigger.isActive) return;
          const points = snapPoints();
          const progress = (lenis.scroll - pinTrigger.start) / (pinTrigger.end - pinTrigger.start);
          const target = pinTrigger.start + gsap.utils.snap(points, progress) * (pinTrigger.end - pinTrigger.start);
          if (Math.abs(target - lenis.scroll) > 2) lenis.scrollTo(target, { duration: 0.8 });
        };
        const onScroll = () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(settle, 160);
        };
        lenis.on("scroll", onScroll);
        removeLenisSnap = () => {
          window.clearTimeout(timer);
          lenis.off("scroll", onScroll);
        };
      }

      const unbindSpotlight = bindSpotlight(cards);
      return () => {
        removeLenisSnap();
        unbindSpotlight();
      };
    });

    /* -- Fine pointers only: magnetic buttons -------------------------------- */
    mm.add(`${MQ.motion} and ${MQ.fine}`, () => {
      const cleanups = $("[data-magnetic]").map((el) => magnetic(el));

      // Hero sparks follow the pointer, each at its own depth (parallax)
      const hero = root.querySelector<HTMLElement>("#top");
      const sparks = $(".spark");
      if (hero && sparks.length) {
        const movers = sparks.map((spark) => ({
          depth: Number(spark.dataset.depth ?? 1),
          x: gsap.quickTo(spark, "x", { duration: 1, ease: "power3.out" }),
          y: gsap.quickTo(spark, "y", { duration: 1, ease: "power3.out" }),
        }));
        const move = (event: PointerEvent) => {
          const rect = hero.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width - 0.5;
          const ny = (event.clientY - rect.top) / rect.height - 0.5;
          movers.forEach(({ depth, x, y }) => {
            x(nx * 70 * depth);
            y(ny * 70 * depth);
          });
        };
        const leave = () => movers.forEach(({ x, y }) => { x(0); y(0); });
        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", leave);
          sparks.forEach((spark) => gsap.set(spark, { x: 0, y: 0 }));
        });
      }

      return () => cleanups.forEach((cleanup) => cleanup());
    });

    // Fonts change text metrics, which moves every trigger — re-measure once.
    document.fonts?.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      root.removeEventListener("click", onClick);
      mm.revert();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-ink" ref={pageRef}>
      <SiteNav />
      <main>
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden border-b border-line bg-surface px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40"
          id="top"
        >
          <HeroRings />
          <HeroSparks />
          <svg
            aria-hidden="true"
            className="hero-doodle pointer-events-none absolute -right-10 top-20 hidden h-64 w-64 text-brand/20 lg:block"
            fill="none"
            viewBox="0 0 160 160"
          >
            <g className="orbit">
              <circle
                cx="80"
                cy="80"
                r="52"
                stroke="currentColor"
                strokeDasharray="2 7"
                strokeWidth="1.5"
              />
              <circle
                cx="80"
                cy="28"
                r="3.5"
                fill="white"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </g>
            <path
              d="M37 99c17-44 56-55 86-27"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
            <path
              d="m115 64 9 8-12 2"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <circle cx="37" cy="99" r="4" fill="currentColor" />
            <path d="m76 22 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="currentColor" />
          </svg>
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_480px] lg:gap-20">
            <div className="hero-copy">
              <h1
                className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl"
                data-split
                id="hero-title"
              >
                Bridging generosity to need.
              </h1>
              <p className="hero-fade mt-6 max-w-lg text-lg leading-8 text-muted">
                Your generosity, connected to the most urgent needs—with
                clarity, care and accountability at every step.
              </p>
              <div className="hero-fade mt-7 flex items-center gap-3 text-sm text-muted">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand/20 bg-white text-brand">
                  <Icon name="bridge" className="h-5 w-5" />
                </span>
                <span>One connected path. More room for care.</span>
              </div>
              <a
                className="hero-fade mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
                data-magnetic
                href="#how-it-works"
              >
                See how it works
                <Icon name="arrow" className="h-4 w-4" />
              </a>
            </div>

            <div className="hero-card lg:justify-self-end">
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
                data-split
                id="problem-title"
              >
                Good intentions shouldn’t get lost in the handoff.
              </h2>
              <p
                className="max-w-xl text-base leading-7 text-ink"
                data-scrub-words
              >
                When information is scattered, repeated and slow to verify,
                urgent support can take longer to reach the people who need it.
                RefuBridge brings the picture together—without losing sight of
                the person behind each request.
              </p>
            </div>

            <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {challenges.map((challenge) => (
                <article className="reveal-up border-t border-line pt-6" key={challenge.title}>
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

            <div className="reveal-up mt-16 flex flex-col gap-8 rounded-2xl border border-line bg-surface p-7 sm:p-9 md:flex-row md:items-center md:justify-between">
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
                data-split
                id="process-title"
              >
                A thoughtful path from gift to good.
              </h2>
              <p className="reveal-up mt-5 max-w-md text-base leading-7 text-muted">
                A simple, accountable loop keeps generosity moving toward
                verified, time-sensitive needs.
              </p>

              <aside className="reveal-up mt-10 border-l-2 border-brand pl-5">
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

              <ProcessFlow />
            </div>

            <ol className="border-b border-line">
              {steps.map((step) => (
                <li
                  className="step reveal-up relative grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line py-7"
                  key={step.number}
                >
                  <span
                    aria-hidden="true"
                    className="step-line pointer-events-none absolute -top-px left-0 h-px w-full bg-brand"
                    style={{ transform: "scaleX(0)", transformOrigin: "0% 50%" }}
                  />
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
          aria-labelledby="journey-title"
          className="journey-section relative overflow-hidden bg-[#10264a] px-5 py-20 text-white sm:px-8 sm:py-24"
        >
          <JourneyBackdrop />
          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col justify-between gap-6 sm:mb-12 sm:flex-row sm:items-end">
              <div>
                <p className="reveal-up text-sm font-medium uppercase tracking-[0.18em] text-blue-200">
                  From request to report
                </p>
                <h2
                  className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
                  data-split
                  id="journey-title"
                >
                  A closer look at every handoff.
                </h2>
              </div>
              <p className="reveal-up max-w-sm text-sm leading-6 text-blue-100/80">
                Follow a gift as it moves through a careful, connected process.
                Scroll to explore each stage.
              </p>
            </div>

            <div
              aria-label="Scroll horizontally through the four stages"
              className="journey-viewport -mx-5 snap-x snap-mandatory overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8"
              role="region"
              tabIndex={0}
            >
              <div className="journey-track flex w-max gap-4 sm:gap-6">
                {journeyDetails.map((detail, index) => (
                  <article
                    className={`journey-card ${spotlightDark} flex min-h-[350px] w-[82vw] max-w-[620px] min-w-[280px] snap-start flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-6 sm:min-h-[390px] sm:p-9`}
                    key={detail.title}
                  >
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-2 -top-3 h-32 w-32 text-blue-200/20 sm:h-40 sm:w-40"
                      fill="none"
                      viewBox="0 0 32 32"
                    >
                      <path
                        className="journey-doodle"
                        d={detail.doodle}
                        pathLength={1}
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="0.7"
                      />
                      <circle cx="25" cy="7" r="1" fill="currentColor" />
                      <circle cx="5" cy="27" r="0.7" fill="currentColor" />
                    </svg>
                    <div className="relative flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
                        <Icon name={detail.icon} className="h-6 w-6" />
                      </span>
                      <span className="font-mono text-sm text-blue-200/70">
                        0{index + 1} / 04
                      </span>
                    </div>
                    <p className="relative mt-8 text-xs font-medium uppercase tracking-[0.15em] text-blue-200">
                      {detail.eyebrow}
                    </p>
                    <h3 className="relative mt-3 max-w-md text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                      {detail.title}
                    </h3>
                    <p className="relative mt-4 max-w-lg text-sm leading-6 text-blue-50/75 sm:text-base sm:leading-7">
                      {detail.description}
                    </p>
                    <p className="relative mt-auto flex items-center gap-2 pt-7 text-sm font-medium text-white">
                      <Icon name="check" className="h-4 w-4 text-emerald-300" />
                      {detail.note}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {/* Desktop: scroll progress. Mobile: swipe hint. */}
            <div
              aria-hidden="true"
              className="mt-6 hidden items-center gap-4 text-xs text-blue-100/70 md:flex"
            >
              <span className="inline-block overflow-hidden font-mono text-sm tabular-nums text-blue-100">
                <span className="journey-count inline-block">01</span>
              </span>
              <span className="relative h-px flex-1 bg-white/15">
                <span
                  className="journey-progress absolute inset-0 bg-blue-200"
                  style={{ transform: "scaleX(0)", transformOrigin: "0% 50%" }}
                />
              </span>
              <span className="font-mono text-sm">04</span>
            </div>
            <div
              aria-hidden="true"
              className="mt-6 flex items-center gap-3 text-xs text-blue-100/70 md:hidden"
            >
              <span className="h-px w-12 bg-blue-200/50" />
              Swipe to explore
              <Icon name="arrow" className="h-4 w-4 rotate-45" />
            </div>
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
              data-split
              id="goals-title"
            >
              Trust is built into the process.
            </h2>
            <p className="reveal-up mt-4 max-w-xl text-base leading-7 text-muted">
              Thoughtful systems can make aid more responsive while keeping
              dignity, transparency and privacy in view.
            </p>

            <div className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
              {goals.map((goal) => (
                <article className="reveal-up flex gap-5" key={goal.title}>
                  <span className="goal-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
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

        <section className="cta-section relative overflow-hidden bg-brand px-5 py-16 text-white sm:px-8 sm:py-20">
          <CtaBurst />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <h2
              className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
              data-split
            >
              Together, we can make the distance to help shorter.
            </h2>
            <a
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3.5 text-sm font-medium text-brand transition-colors hover:bg-brand-tint"
              data-magnetic
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
