"use client";

import { Shimmer } from "@shimmer-from-structure/react";

/** Skeleton da lista de usuários (admin e manager), na mesma grade do UsersPageClient. */
export function UsersPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="header-layout sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex flex-col items-start gap-1">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3.5 w-56 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1" />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block h-9 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        </div>
      </header>

      <main className="container">
        <div className="flex flex-wrap md:flex-row gap-2 mb-4">
          <div className="h-9 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-9 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse" />
        </div>
        <Shimmer loading={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="item p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-44 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="h-3.5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-5 w-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </Shimmer>
      </main>
    </div>
  );
}
