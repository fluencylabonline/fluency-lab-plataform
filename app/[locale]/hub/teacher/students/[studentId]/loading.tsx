"use client";

import { Shimmer } from "@shimmer-from-structure/react";

export default function StudentDetailsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <header className="header-layout sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="container pt-4">
        <Shimmer loading={true}>
          {/* Layout Desktop (3 Colunas) */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-3">
            {/* Column 1: Notebooks */}
            <div className="card p-4 h-[calc(100vh-110px)] flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="flex-1 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="item p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Plan */}
            <div className="card p-4 h-[calc(100vh-110px)] flex flex-col gap-4">
              <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="flex-1 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="item p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="h-3 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Classes */}
            <div className="card p-4 h-[calc(100vh-110px)] flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="item p-3 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <div className="h-4.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-4.5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Layout Mobile (Apenas Classes) */}
          <div className="lg:hidden h-[calc(100vh-150px)]">
            <div className="card p-4 h-full flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="item p-3 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <div className="h-4.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-4.5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Shimmer>
      </main>
    </div>
  );
}
