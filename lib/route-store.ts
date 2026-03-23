/**
 * Lightweight reactive store for route state management
 * Used across components for shared route state
 */

import { type Coordinate, type RouteResult } from "./algorithms/graph";

export interface LocationResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

export interface RouteState {
  source: LocationResult | null;
  destination: LocationResult | null;
  routes: {
    dijkstra: RouteResult | null;
    astar: RouteResult | null;
  };
  activeAlgorithm: "dijkstra" | "astar" | "both";
  optimizeMode: "distance" | "duration";
  trafficData: {
    coordinates: Coordinate[];
    weight: number;
  }[];
  isLoading: boolean;
  isSimulating: boolean;
  showTraffic: boolean;
  graphStats: { nodes: number; edges: number } | null;
}

export const initialRouteState: RouteState = {
  source: null,
  destination: null,
  routes: { dijkstra: null, astar: null },
  activeAlgorithm: "both",
  optimizeMode: "distance",
  trafficData: [],
  isLoading: false,
  isSimulating: false,
  showTraffic: true,
  graphStats: null,
};
