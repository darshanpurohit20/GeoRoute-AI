"use client";

import { useState, useCallback, useRef } from "react";
import { MapView } from "@/components/map-view";
import { ControlPanel } from "@/components/control-panel";
import { RoutePanel } from "@/components/route-panel";
import { TrafficLegend } from "@/components/traffic-legend";
import {
  type RouteState,
  initialRouteState,
  type LocationResult,
} from "@/lib/route-store";

export default function GeoRouteApp() {
  const [state, setState] = useState<RouteState>(initialRouteState);
  const mapClickTargetRef = useRef<"source" | "destination">("source");

  const setSource = useCallback((loc: LocationResult | null) => {
    setState((prev) => ({ ...prev, source: loc }));
  }, []);

  const setDestination = useCallback((loc: LocationResult | null) => {
    setState((prev) => ({ ...prev, destination: loc }));
  }, []);

  const handleMapClick = useCallback(
    (coord: { lat: number; lng: number }) => {
      const loc: LocationResult = {
        displayName: `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`,
        lat: coord.lat,
        lng: coord.lng,
        type: "pin",
      };

      if (mapClickTargetRef.current === "source" || !state.source) {
        setState((prev) => ({ ...prev, source: loc }));
        mapClickTargetRef.current = "destination";
      } else {
        setState((prev) => ({ ...prev, destination: loc }));
        mapClickTargetRef.current = "source";
      }
    },
    [state.source]
  );

  const findRoute = useCallback(async () => {
    if (!state.source || !state.destination) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { lat: state.source.lat, lng: state.source.lng },
          destination: {
            lat: state.destination.lat,
            lng: state.destination.lng,
          },
          algorithm: "both",
          mode: state.optimizeMode,
        }),
      });

      const data = await res.json();

      setState((prev) => ({
        ...prev,
        routes: {
          dijkstra: data.routes?.dijkstra || null,
          astar: data.routes?.astar || null,
        },
        trafficData: data.trafficData || [],
        graphStats: data.graphStats || null,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Route finding failed:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.source, state.destination, state.optimizeMode]);

  const simulateTraffic = useCallback(async () => {
    if (!state.source || !state.destination) return;

    setState((prev) => ({ ...prev, isSimulating: true }));

    try {
      // Simulate 3 iterations of traffic changes
      for (let i = 1; i <= 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const res = await fetch("/api/traffic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: { lat: state.source!.lat, lng: state.source!.lng },
            destination: {
              lat: state.destination!.lat,
              lng: state.destination!.lng,
            },
            iteration: i,
          }),
        });

        const data = await res.json();

        setState((prev) => ({
          ...prev,
          routes: {
            dijkstra: data.routes?.dijkstra || prev.routes.dijkstra,
            astar: data.routes?.astar || prev.routes.astar,
          },
          trafficData: data.trafficData || prev.trafficData,
        }));
      }
    } catch (error) {
      console.error("Traffic simulation failed:", error);
    } finally {
      setState((prev) => ({ ...prev, isSimulating: false }));
    }
  }, [state.source, state.destination]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      {/* Full-screen map */}
      <MapView
        source={
          state.source
            ? { lat: state.source.lat, lng: state.source.lng }
            : null
        }
        destination={
          state.destination
            ? { lat: state.destination.lat, lng: state.destination.lng }
            : null
        }
        routes={state.routes}
        activeAlgorithm={state.activeAlgorithm}
        trafficData={state.trafficData}
        showTraffic={state.showTraffic}
        onMapClick={handleMapClick}
      />

      {/* Control panel - top left */}
      <ControlPanel
        source={state.source}
        destination={state.destination}
        onSourceChange={setSource}
        onDestinationChange={setDestination}
        onFindRoute={findRoute}
        onSimulateTraffic={simulateTraffic}
        isLoading={state.isLoading}
        isSimulating={state.isSimulating}
        showTraffic={state.showTraffic}
        onToggleTraffic={() =>
          setState((prev) => ({ ...prev, showTraffic: !prev.showTraffic }))
        }
        optimizeMode={state.optimizeMode}
        onOptimizeModeChange={(mode) =>
          setState((prev) => ({ ...prev, optimizeMode: mode }))
        }
      />

      {/* Route analysis panel - bottom */}
      <RoutePanel
        routes={state.routes}
        graphStats={state.graphStats}
        activeAlgorithm={state.activeAlgorithm}
        onAlgorithmChange={(alg) =>
          setState((prev) => ({ ...prev, activeAlgorithm: alg }))
        }
      />

      {/* Traffic legend */}
      <TrafficLegend visible={state.showTraffic} />
    </main>
  );
}
