"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Icon from "@/components/icon";
import {
  MQ,
  ScrollTrigger,
  bindSpotlight,
  gsap,
  magnetic,
  prefersReducedMotion,
  spotlightDark,
  tweenNumber,
  useIsoLayoutEffect,
} from "@/lib/motion";

type Stats = {
  totalDonatedAed: number;
  donationCount: number;
  averageDonationAed: number;
  pendingPoolAed: number;
  totalDistributedAed: number;
  openNeeds: number;
  flaggedItems: number;
};

type DashboardData = {
  stats: Stats;
  timeseries: { date: string; label: string; amountAed: number }[];
  amountBrackets: { label: string; count: number }[];
  categoryBreakdown: { label: string; amountAed: number }[];
  ngoFunding: { id: string; name: string; amountAed: number }[];
  donations: {
    id: string;
    donor: string;
    email: string;
    amountAed: number;
    status: string;
    createdAt: string;
  }[];
  ngos: {
    id: string;
    name: string;
    country: string;
    verified: boolean;
    refugees: number;
    allocatedAed: number;
    latestRunId: string | null;
  }[];
  refugees: {
    id: string;
    name: string;
    externalId: string;
    ngo: string;
    needs: number;
    openNeeds: number;
    fundedAed: number;
    requestedAed: number;
  }[];
  needs: {
    id: string;
    refugee: string;
    externalId: string;
    ngo: string;
    item: string;
    category: string;
    costAed: number;
    fundedAed: number;
    status: string;
  }[];
  allocations: {
    id: string;
    ngo: string;
    refugee: string;
    externalId: string;
    item: string;
    category: string;
    amountAed: number;
    spentAed: number;
    createdAt: string;
  }[];
  fraudFlags: {
    id: string;
    type: string;
    note: string;
    ngo: string;
    refugee: string;
    externalId: string;
    createdAt: string;
  }[];
};

type FundingResult = {
  runId: string;
  poolAed: number;
  totalDistributedAed: number;
  unallocatedAed: number;
  donationsProcessed: number;
  fundedNeeds: {
    needId: string;
    refugeeExternalId: string;
    refugeeName: string;
    category: string;
    item: string;
    amountAed: number;
    urgencyScore: number;
    fundingOrder: number;
  }[];
};

type TableColumn<Row> = {
  key: keyof Row;
  label: string;
  render?: (row: Row) => ReactNode;
  sortValue?: (row: Row) => string | number;
};

const currency = (amount: number) =>
  `AED ${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(amount)}`;

function formatDate(value: string) {
  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Tag({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "red" | "gray" }) {
  const tones = {
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-200",
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    red: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    gray: "border-white/10 bg-white/5 text-slate-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">{eyebrow}</p>}
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon,
  tone,
  note,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: "heart" | "receipt" | "spark" | "clock" | "arrow" | "people" | "shield";
  tone: string;
  note: string;
}) {
  const numberRef = useRef<HTMLSpanElement>(null);

  // Counts from the last shown value, so live updates roll instead of restarting at 0
  useEffect(() => {
    const element = numberRef.current;
    if (!element) return;
    if (prefersReducedMotion()) {
      element.textContent = Math.round(value).toLocaleString("en");
      element.dataset.value = String(value);
      return;
    }
    tweenNumber(element, value, { duration: 1.2, ease: "power3.out" });
  }, [value]);

  return (
    <article className={`admin-card spot ${spotlightDark} rounded-2xl border border-white/[0.08] bg-[#101c2c] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.12)]`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-5 flex items-baseline gap-1.5 text-2xl font-semibold tracking-tight text-white tabular-nums">
        {prefix}<span ref={numberRef} data-value="0">0</span>{suffix}
      </p>
      <p className="mt-2 text-[11px] text-slate-500">{note}</p>
    </article>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`spot ${spotlightDark} rounded-2xl border border-white/[0.08] bg-[#101c2c] p-5 sm:p-6 ${className}`}>{children}</section>;
}

function LineChart({ data }: { data: DashboardData["timeseries"] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const played = useRef(false);
  const max = Math.max(1, ...data.map((point) => point.amountAed));
  const points = data.map((point, index) => ({
    x: 42 + (index * 646) / Math.max(data.length - 1, 1),
    y: 194 - (point.amountAed / max) * 156,
  }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = points.length > 1 ? `${path} L${points[points.length - 1].x},194 L${points[0].x},194 Z` : "";

  // Draw the line once when data first arrives. Later 5s refreshes just update the path
  // (re-drawing every poll would make the chart flicker).
  useIsoLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || played.current || data.length === 0 || prefersReducedMotion()) return;
    played.current = true;

    const line = svg.querySelector<SVGPathElement>(".line-path");
    const fill = svg.querySelector<SVGPathElement>(".line-area");
    const dots = Array.from(svg.querySelectorAll<SVGCircleElement>(".line-dot"));
    if (!line) return;

    const length = line.getTotalLength();
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(line, { strokeDasharray: length, strokeDashoffset: length }, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: "power2.inOut",
      onComplete: () => { gsap.set(line, { clearProps: "strokeDasharray,strokeDashoffset" }); },
    }, 0);
    if (fill) tl.fromTo(fill, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 0.5);
    tl.from(dots, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: { each: 0.025, from: "start" }, ease: "back.out(2.5)" }, 0.3);
    // If data changes mid-draw, finish the animation rather than leaving a half-drawn line
    return () => { tl.progress(1).kill(); };
  }, [data]);

  return (
    <div className="pt-2">
      <svg aria-label="Donations per day for the last 30 days" className="h-56 w-full overflow-visible" preserveAspectRatio="none" ref={svgRef} role="img" viewBox="0 0 720 230">
        <defs>
          <linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#648cff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#648cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[38, 90, 142, 194].map((y) => <line key={y} x1="42" x2="690" y1={y} y2={y} stroke="#243449" strokeDasharray="3 7" />)}
        {area && <path className="line-area" d={area} fill="url(#line-fill)" />}
        <path className="line-path" d={path} fill="none" stroke="#648cff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {points.map((point, index) => <circle className="line-dot" key={data[index]?.date} cx={point.x} cy={point.y} r="2.5" fill="#a5baff" />)}
        <text fill="#728198" fontSize="10" x="42" y="220">{data[0]?.label}</text>
        <text fill="#728198" fontSize="10" textAnchor="middle" x="366" y="220">{data[14]?.label}</text>
        <text fill="#728198" fontSize="10" textAnchor="end" x="690" y="220">{data.at(-1)?.label}</text>
      </svg>
    </div>
  );
}

function AmountChart({ data }: { data: DashboardData["amountBrackets"] }) {
  const barsRef = useRef<(SVGRectElement | null)[]>([]);
  const max = Math.max(1, ...data.map((item) => item.count));
  // Bars start flat in the markup, so this one `to` handles both the first grow-in and
  // later live changes (bars move from where they are instead of restarting).
  useIsoLayoutEffect(() => {
    const bars = barsRef.current.slice(0, data.length).filter((bar): bar is SVGRectElement => bar !== null);
    if (bars.length === 0) return;
    const target = (index: number) => (data[index].count / max) * 145;
    if (prefersReducedMotion()) {
      bars.forEach((bar, index) => gsap.set(bar, { attr: { y: 190 - target(index), height: target(index) } }));
      return;
    }
    const tween = gsap.to(bars, {
      attr: { y: (index: number) => 190 - target(index), height: target },
      duration: 1,
      stagger: 0.09,
      ease: "expo.out",
      overwrite: "auto",
    });
    return () => { tween.kill(); };
  }, [data, max]);
  return (
    <svg aria-label="Donation counts by amount bracket" className="mt-3 h-56 w-full" role="img" viewBox="0 0 420 230">
      {[45, 93, 141, 190].map((y) => <line key={y} x1="20" x2="410" y1={y} y2={y} stroke="#243449" strokeDasharray="3 7" />)}
      {data.map((item, index) => {
        const x = 35 + index * 76;
        return (
          <g key={item.label}>
            <rect ref={(element) => { barsRef.current[index] = element; }} x={x} y="190" width="38" height="0" rx="5" fill={index === 2 ? "#79a0ff" : "#4f75df"} />
            <text fill="#8b9ab0" fontSize="9" textAnchor="middle" x={x + 19} y="209">{item.label.replace("AED ", "")}</text>
            <text fill="#d8e1f1" fontSize="10" textAnchor="middle" x={x + 19} y="28">{item.count || ""}</text>
          </g>
        );
      })}
    </svg>
  );
}

function CategoryChart({ data }: { data: DashboardData["categoryBreakdown"] }) {
  const segmentsRef = useRef<(SVGCircleElement | null)[]>([]);
  const total = data.reduce((sum, item) => sum + item.amountAed, 0);
  const circumference = 2 * Math.PI * 58;

  const colors = ["#7d9fff", "#4d70d2", "#2f4569"];
  const colorAt = (index: number) => colors[index % colors.length];
  const played = useRef(false);

  // The ring sweeps clockwise once: each segment draws in turn from one shared progress value.
  // Segment geometry is plain dash/offset attributes (offset = -start), so later data
  // updates render correctly straight from React without re-animating.
  useIsoLayoutEffect(() => {
    if (played.current || total <= 0 || prefersReducedMotion()) return;
    const segments = segmentsRef.current.slice(0, data.length).filter((segment): segment is SVGCircleElement => segment !== null);
    if (segments.length === 0) return;
    played.current = true;

    const ratios = data.map((item) => item.amountAed / total);
    const starts = ratios.map((_, index) => ratios.slice(0, index).reduce((sum, value) => sum + value, 0));
    const paint = (progress: number) => {
      segments.forEach((segment, index) => {
        const drawn = Math.min(Math.max(progress - starts[index], 0), ratios[index]);
        segment.setAttribute("stroke-dasharray", `${drawn * circumference} ${circumference}`);
      });
    };

    const sweep = { progress: 0 };
    paint(0);
    const tween = gsap.to(sweep, {
      progress: 1,
      duration: 1.6,
      ease: "power3.inOut",
      onUpdate: () => paint(sweep.progress),
      onComplete: () => paint(1),
    });
    return () => { tween.kill(); paint(1); };
  }, [data, total, circumference]);

  return (
    <div className="flex flex-col items-center gap-5 pt-4 sm:flex-row sm:justify-around">
      <div className="relative h-40 w-40 shrink-0">
        <svg aria-label="Allocated funds by category" className="h-40 w-40 -rotate-90" role="img" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="58" fill="none" stroke="#202e41" strokeWidth="15" />
          {data.map((item, index) => {
            const ratio = item.amountAed / Math.max(total, 1);
            const thisOffset = data.slice(0, index).reduce((sum, segment) => sum + segment.amountAed / Math.max(total, 1), 0);
            return <circle key={item.label} ref={(element) => { segmentsRef.current[index] = element; }} cx="70" cy="70" r="58" fill="none" stroke={colorAt(index)} strokeDasharray={`${circumference * ratio} ${circumference}`} strokeDashoffset={-circumference * thisOffset} strokeWidth="15" />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Allocated</span>
          <span className="mt-1 text-sm font-semibold text-white">{currency(total)}</span>
        </div>
      </div>
      <div className="w-full space-y-3">
        {data.map((item, index) => (
          <div className="flex items-center justify-between gap-3 text-xs" key={item.label}>
            <span className="flex items-center gap-2 text-slate-400"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: colorAt(index) }} />{item.label}</span>
            <span className="font-medium text-slate-200 tabular-nums">{currency(item.amountAed)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NgoFundingChart({ data }: { data: DashboardData["ngoFunding"] }) {
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);
  const max = Math.max(1, ...data.map((item) => item.amountAed));
  // Bars mount at 0% and tween to their share; live updates continue from the current width.
  useIsoLayoutEffect(() => {
    const rows = rowsRef.current.slice(0, Math.min(data.length, 7)).filter((row): row is HTMLDivElement => row !== null);
    if (rows.length === 0) return;
    const width = (index: number) => `${Math.max(3, (data[index].amountAed / max) * 100)}%`;
    if (prefersReducedMotion()) {
      rows.forEach((row, index) => gsap.set(row, { width: width(index) }));
      return;
    }
    const tween = gsap.to(rows, { width, duration: 1.1, stagger: 0.08, ease: "expo.out", overwrite: "auto" });
    return () => { tween.kill(); };
  }, [data, max]);
  return (
    <div className="mt-6 space-y-4">
      {data.slice(0, 7).map((ngo, index) => (
        <div key={ngo.id}>
          <div className="mb-2 flex justify-between gap-3 text-xs">
            <span className="truncate text-slate-300">{ngo.name}</span>
            <span className="shrink-0 text-slate-400 tabular-nums">{currency(ngo.amountAed)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#1c2a3c]">
            <div ref={(element) => { rowsRef.current[index] = element; }} className="h-full rounded-full bg-[#648cff]" style={{ width: "0%" }} />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No allocations have been recorded yet.</p>}
    </div>
  );
}

function SortableTable<Row extends { id: string }>({
  title,
  rows,
  columns,
  searchHint,
}: {
  title: string;
  rows: Row[];
  columns: TableColumn<Row>[];
  searchHint: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof Row>(columns[0].key);
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const filtered = useMemo(() => {
    const text = query.toLowerCase().trim();
    const matching = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(text));
    const column = columns.find((item) => item.key === sortKey);
    return matching.sort((left, right) => {
      const a = column?.sortValue?.(left) ?? left[sortKey];
      const b = column?.sortValue?.(right) ?? right[sortKey];
      const compared = typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""));
      return ascending ? compared : -compared;
    });
  }, [rows, query, sortKey, ascending, columns]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleRows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Two behaviours, keyed on *what changed* rather than on every render (the page re-renders
  // every 5s, which used to replay the row animation constantly):
  //  - the user searched / sorted / paged  → rows cascade in
  //  - live data added rows                → only the new rows flash in
  const rowKey = visibleRows.map((row) => row.id).join("|");
  const control = `${page}|${query}|${String(sortKey)}|${ascending}`;
  const previous = useRef<{ ids: Set<string>; control: string } | null>(null);

  useIsoLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const rowEls = Array.from(body.querySelectorAll<HTMLElement>("tr[data-row]"));
    const last = previous.current;
    previous.current = { ids: new Set(rowEls.map((row) => row.dataset.row ?? "")), control };
    if (rowEls.length === 0 || prefersReducedMotion()) return;

    if (!last || last.control !== control || last.ids.size === 0) {
      const tween = gsap.fromTo(rowEls, { autoAlpha: 0, y: 10 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.045,
        ease: "power3.out",
        clearProps: "opacity,visibility,transform",
      });
      return () => { tween.progress(1).kill(); };
    }

    const fresh = rowEls.filter((row) => !last.ids.has(row.dataset.row ?? ""));
    if (fresh.length === 0) return;
    const tween = gsap.fromTo(fresh, { backgroundColor: "rgba(100,140,255,0.22)" }, {
      backgroundColor: "rgba(100,140,255,0)",
      duration: 2.2,
      ease: "power2.out",
      clearProps: "backgroundColor",
    });
    return () => { tween.progress(1).kill(); };
    // rowKey tracks the visible row IDs without replaying on unrelated parent renders.
  }, [rowKey, control]);

  return (
    <Panel className="admin-table-card min-w-0">
      <SectionTitle title={title} action={
        <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-slate-400">{filtered.length} records</span>
      } />
      <label className="mb-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c1725] px-3 py-2">
        <Icon name="spark" className="h-3.5 w-3.5 text-slate-500" />
        <input aria-label={`Search ${title}`} className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600" onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder={searchHint} value={query} />
      </label>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.12em] text-slate-500">
              {columns.map((column) => (
                <th className="pb-3 pr-4 font-medium" key={String(column.key)}>
                  <button className="whitespace-nowrap hover:text-slate-200" onClick={() => {
                    if (sortKey === column.key) setAscending((value) => !value);
                    else { setSortKey(column.key); setAscending(true); }
                  }} type="button">
                    {column.label}{sortKey === column.key ? (ascending ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {visibleRows.map((row) => (
              <tr className="border-b border-white/[0.05] last:border-0" data-row={row.id} key={row.id}>
                {columns.map((column) => (
                  <td className="max-w-[260px] truncate py-3 pr-4 text-slate-300" key={String(column.key)}>
                    {column.render ? column.render(row) : String(row[column.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {visibleRows.length === 0 && <tr><td className="py-8 text-center text-slate-500" colSpan={columns.length}>No matching records.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>Page {page + 1} of {pageCount}</span>
        <div className="flex gap-2">
          <button className="rounded-md border border-white/10 px-2.5 py-1.5 hover:border-white/25 disabled:opacity-40" disabled={page === 0} onClick={() => setPage((value) => value - 1)} type="button">Previous</button>
          <button className="rounded-md border border-white/10 px-2.5 py-1.5 hover:border-white/25 disabled:opacity-40" disabled={page >= pageCount - 1} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
        </div>
      </div>
    </Panel>
  );
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [busy, setBusy] = useState<"" | "distribution" | "fraud" | "donation" | "pool">("");
  const [notice, setNotice] = useState("");
  const [distribution, setDistribution] = useState<FundingResult | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const distributionRef = useRef<HTMLElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const dataSnapshot = useRef("");
  const hasData = data !== null;

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Dashboard data could not be loaded.");
      const result = await response.json() as DashboardData;
      const snapshot = JSON.stringify(result);
      if (snapshot !== dataSnapshot.current) {
        dataSnapshot.current = snapshot;
        setData(result);
      }
      setError("");
      setLastUpdated(new Date());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(), 0);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  // Page choreography: header drops in, sections rise as they reach the viewport,
  // cards get a cursor spotlight, primary action is magnetic.
  useIsoLayoutEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const $ = <T extends HTMLElement = HTMLElement>(selector: string) => Array.from(root.querySelectorAll<T>(selector));
    const mm = gsap.matchMedia();

    mm.add(MQ.motion, () => {
      gsap.from($(".admin-header"), { yPercent: -100, duration: 1, ease: "expo.out" });

      const sections = $(".admin-entrance");
      gsap.set(sections, { autoAlpha: 0, y: 28 });
      ScrollTrigger.batch(sections, {
        start: "top 94%",
        once: true,
        onEnter: (batch) => gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          stagger: 0.12,
          ease: "expo.out",
          overwrite: true,
          clearProps: "transform",
        }),
      });
    });

    mm.add(`${MQ.motion} and ${MQ.fine}`, () => {
      const unbind = bindSpotlight($(".spot"));
      const magnets = $("[data-magnetic]").map((el) => magnetic(el, 0.25));
      return () => { unbind(); magnets.forEach((cleanup) => cleanup()); };
    });

    return () => mm.revert();
  }, []);

  // Data arrives and fills the page — re-measure scroll positions once
  useEffect(() => {
    if (!hasData) return;
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [hasData]);

  // Distribution result: staggered reveal, plus the funded rows cascade in
  useEffect(() => {
    const section = distributionRef.current;
    if (!distribution || !section || prefersReducedMotion()) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(section, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, clearProps: "transform" })
      .fromTo(section.querySelectorAll(".distribution-result"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.15)
      .fromTo(section.querySelectorAll("tbody tr"), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.05, clearProps: "transform" }, 0.5);
    return () => { tl.progress(1).kill(); };
  }, [distribution]);

  // Notice banner slides in whenever the message changes
  useEffect(() => {
    const element = noticeRef.current;
    if (!notice || !element || prefersReducedMotion()) return;
    const tween = gsap.fromTo(element, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" });
    return () => { tween.progress(1).kill(); };
  }, [notice]);

  const runAction = async (action: "distribution" | "fraud" | "donation" | "pool") => {
    setBusy(action);
    setNotice("");
    try {
      const endpoint = action === "distribution"
        ? "/api/distribute"
        : action === "fraud"
          ? "/api/fraud/scan"
          : action === "pool"
            ? "/api/admin/refresh-pool"
            : "/api/admin/simulate";
      const response = await fetch(endpoint, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The action could not be completed.");
      if (action === "distribution") {
        setDistribution(result as FundingResult);
        setNotice(`${result.fundedNeeds.length} need${result.fundedNeeds.length === 1 ? "" : "s"} funded in urgency order.`);
      } else if (action === "fraud") {
        setNotice(`Fraud scan complete — ${result.createdCount} new flag${result.createdCount === 1 ? "" : "s"} recorded.`);
      } else if (action === "pool") {
        setNotice(`Pending pool refreshed with ${result.addedCount} demo donations totaling ${currency(result.totalAed)}, plus ${result.addedNeedsCount} new demo needs.`);
      } else {
        setNotice(`Demo donation added: ${currency(result.donation.amountAed)}.`);
      }
      await refresh();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "The action could not be completed.");
    } finally {
      setBusy("");
    }
  };

  const columns = useMemo(() => ({
    donations: [
      { key: "donor", label: "Supporter" },
      { key: "email", label: "Email" },
      { key: "amountAed", label: "Amount", render: (row: DashboardData["donations"][number]) => currency(row.amountAed), sortValue: (row: DashboardData["donations"][number]) => row.amountAed },
      { key: "status", label: "Status", render: (row: DashboardData["donations"][number]) => <Tag tone={row.status === "DISTRIBUTED" ? "green" : "amber"}>{row.status}</Tag> },
      { key: "createdAt", label: "Received", render: (row: DashboardData["donations"][number]) => formatDate(row.createdAt), sortValue: (row: DashboardData["donations"][number]) => row.createdAt },
    ] satisfies TableColumn<DashboardData["donations"][number]>[],
    ngos: [
      { key: "name", label: "Organization" },
      { key: "country", label: "Country" },
      { key: "refugees", label: "People", sortValue: (row: DashboardData["ngos"][number]) => row.refugees },
      { key: "allocatedAed", label: "Allocated", render: (row: DashboardData["ngos"][number]) => currency(row.allocatedAed), sortValue: (row: DashboardData["ngos"][number]) => row.allocatedAed },
      { key: "verified", label: "Status", render: (row: DashboardData["ngos"][number]) => <Tag tone={row.verified ? "green" : "amber"}>{row.verified ? "Verified" : "Review"}</Tag> },
      { key: "latestRunId", label: "Export", render: (row: DashboardData["ngos"][number]) => row.latestRunId ? <a className="whitespace-nowrap text-blue-300 hover:text-white" href={`/api/distribution/${row.latestRunId}/ngo/${row.id}/csv`}>Download CSV ↗</a> : <span className="text-slate-600">No run</span> },
    ] satisfies TableColumn<DashboardData["ngos"][number]>[],
    refugees: [
      { key: "name", label: "Person" },
      { key: "externalId", label: "Reference" },
      { key: "ngo", label: "NGO" },
      { key: "openNeeds", label: "Open", sortValue: (row: DashboardData["refugees"][number]) => row.openNeeds },
      { key: "fundedAed", label: "Funded", render: (row: DashboardData["refugees"][number]) => <div className="min-w-[110px]"><div className="mb-1 flex justify-between text-[10px]"><span>{currency(row.fundedAed)}</span><span>{row.requestedAed ? Math.round((row.fundedAed / row.requestedAed) * 100) : 0}%</span></div><div className="h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, row.requestedAed ? (row.fundedAed / row.requestedAed) * 100 : 0)}%` }} /></div></div>, sortValue: (row: DashboardData["refugees"][number]) => row.fundedAed },
    ] satisfies TableColumn<DashboardData["refugees"][number]>[],
    needs: [
      { key: "item", label: "Need" },
      { key: "refugee", label: "Person" },
      { key: "ngo", label: "NGO" },
      { key: "category", label: "Category", render: (row: DashboardData["needs"][number]) => <Tag>{row.category}</Tag> },
      { key: "fundedAed", label: "Progress", render: (row: DashboardData["needs"][number]) => <div className="min-w-[110px]"><div className="mb-1 flex justify-between text-[10px]"><span>{currency(row.fundedAed)}</span><span>{row.costAed ? Math.round((row.fundedAed / row.costAed) * 100) : 0}%</span></div><div className="h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-blue-400" style={{ width: `${Math.min(100, row.costAed ? (row.fundedAed / row.costAed) * 100 : 0)}%` }} /></div></div>, sortValue: (row: DashboardData["needs"][number]) => row.fundedAed },
      { key: "status", label: "State", render: (row: DashboardData["needs"][number]) => <Tag tone={row.status === "FUNDED" ? "green" : "amber"}>{row.status}</Tag> },
    ] satisfies TableColumn<DashboardData["needs"][number]>[],
    allocations: [
      { key: "ngo", label: "NGO" },
      { key: "refugee", label: "Person" },
      { key: "item", label: "Need" },
      { key: "category", label: "Category" },
      { key: "amountAed", label: "Allocated", render: (row: DashboardData["allocations"][number]) => currency(row.amountAed), sortValue: (row: DashboardData["allocations"][number]) => row.amountAed },
      { key: "spentAed", label: "Spent", render: (row: DashboardData["allocations"][number]) => currency(row.spentAed), sortValue: (row: DashboardData["allocations"][number]) => row.spentAed },
    ] satisfies TableColumn<DashboardData["allocations"][number]>[],
    flags: [
      { key: "type", label: "Signal", render: (row: DashboardData["fraudFlags"][number]) => <Tag tone={row.type === "NO_PROOF_OF_SPEND" || row.type === "NO_PROOF_OF_NEED" ? "red" : "amber"}>{row.type.replaceAll("_", " ")}</Tag> },
      { key: "note", label: "Details" },
      { key: "ngo", label: "NGO" },
      { key: "refugee", label: "Person" },
      { key: "createdAt", label: "Detected", render: (row: DashboardData["fraudFlags"][number]) => formatDate(row.createdAt), sortValue: (row: DashboardData["fraudFlags"][number]) => row.createdAt },
    ] satisfies TableColumn<DashboardData["fraudFlags"][number]>[],
  }), []);

  return (
    <main className="min-h-screen bg-[#08111d] text-slate-100" ref={pageRef}>
      <header className="admin-header sticky top-0 z-30 border-b border-white/[0.07] bg-[#08111d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2855c7] text-white"><Icon name="bridge" className="h-5 w-5" /></span>
            <span><span className="block text-sm font-semibold tracking-tight text-white">RefuBridge</span><span className="block text-[9px] font-bold uppercase tracking-[0.19em] text-slate-500">Operations control room</span></span>
          </Link>
          <nav className="hidden items-center gap-6 text-xs text-slate-400 lg:flex">
            <a className="hover:text-white" href="#overview">Overview</a><a className="hover:text-white" href="#analytics">Analytics</a><a className="hover:text-white" href="#records">Records</a><a className="hover:text-white" href="#risk">Risk signals</a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-[10px] text-slate-500 sm:flex"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />LIVE · 5 SEC</span>
            <Link className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-slate-300 hover:border-white/30 hover:text-white" href="/">Exit dashboard</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 pb-16 pt-8 sm:px-8 lg:pt-10" suppressHydrationWarning>
        <div className="admin-entrance mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300"><span className="h-px w-5 bg-blue-400" />Platform overview</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Good work, in motion.</h1>
            <p className="mt-2 text-sm text-slate-400">A live view of donations, needs, and how relief is reaching people.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-2.5 text-xs font-medium text-emerald-200 hover:border-emerald-300/40 disabled:opacity-50"
              disabled={Boolean(busy)}
              onClick={() => {
                if (window.confirm("Replace all currently pending donations with 25 fictional presentation donations totaling AED 25,000?")) {
                  void runAction("pool");
                }
              }}
              title="Replace the pending pool with 25 demo donations totaling AED 25,000."
              type="button"
            >
              <Icon name="spark" className="h-4 w-4" />{busy === "pool" ? "Refreshing pool…" : "Refresh demo pool · AED 25k"}
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#101c2c] px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-white/25 disabled:opacity-50" disabled={Boolean(busy)} onClick={() => void runAction("donation")} type="button">
              <Icon name="heart" className="h-4 w-4 text-blue-300" />{busy === "donation" ? "Adding donation…" : "Simulate donation"}
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#101c2c] px-4 py-2.5 text-xs font-medium text-slate-200 hover:border-white/25 disabled:opacity-50" disabled={Boolean(busy)} onClick={() => void runAction("fraud")} type="button">
              <Icon name="shield" className="h-4 w-4 text-amber-300" />{busy === "fraud" ? "Scanning…" : "Run fraud scan"}
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#315fda] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(49,95,218,0.22)] hover:bg-[#416fe9] disabled:opacity-50" data-magnetic disabled={Boolean(busy)} onClick={() => void runAction("distribution")} type="button">
              <Icon name="spark" className="h-4 w-4" />{busy === "distribution" ? "Distributing…" : "Run End-of-Day Distribution"}
            </button>
          </div>
        </div>

        {notice && <div className={`mb-5 rounded-xl border px-4 py-3 text-xs ${notice.includes("could not") || notice.includes("Unable") ? "border-rose-400/20 bg-rose-400/5 text-rose-200" : "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"}`} ref={noticeRef} role="status">{notice}</div>}
        {error && <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-xs text-rose-200" role="alert">{error} <button className="ml-3 underline" onClick={() => void refresh()} type="button">Retry</button></div>}

        {distribution && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-blue-400/20 bg-[#101c2c]" ref={distributionRef}>
            <div className="distribution-result flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">Distribution complete</p><h2 className="mt-1 text-lg font-semibold text-white">Urgency-led funding order</h2></div>
              <Tag tone="green">{distribution.fundedNeeds.length} needs funded</Tag>
            </div>
            <div className="distribution-result grid gap-3 border-b border-white/[0.07] p-5 sm:grid-cols-3 sm:px-6">
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Pool before</p><p className="mt-1 text-lg font-semibold text-white">{currency(distribution.poolAed)}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Distributed</p><p className="mt-1 text-lg font-semibold text-emerald-300">{currency(distribution.totalDistributedAed)}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Pool remaining</p><p className="mt-1 text-lg font-semibold text-white">{currency(distribution.unallocatedAed)}</p></div>
            </div>
            <div className="distribution-result overflow-x-auto p-5 sm:px-6">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead><tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-slate-500"><th className="pb-3 pr-4">Order / urgency</th><th className="pb-3 pr-4">Need / person</th><th className="pb-3 pr-4">Category</th><th className="pb-3 text-right">Funded</th></tr></thead>
                <tbody>{distribution.fundedNeeds.map((need) => <tr className="border-b border-white/[0.05] last:border-0" key={need.needId}><td className="py-3 pr-4 text-blue-200">#{need.fundingOrder} <span className="ml-1 text-slate-500">score {need.urgencyScore.toFixed(3)}</span></td><td className="py-3 pr-4"><span className="text-slate-200">{need.item}</span><span className="ml-2 text-slate-500">{need.refugeeName}</span></td><td className="py-3 pr-4 text-slate-400">{need.category}</td><td className="py-3 text-right font-medium text-white">{currency(need.amountAed)}</td></tr>)}</tbody>
              </table>
              {distribution.fundedNeeds.length === 0 && <p className="py-5 text-xs text-slate-500">No needs were funded during this run.</p>}
            </div>
          </section>
        )}

        <section className="admin-entrance" id="overview">
          <SectionTitle eyebrow="At a glance" title="Impact metrics" action={<span className="text-[10px] text-slate-500">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : loading ? "Connecting…" : "Waiting for data"}</span>} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon="heart" label="Total donated" note="All contributions received" prefix="AED " value={data?.stats.totalDonatedAed ?? 0} tone="bg-blue-400/10 text-blue-300" />
            <MetricCard icon="receipt" label="Donation count" note="Recorded contributions" value={data?.stats.donationCount ?? 0} tone="bg-indigo-400/10 text-indigo-300" />
            <MetricCard icon="spark" label="Average donation" note="Across all contributions" prefix="AED " value={data?.stats.averageDonationAed ?? 0} tone="bg-violet-400/10 text-violet-300" />
            <MetricCard icon="clock" label="Pending pool" note="Available for distribution" prefix="AED " value={data?.stats.pendingPoolAed ?? 0} tone="bg-amber-400/10 text-amber-300" />
            <MetricCard icon="arrow" label="Total distributed" note="Donations marked distributed" prefix="AED " value={data?.stats.totalDistributedAed ?? 0} tone="bg-emerald-400/10 text-emerald-300" />
            <MetricCard icon="people" label="Open needs" note="Awaiting funding" value={data?.stats.openNeeds ?? 0} tone="bg-cyan-400/10 text-cyan-300" />
            <MetricCard icon="shield" label="Flagged items" note="Signals requiring review" value={data?.stats.flaggedItems ?? 0} tone="bg-rose-400/10 text-rose-300" />
            <article className="admin-card flex flex-col justify-between rounded-2xl border border-blue-400/15 bg-gradient-to-br from-[#142747] to-[#101c2c] p-5">
              <p className="text-xs font-medium text-blue-100">End-of-day operations</p>
              <p className="mt-4 text-sm leading-6 text-slate-300">Prioritize verified needs by urgency, then distribute the available pool.</p>
              <button className="mt-4 self-start text-xs font-semibold text-blue-300 hover:text-white" onClick={() => void runAction("distribution")} type="button">Start distribution ↗</button>
            </article>
          </div>
        </section>

        <section className="admin-entrance mt-10" id="analytics">
          <SectionTitle eyebrow="Giving patterns" title="Funding analytics" />
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Panel><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-white">Donations over time</p><p className="mt-1 text-[11px] text-slate-500">Daily amount received · last 30 days</p></div><Tag>30 DAYS</Tag></div><LineChart data={data?.timeseries ?? []} /></Panel>
            <Panel><p className="text-sm font-semibold text-white">Amount brackets</p><p className="mt-1 text-[11px] text-slate-500">Recent donation distribution</p><AmountChart data={data?.amountBrackets ?? []} /></Panel>
            <Panel><p className="text-sm font-semibold text-white">Funds allocated by category</p><p className="mt-1 text-[11px] text-slate-500">Allocation value across relief needs</p><CategoryChart data={data?.categoryBreakdown ?? []} /></Panel>
            <Panel><p className="text-sm font-semibold text-white">Funds per NGO</p><p className="mt-1 text-[11px] text-slate-500">All-time allocation totals</p><NgoFundingChart data={data?.ngoFunding ?? []} /></Panel>
          </div>
        </section>

        <section className="admin-entrance mt-10 space-y-4" id="records">
          <SectionTitle eyebrow="Operations ledger" title="People, partners & transactions" />
          <SortableTable columns={columns.donations} rows={data?.donations ?? []} searchHint="Search supporter, email, status…" title="Recent donations" />
          <SortableTable columns={columns.ngos} rows={data?.ngos ?? []} searchHint="Search organization or country…" title="NGO partners" />
          <SortableTable columns={columns.refugees} rows={data?.refugees ?? []} searchHint="Search name, NGO or reference…" title="Refugees & funded progress" />
          <SortableTable columns={columns.needs} rows={data?.needs ?? []} searchHint="Search need, person or category…" title="Open and funded needs" />
          <SortableTable columns={columns.allocations} rows={data?.allocations ?? []} searchHint="Search NGO, person or need…" title="Recent allocations" />
        </section>

        <section className="admin-entrance mt-10" id="risk">
          <SectionTitle eyebrow="Accountability" title="Fraud & review signals" action={<button className="rounded-lg border border-amber-300/15 bg-amber-300/5 px-3 py-2 text-[11px] font-medium text-amber-200 hover:bg-amber-300/10 disabled:opacity-50" disabled={Boolean(busy)} onClick={() => void runAction("fraud")} type="button">{busy === "fraud" ? "Scanning…" : "Run fraud scan"}</button>} />
          <SortableTable columns={columns.flags} rows={data?.fraudFlags ?? []} searchHint="Search signal, NGO, person…" title="Flagged items" />
        </section>

        <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-5 text-[10px] text-slate-600 sm:flex-row">
          <span>REFUBRIDGE · OPERATIONS CONSOLE</span><span>Live updates pause while this tab is in the background.</span>
        </footer>
      </div>
    </main>
  );
}
