"use client";

export function TrafficLegend({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-20 md:bottom-auto md:top-4 md:right-4 md:left-auto">
      <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg px-3 py-2.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Traffic Density
        </p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-foreground">
            <div className="w-4 h-1 rounded bg-geo-green" />
            Free
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground">
            <div className="w-4 h-1 rounded bg-geo-yellow" />
            Moderate
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground">
            <div className="w-4 h-1 rounded bg-[#f97316]" />
            Slow
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground">
            <div className="w-4 h-1 rounded bg-geo-red" />
            Congested
          </span>
        </div>
      </div>
    </div>
  );
}
