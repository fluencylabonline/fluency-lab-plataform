"use client";

import { Shimmer } from "@shimmer-from-structure/react";

export default function NotebookLoading() {
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
        {/* Mobile Stats Dashboard (Horizontal) */}
        <div className="lg:hidden mb-6">
          <Shimmer loading={true}>
            <div className="flex flex-row gap-4 overflow-x-auto no-scrollbar pb-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[120px] flex-shrink-0 h-28 bg-zinc-200 dark:bg-zinc-800 rounded-md p-4 flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-5 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                  <div className="h-5 w-8 bg-zinc-300 dark:bg-zinc-700 rounded" />
                  <div className="h-2 w-16 bg-zinc-300 dark:bg-zinc-700 rounded" />
                </div>
              ))}
            </div>
          </Shimmer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
          {/* Column 1: Notebooks (Desktop only) */}
          <section className="hidden lg:block lg:col-span-1 h-[calc(100vh-10rem)] sticky top-24 overflow-hidden">
            <Shimmer loading={true}>
              <div className="card w-full flex flex-col h-full p-4">
                <div className="pb-6">
                  <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="item flex items-center justify-between p-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                      <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </Shimmer>
          </section>

          {/* Column 2: Learning Path (Desktop & Mobile) */}
          <section className="lg:col-span-2 space-y-6 h-fit sm:h-[calc(100vh-10rem)]">
            <div className="flex items-center justify-between lg:hidden px-1">
              <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>

            <Shimmer loading={true}>
              <div className="card w-full flex flex-col lg:h-[calc(100vh-10rem)] overflow-hidden">
                <div className="flex flex-row justify-between items-center py-4 px-6 border-b border-zinc-100 dark:border-zinc-800/50">
                  <div className="w-8" />
                  <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>

                {/* Snake Path Desktop ZigZag Simulation */}
                <div className="w-full relative flex-1 overflow-y-auto py-10 flex justify-center items-start">
                  <div className="relative w-[300px] h-[500px]">
                    {/* ZigZag nodes */}
                    <div className="absolute top-[40px] left-[150px] -translate-x-12 flex flex-col items-center gap-1">
                      <div className="w-24 h-24 rounded-[35px] bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
                      <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>

                    <div className="absolute top-[180px] left-[70px] -translate-x-12 flex flex-col items-center gap-1">
                      <div className="w-24 h-24 rounded-[35px] bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
                      <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>

                    <div className="absolute top-[320px] left-[150px] -translate-x-12 flex flex-col items-center gap-1">
                      <div className="w-24 h-24 rounded-[35px] bg-zinc-200 dark:bg-zinc-800" />
                      <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
                      <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </Shimmer>
          </section>

          {/* Column 3: Stats (Desktop only - Vertical) */}
          <section className="hidden lg:block lg:col-span-1 h-[calc(100vh-10rem)] sticky top-24">
            <Shimmer loading={true}>
              <div className="flex flex-col gap-4 h-full">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-full flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-md p-4 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-5 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                    <div className="h-6 w-10 bg-zinc-300 dark:bg-zinc-700 rounded" />
                    <div className="h-2.5 w-20 bg-zinc-300 dark:bg-zinc-700 rounded" />
                  </div>
                ))}
              </div>
            </Shimmer>
          </section>
        </div>
      </main>
    </div>
  );
}
