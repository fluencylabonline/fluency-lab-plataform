"use client";

import { Shimmer } from "@shimmer-from-structure/react";

export default function ScheduleLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <header className="header-layout sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex flex-col items-start gap-1">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1" />
        </div>
        <div className="flex items-center gap-2">
          {/* Mock Header Actions (buttons for mobile layout) */}
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse md:hidden" />
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse md:hidden" />
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse md:hidden" />
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse md:hidden" />
        </div>
      </header>

      <main className="px-4 pb-10 pt-4">
        <Shimmer loading={true}>
          <div className="card p-4 md:p-6 w-full flex flex-col gap-6">
            {/* Calendar Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Month/Year selector */}
              <div className="h-6 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
              {/* View options / Actions */}
              <div className="flex items-center gap-2">
                <div className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
              {/* Additional Action buttons (desktop only) */}
              <div className="hidden md:flex items-center gap-2">
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
            </div>

            {/* Calendar Grid Weekdays */}
            <div className="grid grid-cols-7 gap-2 text-center pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto w-12" />
              ))}
            </div>

            {/* Calendar Grid Days (5 rows x 7 cols) */}
            <div className="grid grid-cols-7 gap-2 min-h-[500px]">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-zinc-100 dark:border-zinc-800/50 rounded-md p-2 flex flex-col justify-between h-[85px] md:h-[110px]"
                >
                  <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  {/* Simulate events in a few cells */}
                  {(i === 9 || i === 13 || i === 20 || i === 27) && (
                    <div className="space-y-1 mt-auto">
                      <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Shimmer>
      </main>
    </div>
  );
}
