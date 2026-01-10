"use client";

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-6 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-8 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

