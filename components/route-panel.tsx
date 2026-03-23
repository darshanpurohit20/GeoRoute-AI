"use client";

import {
  Clock,
  Route,
  Gauge,
  Zap,
  GitBranch,
  BarChart3,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { RouteResult } from "@/lib/algorithms/graph";
import { useState } from "react";

interface RoutePanelProps {
  routes: {
    dijkstra: RouteResult | null;
    astar: RouteResult | null;
  };
  graphStats: { nodes: number; edges: number } | null;
  activeAlgorithm: "dijkstra" | "astar" | "both";
  onAlgorithmChange: (alg: "dijkstra" | "astar" | "both") => void;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function RouteCard({
  result,
  color,
  label,
}: {
  result: RouteResult;
  color: string;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold text-foreground">
            {label}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {result.computeTimeMs.toFixed(2)}ms
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-sm font-semibold text-foreground">
              {formatDistance(result.distance)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">ETA</p>
            <p className="text-sm font-semibold text-foreground">
              {formatDuration(result.duration)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          {result.nodesExplored} nodes explored
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {result.path.length} waypoints
        </span>
      </div>
    </div>
  );
}

export function RoutePanel({
  routes,
  graphStats,
  activeAlgorithm,
  onAlgorithmChange,
}: RoutePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasRoutes = routes.dijkstra || routes.astar;

  if (!hasRoutes) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 md:left-auto md:right-4 md:bottom-4 md:w-96"
    >
      <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Route Analysis
            </span>
          </div>
          <div className="flex items-center gap-3">
            {graphStats && (
              <span className="text-xs text-muted-foreground font-mono">
                {graphStats.nodes} nodes / {graphStats.edges} edges
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {/* Algorithm toggle */}
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
              {(["both", "dijkstra", "astar"] as const).map((alg) => (
                <button
                  key={alg}
                  onClick={() => onAlgorithmChange(alg)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeAlgorithm === alg
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {alg === "both"
                    ? "Compare"
                    : alg === "dijkstra"
                    ? "Dijkstra"
                    : "A*"}
                </button>
              ))}
            </div>

            {/* Route cards */}
            {routes.dijkstra &&
              (activeAlgorithm === "dijkstra" ||
                activeAlgorithm === "both") && (
                <RouteCard
                  result={routes.dijkstra}
                  color="#3b82f6"
                  label="Dijkstra's Algorithm"
                />
              )}

            {routes.astar &&
              (activeAlgorithm === "astar" || activeAlgorithm === "both") && (
                <RouteCard
                  result={routes.astar}
                  color="#a855f7"
                  label="A* Algorithm"
                />
              )}

            {/* Comparison */}
            {activeAlgorithm === "both" &&
              routes.dijkstra &&
              routes.astar && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      Performance Comparison
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Speed difference</p>
                      <p className="text-foreground font-mono">
                        {Math.abs(
                          routes.dijkstra.computeTimeMs -
                            routes.astar.computeTimeMs
                        ).toFixed(2)}
                        ms
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nodes explored</p>
                      <p className="text-foreground font-mono">
                        {routes.dijkstra.nodesExplored} vs{" "}
                        {routes.astar.nodesExplored}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Winner (speed)</p>
                      <p className="text-foreground font-semibold">
                        {routes.dijkstra.computeTimeMs <
                        routes.astar.computeTimeMs
                          ? "Dijkstra"
                          : "A*"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Winner (nodes)</p>
                      <p className="text-foreground font-semibold">
                        {routes.dijkstra.nodesExplored <
                        routes.astar.nodesExplored
                          ? "Dijkstra"
                          : "A*"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Legend */}
            {activeAlgorithm === "both" && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 bg-[#3b82f6] rounded" />
                  Dijkstra
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 bg-[#a855f7] rounded border-dashed" style={{ borderBottom: '2px dashed #a855f7', height: 0 }} />
                  A*
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
