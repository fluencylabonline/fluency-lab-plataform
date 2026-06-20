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

      <main className="container py-4">
        <Shimmer loading={true}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
            {/* Column 1: Identity & Onboarding */}
            <div className="flex flex-col gap-3">
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

              {/* Onboarding Cards Shimmer */}
              <div className="flex flex-col gap-3">
                <div className="card p-4 flex items-center justify-between rounded-md">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>
                <div className="card p-4 flex items-center justify-between rounded-md">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges Shimmer */}
              <div className="card p-6">
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                </div>
              </div>
            </div>

            {/* Column 2: Performance & Achievements */}
            <div className="flex flex-col gap-3">
              {/* ProgressStatusCard Shimmer */}
              <div className="card p-6 flex flex-col justify-between">
                <div>
                  <div className="h-5 w-44 bg-zinc-200 dark:bg-zinc-800 rounded mb-8" />
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                      <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* StreakWidget Shimmer */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="flex flex-col gap-1">
                      <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                  <div className="h-7 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>

              {/* PracticeStatusWidget Shimmer */}
              <div className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  <div className="flex flex-col gap-1">
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Financial & Scheduling */}
            <div className="flex flex-col gap-3">
              {/* StudentPaymentStatusCard Shimmer */}
              <div className="card flex flex-col">
                <div className="p-5 flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                    <div className="flex flex-col gap-1">
                      <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                </div>
                <div className="p-5 flex flex-col justify-center items-center py-8">
                  <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-3" />
                  <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  <div className="h-3 w-44 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
                  <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>

              {/* NextClassCard Shimmer */}
              <div className="card p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                </div>
                <div className="flex-1">
                  <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                  <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-6" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Shimmer>
      </main>
    </div>
  );
}
