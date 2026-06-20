"use client";

import { Shimmer } from "@shimmer-from-structure/react";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <header className="header-layout sticky top-0 z-40 flex h-12 w-full items-center justify-between px-4 md:px-6">
        <div className="w-1/4 sm:w-1/3" />
        <div className="flex w-2/4 sm:w-1/3 justify-center items-center">
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex w-3/4 sm:w-1/3 items-center justify-end gap-2">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="container pt-8 pb-24 md:pb-8">
        <Shimmer loading={true}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Basic Info & Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card Shimmer */}
              <div className="card p-4 flex flex-row justify-between items-center">
                <div className="flex flex-row items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="flex flex-col items-start gap-1">
                    <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3.5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
                  </div>
                </div>
              </div>

              {/* Contract Badge Shimmer */}
              <div className="card p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>

              {/* Daily Lessons Summary Shimmer */}
              <div className="card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="item flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex flex-col gap-1.5">
                          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                          <div className="h-3 w-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        </div>
                      </div>
                      <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Financial History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Projections Dashboard Shimmer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>

                <div className="card p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  <div className="h-3 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>

                <div className="card p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  <div className="h-3.5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>

              {/* History Table Shimmer */}
              <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-5 w-44 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="item p-4 m-2 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <div className="space-y-1.5">
                          <div className="h-4.5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                          <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                        <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Shimmer>
      </main>
    </div>
  );
}
