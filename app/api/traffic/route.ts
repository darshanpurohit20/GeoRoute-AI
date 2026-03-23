import { NextResponse } from "next/server";
import { buildRoadNetwork } from "@/lib/algorithms/graph-builder";
import { dijkstra, astar } from "@/lib/algorithms/graph";

/**
 * Simulates traffic changes and returns updated route
 * Used for dynamic rerouting demonstration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, destination, iteration = 0 } = body;

    if (!source || !destination) {
      return NextResponse.json(
        { error: "Source and destination required" },
        { status: 400 }
      );
    }

    // Rebuild graph with different traffic seed to simulate change
    const graph = buildRoadNetwork(source, destination, 10);

    // Mutate some edges to simulate real-time traffic changes
    for (const edges of graph.adjacency.values()) {
      for (const edge of edges) {
        // Shift traffic weights based on iteration
        const shift =
          Math.sin(iteration * 0.5 + edge.distance * 0.001) * 0.8;
        edge.trafficWeight = Math.max(
          1.0,
          Math.min(3.5, edge.trafficWeight + shift)
        );
      }
    }

    const dijkstraResult = dijkstra(graph, "source", "destination", "duration");
    const astarResult = astar(graph, "source", "destination", "duration");

    const trafficData: {
      coordinates: { lat: number; lng: number }[];
      weight: number;
    }[] = [];

    for (const edges of graph.adjacency.values()) {
      for (const edge of edges) {
        trafficData.push({
          coordinates: edge.coordinates,
          weight: edge.trafficWeight,
        });
      }
    }

    return NextResponse.json({
      routes: {
        dijkstra: dijkstraResult,
        astar: astarResult,
      },
      trafficData,
      iteration,
    });
  } catch (error) {
    console.error("Traffic simulation error:", error);
    return NextResponse.json(
      { error: "Traffic simulation failed" },
      { status: 500 }
    );
  }
}
