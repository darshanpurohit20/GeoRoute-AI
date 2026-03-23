"use client";

import {
  Navigation,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Activity,
  Layers,
} from "lucide-react";
import { LocationSearch } from "./location-search";
import type { LocationResult } from "@/lib/route-store";

interface ControlPanelProps {
  source: LocationResult | null;
  destination: LocationResult | null;
  onSourceChange: (loc: LocationResult | null) => void;
  onDestinationChange: (loc: LocationResult | null) => void;
  onFindRoute: () => void;
  onSimulateTraffic: () => void;
  isLoading: boolean;
  isSimulating: boolean;
  showTraffic: boolean;
  onToggleTraffic: () => void;
  optimizeMode: "distance" | "duration";
  onOptimizeModeChange: (mode: "distance" | "duration") => void;
}

export function ControlPanel({
  source,
  destination,
  onSourceChange,
  onDestinationChange,
  onFindRoute,
  onSimulateTraffic,
  isLoading,
  isSimulating,
  showTraffic,
  onToggleTraffic,
  optimizeMode,
  onOptimizeModeChange,
}: ControlPanelProps) {
  const canRoute = source && destination && !isLoading;

  return (
    <div className="fixed top-4 left-4 z-20 w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Navigation className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                GeoRoute AI
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Intelligent Route Optimization
              </p>
            </div>
          </div>
        </div>

        {/* Search inputs */}
        <div className="px-4 pb-3 space-y-2">
          <LocationSearch
            label="Origin"
            placeholder="Search starting point..."
            value={source}
            onChange={onSourceChange}
            icon="source"
          />
          <LocationSearch
            label="Destination"
            placeholder="Search destination..."
            value={destination}
            onChange={onDestinationChange}
            icon="destination"
          />
        </div>

        {/* Optimize mode */}
        <div className="px-4 pb-3">
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            <button
              onClick={() => onOptimizeModeChange("distance")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                optimizeMode === "distance"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3 h-3" />
              Shortest
            </button>
            <button
              onClick={() => onOptimizeModeChange("duration")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                optimizeMode === "duration"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="w-3 h-3" />
              Fastest
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={onFindRoute}
            disabled={!canRoute}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Computing Routes...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                Find Optimal Route
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onToggleTraffic}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                showTraffic
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {showTraffic ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              Traffic
            </button>
            <button
              onClick={onSimulateTraffic}
              disabled={!canRoute || isSimulating}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-secondary/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`}
              />
              Reroute
            </button>
          </div>
        </div>

        {/* Map click hint */}
        <div className="px-4 pb-3">
          <p className="text-[10px] text-muted-foreground text-center">
            Click the map to set origin/destination
          </p>
        </div>
      </div>
    </div>
  );
}
