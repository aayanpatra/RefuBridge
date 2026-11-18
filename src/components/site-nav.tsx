"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/icon";

const navLinks = [
  { href: "#problem", label: "The challenge" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#goals", label: "Our goals" },
  { href: "#impact", label: "Live impact" },
];

export default function SiteNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 8);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-colors duration-200 ${
        isScrolled || isMenuOpen ? "border-line" : "border-transparent"
      }`}
    >
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
        >
          {navLinks.map((link) => (
            <a
              className="rounded-lg px-3 py-3 text-sm text-muted transition-colors hover:text-ink md:px-0 md:py-2"
              href={link.href}
              key={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
          <a
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark md:mt-0"
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
