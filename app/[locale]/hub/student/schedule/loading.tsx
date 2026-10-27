"use client";

import { Shimmer } from "@shimmer-from-structure/react";

export default function ScheduleLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="header-layout sticky top-0 z-40 flex h-12 w-full items-center justify-center px-4 md:px-6">
        <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </header>

      <main className="container max-w-2xl space-y-6 py-4">
        <Shimmer loading={true}>
          <div className="card grid grid-cols-2 gap-3 p-4">
            <div className="h-16 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-16 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </Shimmer>

        {[2, 3].map((rows) => (
          <section key={rows} className="space-y-2">
            <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <Shimmer loading={true}>
              <div className="space-y-2">
                {Array.from({ length: rows }).map((_, i) => (
                  <div key={i} className="flex h-16 items-center gap-3 rounded-2xl border border-border p-3">
                    <div className="size-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                    <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
            </Shimmer>
          </section>
        ))}
      </main>
    </div>
  );
}
