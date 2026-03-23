/**
 * Graph Builder: Creates a navigable graph from route coordinates
 * Generates intermediate nodes and edges with realistic traffic simulation
 */

import {
  type Coordinate,
  type Graph,
  type GraphNode,
  type GraphEdge,
  haversineDistance,
} from "./graph";

/**
 * Build a graph from a set of route coordinates
 * Creates nodes at each coordinate and edges between consecutive points
 */
export function buildGraphFromCoordinates(
  coordinates: Coordinate[],
  trafficSeed?: number
): Graph {
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  // Create nodes for each coordinate
  coordinates.forEach((coord, i) => {
    const id = `node_${i}`;
    nodes.set(id, { id, coord });
    adjacency.set(id, []);
  });

  // Create bidirectional edges between consecutive nodes
  for (let i = 0; i < coordinates.length - 1; i++) {
    const fromId = `node_${i}`;
    const toId = `node_${i + 1}`;
    const dist = haversineDistance(coordinates[i], coordinates[i + 1]);

    // Assume average speed of 40 km/h for urban, adjusted by traffic
    const baseDuration = (dist / 1000 / 40) * 3600; // seconds
    const traffic = generateTrafficWeight(i, trafficSeed);

    const forwardEdge: GraphEdge = {
      from: fromId,
      to: toId,
      distance: dist,
      duration: baseDuration,
      trafficWeight: traffic,
      coordinates: [coordinates[i], coordinates[i + 1]],
    };

    const backwardEdge: GraphEdge = {
      from: toId,
      to: fromId,
      distance: dist,
      duration: baseDuration,
      trafficWeight: traffic,
      coordinates: [coordinates[i + 1], coordinates[i]],
    };

    adjacency.get(fromId)!.push(forwardEdge);
    adjacency.get(toId)!.push(backwardEdge);
  }

  return { nodes, adjacency };
}

/**
 * Build a realistic road network graph with multiple paths
 * between source and destination. Creates a grid-like network
 * with varying traffic conditions to enable meaningful routing.
 */
export function buildRoadNetwork(
  source: Coordinate,
  destination: Coordinate,
  gridSize: number = 8
): Graph {
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  const latStep = (destination.lat - source.lat) / gridSize;
  const lngStep = (destination.lng - source.lng) / gridSize;

  // Width of the network perpendicular to the main direction
  const perpLat = -lngStep * 0.3;
  const perpLng = latStep * 0.3;

  // Create a grid of nodes between source and destination
  for (let i = 0; i <= gridSize; i++) {
    for (let j = -2; j <= 2; j++) {
      const id = `n_${i}_${j}`;
      const coord: Coordinate = {
        lat: source.lat + latStep * i + perpLat * j,
        lng: source.lng + lngStep * i + perpLng * j,
      };
      nodes.set(id, { id, coord });
      adjacency.set(id, []);
    }
  }

  // Add source and destination as special nodes
  const srcId = "source";
  const dstId = "destination";
  nodes.set(srcId, { id: srcId, coord: source });
  nodes.set(dstId, { id: dstId, coord: destination });
  adjacency.set(srcId, []);
  adjacency.set(dstId, []);

  // Connect source to first column
  for (let j = -2; j <= 2; j++) {
    const targetId = `n_0_${j}`;
    addBidirectionalEdge(nodes, adjacency, srcId, targetId);
  }

  // Connect last column to destination
  for (let j = -2; j <= 2; j++) {
    const targetId = `n_${gridSize}_${j}`;
    addBidirectionalEdge(nodes, adjacency, targetId, dstId);
  }

  // Connect grid nodes - forward, lateral, and diagonal connections
  for (let i = 0; i < gridSize; i++) {
    for (let j = -2; j <= 2; j++) {
      const fromId = `n_${i}_${j}`;

      // Forward connection
      const forwardId = `n_${i + 1}_${j}`;
      if (nodes.has(forwardId)) {
        addBidirectionalEdge(nodes, adjacency, fromId, forwardId);
      }

      // Diagonal connections
      if (j < 2) {
        const diagUpId = `n_${i + 1}_${j + 1}`;
        if (nodes.has(diagUpId)) {
          addBidirectionalEdge(nodes, adjacency, fromId, diagUpId);
        }
      }
      if (j > -2) {
        const diagDownId = `n_${i + 1}_${j - 1}`;
        if (nodes.has(diagDownId)) {
          addBidirectionalEdge(nodes, adjacency, fromId, diagDownId);
        }
      }

      // Lateral connections (same column)
      if (j < 2) {
        const lateralId = `n_${i}_${j + 1}`;
        if (nodes.has(lateralId)) {
          addBidirectionalEdge(nodes, adjacency, fromId, lateralId);
        }
      }
    }
  }

  return { nodes, adjacency };
}

function addBidirectionalEdge(
  nodes: Map<string, GraphNode>,
  adjacency: Map<string, GraphEdge[]>,
  fromId: string,
  toId: string
) {
  const fromNode = nodes.get(fromId)!;
  const toNode = nodes.get(toId)!;
  const dist = haversineDistance(fromNode.coord, toNode.coord);
  const baseDuration = (dist / 1000 / 40) * 3600;

  // Seeded pseudo-random traffic based on edge identifiers
  const seed = hashString(fromId + toId);
  const traffic = generateTrafficWeight(seed);

  // Create intermediate points for smooth polyline
  const midLat = (fromNode.coord.lat + toNode.coord.lat) / 2;
  const midLng = (fromNode.coord.lng + toNode.coord.lng) / 2;
  // Add slight curve
  const offset = ((seed % 100) - 50) * 0.0001;

  const coords: Coordinate[] = [
    fromNode.coord,
    { lat: midLat + offset, lng: midLng - offset },
    toNode.coord,
  ];

  const forward: GraphEdge = {
    from: fromId,
    to: toId,
    distance: dist,
    duration: baseDuration,
    trafficWeight: traffic,
    coordinates: coords,
  };

  const backward: GraphEdge = {
    from: toId,
    to: fromId,
    distance: dist,
    duration: baseDuration,
    trafficWeight: traffic,
    coordinates: [...coords].reverse(),
  };

  adjacency.get(fromId)!.push(forward);
  adjacency.get(toId)!.push(backward);
}

/**
 * Generate a traffic weight based on a seed value
 * Returns 1.0 (free) to 3.0 (heavily congested)
 */
function generateTrafficWeight(seed: number, extraSeed?: number): number {
  const combined = seed + (extraSeed || 0);
  // Use a simple hash to generate pseudo-random traffic
  const val = Math.abs(Math.sin(combined * 12.9898 + 78.233) * 43758.5453) % 1;

  if (val < 0.5) return 1.0; // 50% chance free flow
  if (val < 0.75) return 1.0 + val; // 25% moderate
  if (val < 0.9) return 2.0 + val * 0.5; // 15% congested
  return 2.5 + val; // 10% heavily congested
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get traffic color for a given weight
 */
export function getTrafficColor(weight: number): string {
  if (weight <= 1.2) return "#4ade80"; // green - free flow
  if (weight <= 1.8) return "#facc15"; // yellow - moderate
  if (weight <= 2.5) return "#f97316"; // orange - congested
  return "#ef4444"; // red - heavily congested
}

/**
 * Compute distance matrix between multiple points
 */
export function computeDistanceMatrix(points: Coordinate[]): number[][] {
  const n = points.length;
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0)
  );

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = haversineDistance(points[i], points[j]);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }

  return matrix;
}
