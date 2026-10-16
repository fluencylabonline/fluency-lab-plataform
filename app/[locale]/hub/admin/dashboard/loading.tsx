"use client";

import { Shimmer } from "@shimmer-from-structure/react";

/** Mesma grade do dashboard: KPIs, financeiro (largura total) e acadêmico (3 colunas). */
export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="header-layout sticky top-0 z-40 flex h-16 w-full items-center justify-between px-4 md:px-6">
        <div className="flex flex-col items-start gap-1">
          <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-3.5 w-60 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mt-1" />
        </div>
        <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
      </header>

      <main className="container max-w-7xl pb-12 pt-2 flex flex-col gap-8">
        <Shimmer loading={true}>
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 px-0.5">
              <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-4 flex flex-col gap-3">
                  <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3 mt-8">
            <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
              <div className="card col-span-full h-72" />
            </div>
          </section>

          <section className="flex flex-col gap-3 mt-8">
            <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="card xl:col-span-2 h-80" />
              <div className="card xl:col-span-1 h-80" />
            </div>
          </section>
        </Shimmer>
      </main>
    </div>
  );
}
