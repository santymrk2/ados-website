"use client";

import { Skeleton } from "@/components/ui/skeleton";

type SkeletonVariant = "card" | "list" | "grid" | "stats";

interface SectionSkeletonProps {
  variant: SkeletonVariant;
  count?: number;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-1/4" />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-3 space-y-2"
        >
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function SectionSkeleton({ variant, count }: SectionSkeletonProps) {
  switch (variant) {
    case "card":
      return <CardSkeleton />;
    case "list":
      return <ListSkeleton count={count ?? 3} />;
    case "grid":
      return <GridSkeleton count={count ?? 4} />;
    case "stats":
      return <StatsSkeleton count={count ?? 3} />;
  }
}
