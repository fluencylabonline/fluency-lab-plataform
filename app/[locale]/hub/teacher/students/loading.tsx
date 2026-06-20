"use client";

import { Shimmer } from "@shimmer-from-structure/react";

export default function StudentsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <header className="header-layout sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex flex-col items-start gap-1">
          <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3.5 w-60 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1" />
        </div>
        <div className="flex items-center gap-4">
          {/* Search bar simulation */}
          <div className="hidden sm:block h-9 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </header>

      <main className="container pt-6">
        <Shimmer loading={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 flex items-center space-x-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3.5 w-44 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        </Shimmer>
      </main>
    </div>
  );
}
