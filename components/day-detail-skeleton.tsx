function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export function DayDetailSkeleton() {
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <Shimmer className="h-10 w-10" />
        <Shimmer className="h-6 w-48" />
      </div>
      <Shimmer className="h-4 w-32" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-xl border border-border p-4 space-y-3">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
