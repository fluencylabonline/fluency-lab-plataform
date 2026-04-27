"use client";

import React from "react";

/** Label → value row separated by thin border-b */
export function DataRow({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-border/50 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground shrink-0">
        {label}
      </span>
      <span className={`text-right text-xs font-semibold text-foreground/90 ${mono ? "font-mono" : ""}`}>
        {children}
      </span>
    </div>
  );
}

/** Thin horizontal section label */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-4 w-1 bg-primary/40 rounded-full" />
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/** Stat block used inside bordered grids */
export function StatBlock({
  label,
  value,
  accent = false,
  green = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  green?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 p-5 transition-colors ${accent || green ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-muted/30"
        }`}
    >
      <span
        className={`text-[9px] font-black uppercase tracking-[0.25em] ${green ? "text-green-600" : accent ? "text-primary" : "text-muted-foreground"
          }`}
      >
        {label}
      </span>
      <span
        className={`text-xl font-black tracking-tight leading-none ${green ? "text-green-600" : accent ? "text-primary" : "text-foreground"
          }`}
      >
        {value}
      </span>
    </div>
  );
}
