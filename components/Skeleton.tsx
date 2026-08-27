"use client";

export function ProductSkeleton() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="w-full aspect-square bg-[var(--tg-secondary-bg)] animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[var(--tg-secondary-bg)] rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-[var(--tg-secondary-bg)] rounded w-1/2 animate-pulse" />
        <div className="h-5 bg-[var(--tg-secondary-bg)] rounded w-1/3 animate-pulse mt-2" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="px-6 py-4 rounded-full bg-[var(--tg-secondary-bg)] animate-pulse"
          style={{ width: "80px", height: "32px" }}
        />
      ))}
    </div>
  );
}
