import { NextResponse } from "next/server";
import { dijkstra, astar } from "@/lib/algorithms/graph";
import { buildRoadNetwork } from "@/lib/algorithms/graph-builder";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, destination, algorithm = "both", mode = "distance" } = body;

    if (!source || !destination) {
      return NextResponse.json(
        { error: "Source and destination coordinates required" },
        { status: 400 }
      );
    }

    // Build road network graph between the two points
    const graph = buildRoadNetwork(source, destination, 10);

    const results: Record<string, unknown> = {};

    if (algorithm === "dijkstra" || algorithm === "both") {
      const dijkstraResult = dijkstra(graph, "source", "destination", mode);
      if (dijkstraResult) {
        results.dijkstra = dijkstraResult;
      }
    }

    if (algorithm === "astar" || algorithm === "both") {
      const astarResult = astar(graph, "source", "destination", mode);
      if (astarResult) {
        results.astar = astarResult;
      }
    }

    // Get all edges with traffic data for visualization
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
      routes: results,
      trafficData,
      graphStats: {
        nodes: graph.nodes.size,
        edges: Array.from(graph.adjacency.values()).reduce(
          (sum, edges) => sum + edges.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Route computation error:", error);
    return NextResponse.json(
      { error: "Failed to compute route" },
      { status: 500 }
    );
  }
}
