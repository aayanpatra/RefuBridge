import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "bridge"
  | "check"
  | "clock"
  | "copy"
  | "food"
  | "health"
  | "heart"
  | "home"
  | "lock"
  | "menu"
  | "people"
  | "receipt"
  | "shield"
  | "spark"
  | "close";

const iconShapes: Record<IconName, ReactNode> = {
  arrow: (
    <>
      <path d="M7 17 17 7M7 7h10v10" />
    </>
  ),
  bridge: (
    <>
      <path d="M3 19V9c4.5 0 5.5 6 9 6s4.5-6 9-6v10" />
      <path d="M2 19h20M6 19v-3m6 3v-4m6 4v-3" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </>
  ),
  food: (
    <>
      <path d="M3 11h18a9 9 0 0 1-18 0Z" />
      <path d="M5 11h14M7 3v4m5-4v4m5-4v4" />
    </>
  ),
  health: (
    <>
      <path d="M12 3v18M3 12h18" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  heart: (
    <>
      <path d="M20.8 8.6c0 5.4-8.8 11-8.8 11s-8.8-5.6-8.8-11a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.9m-1-12a4 4 0 0 1 0 7.8" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v18l-3-2-4 2-4-2-3 2Z" />
      <path d="M9 8h6m-6 4h6m-6 4h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
};

export default function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {iconShapes[name]}
    </svg>
  );
}
