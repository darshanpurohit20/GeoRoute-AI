/**
 * Graph data structure and pathfinding algorithms
 * Implements Dijkstra's and A* for route optimization
 */

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface GraphNode {
  id: string;
  coord: Coordinate;
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number; // meters
  duration: number; // seconds
  trafficWeight: number; // 1.0 = free, 2.0+ = congested
  coordinates: Coordinate[]; // polyline coords for this edge
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
}

export interface RouteResult {
  path: string[];
  coordinates: Coordinate[];
  distance: number; // meters
  duration: number; // seconds
  algorithm: "dijkstra" | "astar";
  nodesExplored: number;
  computeTimeMs: number;
}

/**
 * Haversine formula: calculate distance between two coordinates in meters
 */
export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Priority Queue (min-heap) for efficient pathfinding
 */
class MinHeap<T> {
  private heap: { priority: number; value: T }[] = [];

  push(value: T, priority: number) {
    this.heap.push({ priority, value });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top.value;
  }

  get size() {
    return this.heap.length;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].priority <= this.heap[i].priority) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].priority < this.heap[smallest].priority)
        smallest = left;
      if (right < n && this.heap[right].priority < this.heap[smallest].priority)
        smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

/**
 * Dijkstra's Algorithm - finds shortest path by total weighted distance
 * Explores all possible paths uniformly, guaranteeing optimal solution
 */
export function dijkstra(
  graph: Graph,
  startId: string,
  endId: string,
  mode: "distance" | "duration" = "distance"
): RouteResult | null {
  const start = performance.now();
  let nodesExplored = 0;

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const pq = new MinHeap<string>();

  // Initialize distances to infinity
  for (const nodeId of graph.nodes.keys()) {
    dist.set(nodeId, Infinity);
    prev.set(nodeId, null);
  }

  dist.set(startId, 0);
  pq.push(startId, 0);

  while (pq.size > 0) {
    const current = pq.pop()!;
    nodesExplored++;

    if (current === endId) break;

    const currentDist = dist.get(current)!;
    const edges = graph.adjacency.get(current) || [];

    for (const edge of edges) {
      // Weight includes traffic factor
      const weight =
        mode === "distance"
          ? edge.distance * edge.trafficWeight
          : edge.duration * edge.trafficWeight;

      const newDist = currentDist + weight;

      if (newDist < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, current);
        pq.push(edge.to, newDist);
      }
    }
  }

  // Reconstruct path
  const path = reconstructPath(prev, endId);
  if (path.length === 0) return null;

  const { coordinates, distance, duration } = extractRouteDetails(
    graph,
    path
  );

  return {
    path,
    coordinates,
    distance,
    duration,
    algorithm: "dijkstra",
    nodesExplored,
    computeTimeMs: performance.now() - start,
  };
}

/**
 * A* Algorithm - finds shortest path using heuristic estimation
 * Uses haversine distance as heuristic for geographic routing
 * Generally faster than Dijkstra by prioritizing promising directions
 */
export function astar(
  graph: Graph,
  startId: string,
  endId: string,
  mode: "distance" | "duration" = "distance"
): RouteResult | null {
  const start = performance.now();
  let nodesExplored = 0;

  const endNode = graph.nodes.get(endId);
  if (!endNode) return null;

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const pq = new MinHeap<string>();

  for (const nodeId of graph.nodes.keys()) {
    gScore.set(nodeId, Infinity);
    fScore.set(nodeId, Infinity);
    prev.set(nodeId, null);
  }

  const startNode = graph.nodes.get(startId);
  if (!startNode) return null;

  // h(n) = haversine distance to goal (admissible heuristic)
  const heuristic = (nodeId: string): number => {
    const node = graph.nodes.get(nodeId);
    if (!node) return Infinity;
    return haversineDistance(node.coord, endNode.coord);
  };

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startId));
  pq.push(startId, fScore.get(startId)!);

  while (pq.size > 0) {
    const current = pq.pop()!;
    nodesExplored++;

    if (current === endId) break;

    const currentG = gScore.get(current)!;
    const edges = graph.adjacency.get(current) || [];

    for (const edge of edges) {
      const weight =
        mode === "distance"
          ? edge.distance * edge.trafficWeight
          : edge.duration * edge.trafficWeight;

      const tentativeG = currentG + weight;

      if (tentativeG < (gScore.get(edge.to) ?? Infinity)) {
        prev.set(edge.to, current);
        gScore.set(edge.to, tentativeG);
        // f(n) = g(n) + h(n)
        const f = tentativeG + heuristic(edge.to);
        fScore.set(edge.to, f);
        pq.push(edge.to, f);
      }
    }
  }

  const path = reconstructPath(prev, endId);
  if (path.length === 0) return null;

  const { coordinates, distance, duration } = extractRouteDetails(
    graph,
    path
  );

  return {
    path,
    coordinates,
    distance,
    duration,
    algorithm: "astar",
    nodesExplored,
    computeTimeMs: performance.now() - start,
  };
}

/**
 * Reconstruct the path from the previous-node map
 */
function reconstructPath(
  prev: Map<string, string | null>,
  endId: string
): string[] {
  const path: string[] = [];
  let current: string | null | undefined = endId;

  while (current != null) {
    path.unshift(current);
    current = prev.get(current);
  }

  // If path has only one node and no prev, route wasn't found
  if (path.length <= 1 && prev.get(endId) === null) return [];

  return path;
}

/**
 * Extract route coordinates, total distance and duration from path
 */
function extractRouteDetails(
  graph: Graph,
  path: string[]
): { coordinates: Coordinate[]; distance: number; duration: number } {
  const coordinates: Coordinate[] = [];
  let distance = 0;
  let duration = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const edges = graph.adjacency.get(path[i]) || [];
    const edge = edges.find((e) => e.to === path[i + 1]);
    if (edge) {
      coordinates.push(...edge.coordinates);
      distance += edge.distance;
      duration += edge.duration;
    }
  }

  return { coordinates, distance, duration };
}
