/**
 * Decorative SVGs. Pure markup: every animation is wired up in landing-page.tsx
 * through the class names below (ring-a, flow-path, burst-rays, …).
 */

/* Hero, bottom-left: counter-rotating rings plus an arch with a dot travelling along it */
export function HeroRings() {
  return (
    <svg
      aria-hidden="true"
      className="hero-rings pointer-events-none absolute -bottom-28 -left-28 hidden h-[26rem] w-[26rem] text-brand/20 lg:block"
      fill="none"
      viewBox="0 0 200 200"
    >
      <g className="ring-a">
        <circle cx="100" cy="100" r="92" stroke="currentColor" strokeDasharray="1 9" strokeLinecap="round" strokeWidth="1.5" />
      </g>
      <g className="ring-b">
        <circle cx="100" cy="100" r="72" stroke="currentColor" strokeDasharray="14 8 2 8" strokeWidth="1.2" />
        <circle cx="100" cy="28" r="3.5" fill="currentColor" />
      </g>
      <g className="ring-c">
        <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="1" />
        <circle cx="100" cy="50" r="3" fill="currentColor" />
        <circle cx="143.3" cy="125" r="3" fill="currentColor" />
        <circle cx="56.7" cy="125" r="3" fill="currentColor" />
      </g>
      <path
        className="bridge-path"
        d="M30 140C60 70 140 70 170 140"
        pathLength={1}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <circle className="bridge-dot" cx="0" cy="0" fill="currentColor" r="4" />
      <path
        className="hero-rings-spark"
        d="m100 90 2.6 7.4 7.4 2.6-7.4 2.6-2.6 7.4-2.6-7.4L90 100l7.4-2.6L100 90Z"
        fill="currentColor"
      />
    </svg>
  );
}

type SparkKind = "spark" | "plus" | "ring" | "diamond" | "triangle" | "squiggle";

const sparks: Array<{
  left: string;
  top: string;
  depth: number;
  size: number;
  kind: SparkKind;
  spin: number; // seconds per revolution; negative = counter-clockwise; 0 = none
}> = [
  { left: "6%", top: "20%", depth: 0.7, size: 28, kind: "spark", spin: 18 },
  { left: "47%", top: "10%", depth: 1.2, size: 18, kind: "plus", spin: -14 },
  { left: "57%", top: "80%", depth: 0.9, size: 34, kind: "ring", spin: 26 },
  { left: "91%", top: "58%", depth: 1.5, size: 26, kind: "diamond", spin: -20 },
  { left: "28%", top: "90%", depth: 0.8, size: 56, kind: "squiggle", spin: 0 },
  { left: "74%", top: "8%", depth: 0.6, size: 22, kind: "triangle", spin: 22 },
];

function SparkShape({ kind }: { kind: SparkKind }) {
  switch (kind) {
    case "spark":
      return <path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z" fill="currentColor" />;
    case "plus":
      return <path d="M12 4v16M4 12h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />;
    case "ring":
      return <circle cx="12" cy="12" r="8" stroke="currentColor" strokeDasharray="2 4" strokeLinecap="round" strokeWidth="1.6" />;
    case "diamond":
      return <path d="M12 3l9 9-9 9-9-9 9-9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />;
    case "triangle":
      return <path d="M12 4 21 20H3L12 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />;
    case "squiggle":
      return (
        <path
          className="squiggle-path"
          d="M2 12q5.5-10 11 0t11 0 11 0 11 0"
          stroke="currentColor"
          strokeDasharray="3 4"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      );
  }
}

/* Hero: floating shapes that drift, spin and follow the pointer at different depths */
export function HeroSparks() {
  return (
    <div aria-hidden="true" className="hero-sparks pointer-events-none absolute inset-0 hidden lg:block">
      {sparks.map((item, index) => {
        const wide = item.kind === "squiggle";
        return (
          <span
            className="spark absolute"
            data-depth={item.depth}
            key={index}
            style={{ left: item.left, top: item.top }}
          >
            <span className="spark-float block">
              <svg
                className="text-brand/25"
                data-spin={item.spin}
                fill="none"
                height={item.size}
                viewBox={wide ? "0 0 48 24" : "0 0 24 24"}
                width={wide ? item.size * 2 : item.size}
              >
                <SparkShape kind={item.kind} />
              </svg>
            </span>
          </span>
        );
      })}
    </div>
  );
}

/* Process: a winding path that draws as you scroll the steps, with a dot riding along it */
const FLOW_D =
  "M30 20C30 70 200 60 200 110C200 160 30 150 30 200C30 250 200 240 200 290";
const FLOW_NODES = [
  { x: 30, y: 20, label: "01", anchor: "start" as const, dx: 18 },
  { x: 200, y: 110, label: "02", anchor: "end" as const, dx: -18 },
  { x: 30, y: 200, label: "03", anchor: "start" as const, dx: 18 },
  { x: 200, y: 290, label: "04", anchor: "end" as const, dx: -18 },
];

export function ProcessFlow() {
  return (
    <svg
      aria-hidden="true"
      className="process-flow mt-12 hidden h-auto w-56 text-brand lg:block"
      fill="none"
      viewBox="0 0 240 310"
    >
      <path d={FLOW_D} stroke="currentColor" strokeDasharray="2 7" strokeLinecap="round" strokeOpacity=".22" strokeWidth="1.5" />
      <path className="flow-path" d={FLOW_D} pathLength={1} stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      {FLOW_NODES.map((node) => (
        <g key={node.label}>
          <circle cx={node.x} cy={node.y} fill="white" r="10" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" />
          <circle className="flow-core" cx={node.x} cy={node.y} fill="currentColor" r="5" />
          <text fill="currentColor" fontFamily="ui-monospace, monospace" fontSize="10" opacity=".6" textAnchor={node.anchor} x={node.x + node.dx} y={node.y + 3.5}>
            {node.label}
          </text>
        </g>
      ))}
      <circle className="flow-dot" cx="0" cy="0" fill="currentColor" r="5.5" />
    </svg>
  );
}

/* Journey: big engraved rings that turn with the horizontal scroll */
export function JourneyBackdrop() {
  return (
    <svg
      aria-hidden="true"
      className="journey-backdrop pointer-events-none absolute -right-48 top-1/2 z-0 hidden h-[46rem] w-[46rem] -translate-y-1/2 text-blue-200/[0.1] md:block"
      fill="none"
      viewBox="0 0 400 400"
    >
      <g className="jb-a">
        <circle cx="200" cy="200" r="192" stroke="currentColor" strokeDasharray="2 12" strokeLinecap="round" strokeWidth="1.5" />
      </g>
      <g className="jb-b">
        <circle cx="200" cy="200" r="160" stroke="currentColor" strokeDasharray="1.5 15" strokeWidth="14" />
      </g>
      <g className="jb-c">
        <circle cx="200" cy="200" r="122" stroke="currentColor" strokeDasharray="60 18" strokeWidth="1.5" />
        <circle cx="200" cy="78" r="5" fill="currentColor" />
        <circle cx="306" cy="261" r="5" fill="currentColor" />
        <circle cx="94" cy="261" r="5" fill="currentColor" />
      </g>
      <g className="jb-d">
        {Array.from({ length: 12 }, (_, index) => (
          <path d="M200 118v26" key={index} stroke="currentColor" strokeLinecap="round" strokeWidth="2" transform={`rotate(${index * 30} 200 200)`} />
        ))}
      </g>
      <path className="jb-spark" d="m200 176 5 19 19 5-19 5-5 19-5-19-19-5 19-5 5-19Z" fill="currentColor" />
    </svg>
  );
}

/* CTA: a sunburst whose rays ripple while the whole thing turns with the page */
export function CtaBurst() {
  return (
    <svg
      aria-hidden="true"
      className="cta-burst pointer-events-none absolute -right-28 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 text-white/[0.14]"
      fill="none"
      viewBox="0 0 200 200"
    >
      <g className="burst-rays">
        {Array.from({ length: 16 }, (_, index) => (
          <path
            className="burst-ray"
            d={`M100 8v${index % 2 ? 20 : 34}`}
            key={index}
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            transform={`rotate(${index * 22.5} 100 100)`}
          />
        ))}
      </g>
      <g className="burst-ring">
        <circle cx="100" cy="100" r="64" stroke="currentColor" strokeDasharray="3 8" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="100" cy="36" r="3.5" fill="currentColor" />
      </g>
      <circle className="burst-core" cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
