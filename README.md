# GeoRoute AI - Intelligent Route Optimization Engine

A production-grade route optimization application built with **Next.js 16**, **TypeScript**, **Leaflet**, and custom graph algorithms. GeoRoute AI visualizes shortest-path computation using **Dijkstra's** and **A\*** algorithms with real-time traffic simulation and dynamic rerouting.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Algorithms](#algorithms)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Usage Guide](#usage-guide)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Routing
- **Dijkstra's Algorithm** - Classic shortest-path algorithm with guaranteed optimal solution
- **A\* Algorithm** - Heuristic-based pathfinding using haversine distance for geographic routing
- **Side-by-side comparison** - Compare both algorithms' performance, nodes explored, and compute time

### Map & Search
- **Full-screen interactive map** with dark CartoDB basemap tiles
- **Geocoding search** with autocomplete via OpenStreetMap Nominatim
- **Click-to-set** origin and destination directly on the map
- **Custom markers** with glowing source (green) and destination (red) indicators

### Traffic Simulation
- **Simulated traffic layer** with color-coded road segments (green/yellow/orange/red)
- **Dynamic rerouting** - traffic conditions change in real-time, routes recompute automatically
- **Traffic density visualization** toggled on/off via the control panel

### Route Analysis
- **Distance & ETA** calculations for each algorithm
- **Nodes explored** and **waypoint count** metrics
- **Computation time** measured in milliseconds
- **Graph statistics** showing total nodes and edges in the network
- **Shortest vs. Fastest** optimization mode toggle

### UI/UX
- **Glassmorphism design** with backdrop blur and translucent panels
- **Map-first layout** - full viewport map with floating overlays
- **Responsive design** - mobile-friendly bottom panel, desktop sidebar layout
- **Dark theme** optimized for map readability

---

## Tech Stack

| Layer         | Technology                                   |
| ------------- | -------------------------------------------- |
| Framework     | Next.js 16 (App Router)                      |
| Language      | TypeScript 5.7                               |
| Styling       | Tailwind CSS 4                               |
| Maps          | Leaflet + CartoDB Dark Tiles                  |
| Geocoding     | OpenStreetMap Nominatim API                   |
| Algorithms    | Custom Dijkstra & A\* (TypeScript)            |
| Components    | shadcn/ui, Lucide Icons                      |
| Fonts         | Inter (headings & body), Geist Mono (data)   |

---

## Architecture

```
Browser (Client)
    |
    +-- MapView (Leaflet)            Full-screen interactive map
    +-- ControlPanel                 Search inputs, mode toggles, actions
    +-- RoutePanel                   Route analysis & algorithm comparison
    +-- TrafficLegend                Traffic density color key
    |
Next.js API Routes (Server)
    |
    +-- /api/geocode     GET         Location search via Nominatim
    +-- /api/route        POST       Compute routes (Dijkstra + A*)
    +-- /api/traffic      POST       Traffic simulation & rerouting
    |
Algorithm Engine (lib/)
    |
    +-- graph.ts                     Graph data structures, Dijkstra, A*
    +-- graph-builder.ts             Road network generation, traffic weights
```

### Data Flow

1. User enters origin/destination via search or map click
2. Client sends coordinates to `/api/route`
3. Server builds a road network graph between the two points
4. Both Dijkstra and A\* compute optimal paths through the graph
5. Routes, traffic data, and graph stats are returned to the client
6. Leaflet renders polylines and traffic overlay on the map
7. Route panel displays comparison metrics

---

## Algorithms

### Dijkstra's Algorithm

Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph. It explores nodes uniformly by always expanding the node with the smallest known distance.

**Complexity:** O((V + E) log V) with a min-heap priority queue

**Implementation highlights:**
- Min-heap priority queue for efficient node selection
- Traffic-weighted edge costs for realistic routing
- Supports both distance and duration optimization modes

### A\* Algorithm

A\* extends Dijkstra by adding a heuristic function that estimates the remaining distance to the goal. This allows A\* to prioritize nodes that are likely closer to the destination, typically exploring fewer nodes.

**Heuristic:** Haversine distance (great-circle distance on Earth's surface)

**Complexity:** O((V + E) log V) worst case, but typically faster than Dijkstra due to heuristic pruning

**Implementation highlights:**
- Admissible heuristic guarantees optimal solution
- Geographic distance estimation via haversine formula
- Same priority queue structure as Dijkstra for consistency

### Road Network Generation

The graph builder creates a realistic grid-like road network between source and destination:
- 5 parallel lanes with forward, lateral, and diagonal connections
- Pseudo-random traffic weights based on edge identifiers
- Curved intermediate points for smooth polyline rendering

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20+ recommended)
- **pnpm** package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/georoute-ai.git
cd georoute-ai

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

No API keys are required for the default configuration. The app uses:
- **OpenStreetMap Nominatim** for geocoding (free, no key required)
- **CartoDB Dark** tiles for the map (free, no key required)

To use HERE Maps or Mapbox instead, create a `.env.local` file:

```env
# Optional: HERE Maps API (for premium geocoding)
NEXT_PUBLIC_HERE_API_KEY=your_here_api_key

# Optional: Mapbox token (for premium tiles)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

---

## Project Structure

```
georoute-ai/
├── app/
│   ├── api/
│   │   ├── geocode/
│   │   │   └── route.ts          # Geocoding endpoint (Nominatim)
│   │   ├── route/
│   │   │   └── route.ts          # Route computation endpoint
│   │   └── traffic/
│   │       └── route.ts          # Traffic simulation endpoint
│   ├── globals.css               # Design tokens & theme
│   ├── layout.tsx                # Root layout with fonts & metadata
│   └── page.tsx                  # Main application page
├── components/
│   ├── control-panel.tsx         # Search, mode toggles, actions
│   ├── location-search.tsx       # Autocomplete location input
│   ├── map-view.tsx              # Leaflet map with markers & polylines
│   ├── route-panel.tsx           # Route analysis & comparison
│   ├── traffic-legend.tsx        # Traffic color legend
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── algorithms/
│   │   ├── graph.ts              # Graph structures, Dijkstra, A*
│   │   └── graph-builder.ts      # Road network & traffic generation
│   ├── route-store.ts            # State type definitions
│   └── utils.ts                  # Utility functions
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## API Reference

### `GET /api/geocode`

Search for locations by name.

| Parameter | Type   | Description          |
| --------- | ------ | -------------------- |
| `q`       | string | Search query (min 2 chars) |

**Response:**
```json
{
  "results": [
    {
      "displayName": "New York, NY, USA",
      "lat": 40.7128,
      "lng": -74.0060,
      "type": "city"
    }
  ]
}
```

### `POST /api/route`

Compute optimized routes between two points.

**Request body:**
```json
{
  "source": { "lat": 40.7128, "lng": -74.0060 },
  "destination": { "lat": 40.7580, "lng": -73.9855 },
  "algorithm": "both",
  "mode": "distance"
}
```

| Field         | Type   | Values                           |
| ------------- | ------ | -------------------------------- |
| `algorithm`   | string | `"dijkstra"`, `"astar"`, `"both"` |
| `mode`        | string | `"distance"`, `"duration"`       |

**Response:**
```json
{
  "routes": {
    "dijkstra": {
      "path": ["source", "n_1_0", "..."],
      "coordinates": [{ "lat": 40.71, "lng": -74.00 }],
      "distance": 5230,
      "duration": 470,
      "algorithm": "dijkstra",
      "nodesExplored": 45,
      "computeTimeMs": 1.23
    },
    "astar": { "..." : "..." }
  },
  "trafficData": [
    {
      "coordinates": [{ "lat": 40.71, "lng": -74.00 }],
      "weight": 1.5
    }
  ],
  "graphStats": { "nodes": 55, "edges": 340 }
}
```

### `POST /api/traffic`

Simulate traffic changes and recompute routes.

**Request body:**
```json
{
  "source": { "lat": 40.7128, "lng": -74.0060 },
  "destination": { "lat": 40.7580, "lng": -73.9855 },
  "iteration": 1
}
```

---

## Usage Guide

### Finding a Route

1. **Search method:** Type a location name in the Origin or Destination search box and select from autocomplete results.
2. **Map click method:** Click anywhere on the map. The first click sets the origin (green), the second sets the destination (red).
3. Click **Find Optimal Route** to compute paths using both algorithms.

### Comparing Algorithms

- Use the **Compare / Dijkstra / A\*** toggle in the Route Analysis panel to switch views.
- In Compare mode, Dijkstra is shown as a solid blue line and A\* as a dashed purple line.
- The Performance Comparison card shows speed difference and nodes explored.

### Traffic Simulation

1. Click the **Reroute** button to simulate changing traffic conditions.
2. Watch as traffic weights shift and routes are recomputed across 3 iterations.
3. Toggle the **Traffic** button to show/hide the traffic density overlay.

### Optimization Modes

- **Shortest** - minimizes total distance (uses distance-weighted edges)
- **Fastest** - minimizes travel time (uses duration-weighted edges, affected more by traffic)

---

## Configuration

### Map Tiles

The default dark map tiles come from CartoDB. To switch to another provider, modify the tile URL in `components/map-view.tsx`:

```typescript
// CartoDB Dark (default)
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png")

// OpenStreetMap Standard
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")

// Mapbox (requires token)
L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={token}")
```

### Graph Parameters

Adjust the road network density in `lib/algorithms/graph-builder.ts`:

```typescript
// gridSize controls network density (higher = more nodes & edges)
buildRoadNetwork(source, destination, 10) // default: 10
```

### Traffic Weights

Traffic simulation parameters in `graph-builder.ts`:

| Weight Range | Color  | Meaning           |
| ------------ | ------ | ----------------- |
| 1.0 - 1.2    | Green  | Free flow         |
| 1.2 - 1.8    | Yellow | Moderate traffic  |
| 1.8 - 2.5    | Orange | Congested         |
| 2.5+         | Red    | Heavily congested |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Code Style

- TypeScript strict mode enabled
- Functional components with hooks
- Algorithm logic in `lib/algorithms/` with JSDoc comments
- API routes in `app/api/` following Next.js App Router conventions

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Built with Next.js, TypeScript, Leaflet, and custom pathfinding algorithms.
