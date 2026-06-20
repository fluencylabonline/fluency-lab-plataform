"use client";

import { Shimmer } from "@shimmer-from-structure/react";

export default function ScheduleLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <header className="header-layout sticky top-0 z-40 flex h-12 w-full items-center justify-between px-4 md:px-6">
        <div className="w-1/4 sm:w-1/3" />
        <div className="flex w-2/4 sm:w-1/3 justify-center items-center">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex w-3/4 sm:w-1/3 items-center justify-end gap-2">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="container py-4">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Column 1: Calendar Skeleton (Desktop & Mobile) */}
          <div className="order-2 lg:order-1">
            <Shimmer loading={true}>
              <div className="card p-4 md:p-6 w-full flex flex-col gap-6">
                {/* Calendar Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="h-6 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="h-9 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="h-9 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="h-9 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  </div>
                </div>

                {/* Calendar Grid Weekdays */}
                <div className="grid grid-cols-7 gap-2 text-center pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto w-12" />
                  ))}
                </div>

                {/* Calendar Grid Days (5 rows x 7 cols) */}
                <div className="grid grid-cols-7 gap-2 min-h-[400px]">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-zinc-100 dark:border-zinc-800/50 rounded-md p-2 flex flex-col justify-between h-[80px] md:h-[100px]"
                    >
                      <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      {/* Simulate an event in a couple of cells */}
                      {(i === 8 || i === 14 || i === 22) && (
                        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded mt-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Shimmer>
          </div>

          {/* Column 2: Credits Summary (Desktop only) */}
          <div className="hidden lg:flex flex-col gap-6 order-1 lg:order-2">
            <Shimmer loading={true}>
              <div className="flex flex-col gap-4">
                {/* Credits Balance Card */}
                <div className="card p-4">
                  <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                          <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        </div>
                        <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reschedule Quota Card */}
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
            </Shimmer>
          </div>
        </div>
      </main>
    </div>
  );
}
