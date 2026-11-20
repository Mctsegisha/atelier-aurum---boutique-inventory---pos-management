import React from 'react';

// ─── Primitive skeleton bar ───────────────────────────────────────────────────
interface SkeletonBarProps {
  className?: string;
}
export function SkeletonBar({ className = '' }: SkeletonBarProps) {
  return (
    <div
      className={`animate-pulse bg-gray-100 rounded-md ${className}`}
      aria-hidden="true"
    />
  );
}

// ─── KPI card skeleton (matches p-5 card style) ───────────────────────────────
interface SkeletonKpiCardProps {
  className?: string;
}
export function SkeletonKpiCard({ className = '' }: SkeletonKpiCardProps) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-5 space-y-3 ${className}`} aria-hidden="true">
      <SkeletonBar className="h-3 w-24" />
      <SkeletonBar className="h-7 w-36" />
    </div>
  );
}

// ─── Table row skeletons ──────────────────────────────────────────────────────
interface SkeletonTableRowsProps {
  cols?: number;
  rows?: number;
}
export function SkeletonTableRows({ cols = 5, rows = 6 }: SkeletonTableRowsProps) {
  const widths = ['w-32', 'w-24', 'w-28', 'w-20', 'w-16', 'w-20', 'w-24', 'w-16'];
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-gray-100 last:border-0">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="py-3.5 px-4">
              <SkeletonBar className={`h-3 ${widths[colIdx % widths.length]}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Customer card grid skeleton ─────────────────────────────────────────────
export function SkeletonCustomerCards({ cards = 6 }: { cards?: number }) {
  return (
    <>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3" aria-hidden="true">
          <div className="flex items-center gap-3">
            <SkeletonBar className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <SkeletonBar className="h-3 w-28" />
              <SkeletonBar className="h-2.5 w-20" />
            </div>
          </div>
          <SkeletonBar className="h-2.5 w-full" />
          <SkeletonBar className="h-2.5 w-3/4" />
        </div>
      ))}
    </>
  );
}

// ─── Dashboard skeleton (KPI cards + chart placeholder) ──────────────────────
export function SkeletonDashboard() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </div>
      {/* Two valuation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <SkeletonBar className="h-3 w-28" />
            <SkeletonBar className="h-6 w-20" />
          </div>
        ))}
      </div>
      {/* Chart + side chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <SkeletonBar className="h-3 w-36" />
          <SkeletonBar className="h-48 w-full rounded-lg" />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <SkeletonBar className="h-3 w-28" />
          <SkeletonBar className="h-48 w-full rounded-lg" />
        </div>
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reports content area skeleton ───────────────────────────────────────────
export function SkeletonReportContent() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* KPI cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonKpiCard key={i} />
        ))}
      </div>
      {/* Chart area */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-56 w-full rounded-lg" />
      </div>
      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <tbody>
            <SkeletonTableRows cols={6} rows={5} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
