"use client";

import { Shimmer } from "@shimmer-from-structure/react";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <header className="header-layout sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex flex-col items-start gap-1">
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3.5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="container pt-4">
        <Shimmer loading={true}>
          <div className="space-y-6">
            {/* Tabs List Shimmer */}
            <div className="overflow-x-auto pb-2 scrollbar-none">
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
            </div>

            {/* Profile Section Card */}
            <div className="card p-6 flex flex-col gap-4">
              <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 bg-zinc-200 dark:bg-zinc-800 border" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
            </div>

            {/* Language Section Card */}
            <div className="card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-14 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-14 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
            </div>

            {/* Email Verification Section Card */}
            <div className="card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-md border border-zinc-100 dark:border-zinc-800/50">
                <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
            </div>

            {/* Data Management Section Card */}
            <div className="card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-10 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md shrink-0" />
              </div>
            </div>

            {/* Danger Zone Card */}
            <div className="card p-6 border-red-500/20 bg-red-500/5 space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-red-200 dark:bg-red-950 rounded animate-pulse" />
                  <div className="h-5 w-28 bg-red-200 dark:bg-red-950 rounded animate-pulse" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-full bg-red-200 dark:bg-red-950 rounded" />
                    <div className="h-4 w-3/4 bg-red-200 dark:bg-red-950 rounded" />
                  </div>
                  <div className="h-10 w-44 bg-red-200 dark:bg-red-950 rounded-md shrink-0" />
                </div>
              </div>

              <div className="h-px bg-red-500/10" />

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-red-200 dark:bg-red-950 rounded animate-pulse" />
                  <div className="h-5 w-28 bg-red-200 dark:bg-red-950 rounded animate-pulse" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-full bg-red-200 dark:bg-red-950 rounded" />
                    <div className="h-4 w-2/3 bg-red-200 dark:bg-red-950 rounded" />
                  </div>
                  <div className="h-10 w-28 bg-red-200 dark:bg-red-950 rounded-md shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </Shimmer>
      </main>
    </div>
  );
}
