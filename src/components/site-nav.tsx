"use client";

import { useRef, useState } from "react";
import Icon from "@/components/icon";
import { MQ, ScrollTrigger, gsap, useIsoLayoutEffect } from "@/lib/motion";

const navLinks = [
  { href: "#problem", label: "The challenge" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#goals", label: "Our goals" },
  { href: "#impact", label: "Live impact" },
];

export default function SiteNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [active, setActive] = useState("");

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const menuOpenRef = useRef(false);

  // Scroll progress, scrolled state and active-section tracking.
  // These are UI state rather than decoration, so they run regardless of motion preference.
  useIsoLayoutEffect(() => {
    const header = headerRef.current;
    const bar = progressRef.current;
    if (!header || !bar) return;

    const setProgress = gsap.quickSetter(bar, "scaleX");
    const mm = gsap.matchMedia();
    const cleanups: Array<() => void> = [];

    const page = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        setProgress(self.progress);
        setIsScrolled(self.scroll() > 8);
      },
    });
    cleanups.push(() => page.kill());

    // Active link follows the section in view
    navLinks.forEach((link) => {
      const target = document.querySelector<HTMLElement>(link.href);
      if (!target) return;
      const trigger = ScrollTrigger.create({
        trigger: target,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive) setActive(link.href);
          else setActive((current) => (current === link.href ? "" : current));
        },
      });
      cleanups.push(() => trigger.kill());
    });

    // Hide on scroll down, reveal on scroll up (motion-safe only)
    mm.add(MQ.motion, () => {
      let hidden = false;
      const toggle = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const shouldHide =
            self.direction === 1 && self.scroll() > 240 && !menuOpenRef.current;
          if (shouldHide === hidden) return;
          hidden = shouldHide;
          gsap.to(header, {
            yPercent: shouldHide ? -100 : 0,
            duration: 0.55,
            ease: "power3.out",
            overwrite: "auto",
          });
        },
      });
      // Keyboard users tabbing into a hidden header should always see it
      const reveal = () => {
        hidden = false;
        gsap.to(header, { yPercent: 0, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      };
      header.addEventListener("focusin", reveal);
      return () => {
        header.removeEventListener("focusin", reveal);
        toggle.kill();
        gsap.set(header, { clearProps: "transform" });
      };
    });

    return () => {
      mm.revert();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  // Mobile menu: links cascade in
  useIsoLayoutEffect(() => {
    menuOpenRef.current = isMenuOpen;
    const nav = navRef.current;
    if (!isMenuOpen || !nav) return;

    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      gsap.fromTo(
        nav.children,
        { autoAlpha: 0, y: -14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
        },
      );
    });
    return () => mm.revert();
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-colors duration-200 ${
        isScrolled || isMenuOpen ? "border-line" : "border-transparent"
      }`}
      ref={headerRef}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px] bg-brand"
        ref={progressRef}
        style={{ transform: "scaleX(0)", transformOrigin: "0% 50%" }}
      />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          aria-label="RefuBridge home"
          className="flex items-center gap-2.5 text-ink"
          href="#top"
          onClick={closeMenu}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <Icon name="bridge" className="h-5 w-5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            RefuBridge
          </span>
        </a>

        <button
          aria-controls="primary-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink transition hover:bg-surface md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <Icon name={isMenuOpen ? "close" : "menu"} />
        </button>

        <nav
          aria-label="Main navigation"
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } absolute left-0 right-0 top-16 flex-col gap-1 border-b border-line bg-white px-5 pb-5 pt-2 md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0`}
          id="primary-navigation"
          ref={navRef}
        >
          {navLinks.map((link) => (
            <a
              aria-current={active === link.href ? "true" : undefined}
              className={`rounded-lg px-3 py-3 text-sm transition-colors hover:text-ink md:px-0 md:py-2 ${
                active === link.href ? "text-ink" : "text-muted"
              }`}
              href={link.href}
              key={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
          <a
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark md:mt-0"
            data-magnetic
            href="#donate"
            onClick={closeMenu}
          >
            Make a donation
          </a>
        </nav>
      </div>
    </header>
  );
}
