import React from "react";

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-emerald-900/40 rounded-xl ${className}`} />
);

export const MatchListSkeleton = ({ rows = 6 }) => (
  <div className="bg-emerald-950/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-emerald-900/40 last:border-0">
        <Skeleton className="flex-1 h-5" />
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="flex-1 h-5" />
      </div>
    ))}
  </div>
);

export const CardGridSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-48" />
    ))}
  </div>
);

export default Skeleton;
