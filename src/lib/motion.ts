import { useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import Lenis from "lenis";

/**
 * Single place that registers GSAP plugins and holds the motion toolkit.
 * Import `gsap` / `ScrollTrigger` from here (not from "gsap") so plugins are
 * always registered exactly once.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, MotionPathPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger };

/* -------------------------------------------------------------------------- */
/*  Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays exact  */
/* -------------------------------------------------------------------------- */

let lenisInstance: Lenis | null = null;

/** The active Lenis instance (null when smooth scroll is off, e.g. reduced motion). */
export const getLenis = () => lenisInstance;

/**
 * Starts Lenis and hooks it into GSAP. Returns a cleanup function, so it can be
 * returned straight from a gsap.matchMedia() callback.
 */
export function initSmoothScroll() {
  if (typeof window === "undefined") return () => {};
  lenisInstance?.destroy();

  const lenis = new Lenis({
    lerp: 0.09,
    wheelMultiplier: 0.95,
    smoothWheel: true,
  });
  lenisInstance = lenis;

  // Lenis → ScrollTrigger: every smoothed scroll frame updates triggers
  lenis.on("scroll", ScrollTrigger.update);
  // GSAP ticker → Lenis: one shared render loop (time is in seconds, Lenis wants ms)
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
    if (lenisInstance === lenis) lenisInstance = null;
  };
}

/** Plays tweens only while `trigger` is on screen — keeps endless spinners free when off-screen. */
export function whileVisible(
  trigger: Element | string,
  animations: Array<gsap.core.Animation | undefined | null>,
) {
  const list = animations.filter((animation): animation is gsap.core.Animation => Boolean(animation));
  return ScrollTrigger.create({
    trigger,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => list.forEach((animation) => (self.isActive ? animation.resume() : animation.pause())),
  });
}

/** useLayoutEffect on the client (no flash of un-animated content), useEffect on the server. */
export const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Media queries for gsap.matchMedia(). Every animation lives behind `motion`. */
export const MQ = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 768px)",
  fine: "(hover: hover) and (pointer: fine)",
} as const;

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(MQ.reduce).matches
  );
}

/* -------------------------------------------------------------------------- */
/*  Split text → masked words (the classic gsap.com headline reveal)          */
/* -------------------------------------------------------------------------- */

export type SplitResult = { words: HTMLElement[]; revert: () => void };

/**
 * Wraps every word in an overflow-hidden mask with an inner span you can
 * animate (`yPercent: 110 → 0`). Screen readers get the original text through
 * aria-label; the visual spans are aria-hidden. Call `revert()` to restore.
 */
export function splitWords(el: HTMLElement): SplitResult {
  const original = el.textContent ?? "";
  const label = original.trim().replace(/\s+/g, " ");
  el.setAttribute("aria-label", label);
  el.textContent = "";

  const words: HTMLElement[] = [];
  const parts = label.split(" ");
  parts.forEach((word, index) => {
    const mask = document.createElement("span");
    mask.setAttribute("aria-hidden", "true");
    // Small bottom padding/negative margin keeps descenders (g, y, p) un-clipped.
    mask.style.cssText =
      "display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.14em;margin-bottom:-.14em";

    const inner = document.createElement("span");
    inner.style.cssText = "display:inline-block;will-change:transform";
    inner.textContent = word;

    mask.appendChild(inner);
    el.appendChild(mask);
    if (index < parts.length - 1) el.appendChild(document.createTextNode(" "));
    words.push(inner);
  });

  return {
    words,
    revert: () => {
      el.textContent = original;
      el.removeAttribute("aria-label");
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Magnetic hover                                                            */
/* -------------------------------------------------------------------------- */

export function magnetic(el: HTMLElement, strength = 0.32) {
  const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "elastic.out(1, 0.45)" });
  const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "elastic.out(1, 0.45)" });

  const move = (event: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
    yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
  };
  const leave = () => {
    xTo(0);
    yTo(0);
  };

  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", leave);
    gsap.killTweensOf(el);
    gsap.set(el, { x: 0, y: 0 });
  };
}

/* -------------------------------------------------------------------------- */
/*  Cursor spotlight (needs the `spotlight*` classes below on the host)        */
/* -------------------------------------------------------------------------- */

/** Host must be `relative`. The glow is an ::after layer driven by --mx/--my/--spot. */
export const spotlightBase =
  "relative after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:[opacity:var(--spot,0)]";
export const spotlightDark = `${spotlightBase} after:bg-[radial-gradient(340px_circle_at_var(--mx,50%)_var(--my,50%),rgba(130,165,255,0.16),transparent_70%)]`;
export const spotlightLight = `${spotlightBase} after:bg-[radial-gradient(300px_circle_at_var(--mx,50%)_var(--my,50%),rgba(40,85,199,0.07),transparent_70%)]`;

export function bindSpotlight(hosts: Iterable<HTMLElement>) {
  const cleanups: Array<() => void> = [];
  for (const host of hosts) {
    const move = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      host.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      host.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    const enter = () => gsap.to(host, { "--spot": 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
    const leave = () => gsap.to(host, { "--spot": 0, duration: 0.7, ease: "power2.out", overwrite: "auto" });

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    cleanups.push(() => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(host);
      host.style.removeProperty("--spot");
    });
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}

/* -------------------------------------------------------------------------- */
/*  Number counters                                                           */
/* -------------------------------------------------------------------------- */

const numberTweens = new WeakMap<HTMLElement, gsap.core.Tween>();

/**
 * Tweens an element's text from its last shown value to `to`. Interruptible:
 * a new call continues from wherever the previous tween currently is.
 */
export function tweenNumber(
  el: HTMLElement,
  to: number,
  options: { duration?: number; ease?: string; format?: (value: number) => string } = {},
) {
  const format = options.format ?? ((value: number) => Math.round(value).toLocaleString("en"));
  const from = Number(el.dataset.value ?? to);
  const state = { value: Number.isFinite(from) ? from : to };

  numberTweens.get(el)?.kill();
  const tween = gsap.to(state, {
    value: to,
    duration: options.duration ?? 1.2,
    ease: options.ease ?? "power3.out",
    onUpdate: () => {
      el.dataset.value = String(state.value);
      el.textContent = format(state.value);
    },
    onComplete: () => {
      el.dataset.value = String(to);
      el.textContent = format(to);
    },
  });
  numberTweens.set(el, tween);
  return tween;
}

/* -------------------------------------------------------------------------- */
/*  Anchor scrolling                                                          */
/* -------------------------------------------------------------------------- */

/** Smooth, interruptible scroll to a #hash. Returns false when the hash has no target. */
export function scrollToHash(hash: string, offset = 72) {
  const isTop = hash === "#top" || hash === "#";
  const target = isTop ? null : document.querySelector<HTMLElement>(hash);
  if (!isTop && !target) return false;

  if (prefersReducedMotion()) {
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  } else if (lenisInstance) {
    // Lenis owns the scroll position, so it must perform the scroll too
    lenisInstance.scrollTo(target ?? 0, {
      offset: target ? -offset : 0,
      duration: 1.6,
      easing: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    });
  } else {
    gsap.to(window, {
      scrollTo: { y: target ?? 0, offsetY: target ? offset : 0, autoKill: true },
      duration: 1.4,
      ease: "power4.inOut",
      overwrite: true,
    });
  }
  window.history.pushState(null, "", isTop ? window.location.pathname : hash);
  return true;
}
