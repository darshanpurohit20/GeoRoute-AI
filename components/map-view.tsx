"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Coordinate, RouteResult } from "@/lib/algorithms/graph";
import { getTrafficColor } from "@/lib/algorithms/graph-builder";
import type L from "leaflet";

interface MapViewProps {
  source: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  routes: {
    dijkstra: RouteResult | null;
    astar: RouteResult | null;
  };
  activeAlgorithm: "dijkstra" | "astar" | "both";
  trafficData: { coordinates: Coordinate[]; weight: number }[];
  showTraffic: boolean;
  onMapClick: (coord: { lat: number; lng: number }) => void;
}

export function MapView({
  source,
  destination,
  routes,
  activeAlgorithm,
  trafficData,
  showTraffic,
  onMapClick,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<{
    sourceMarker: L.Marker | null;
    destMarker: L.Marker | null;
    dijkstraLine: L.Polyline | null;
    astarLine: L.Polyline | null;
    trafficLines: L.Polyline[];
  }>({
    sourceMarker: null,
    destMarker: null,
    dijkstraLine: null,
    astarLine: null,
    trafficLines: [],
  });

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current || mapRef.current) return;

    const L = (await import("leaflet")).default;

    // Fix default icon paths
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([40.7128, -74.006], 13);

    // Dark-themed tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      }
    ).addTo(map);

    // Add attribution in bottom-right
    L.control.attribution({ position: "bottomright" }).addTo(map);
    map.attributionControl.addAttribution(
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
    );

    // Zoom control in bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
  }, [onMapClick]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initMap]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      const layers = layersRef.current;

      // Source marker
      if (layers.sourceMarker) {
        layers.sourceMarker.remove();
        layers.sourceMarker = null;
      }
      if (source) {
        const sourceIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:20px;height:20px;background:#4ade80;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(74,222,128,0.6);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        layers.sourceMarker = L.marker([source.lat, source.lng], {
          icon: sourceIcon,
        }).addTo(mapRef.current!);
      }

      // Destination marker
      if (layers.destMarker) {
        layers.destMarker.remove();
        layers.destMarker = null;
      }
      if (destination) {
        const destIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:20px;height:20px;background:#ef4444;border-radius:50%;border:3px solid #fff;box-shadow:0 0 12px rgba(239,68,68,0.6);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        layers.destMarker = L.marker([destination.lat, destination.lng], {
          icon: destIcon,
        }).addTo(mapRef.current!);
      }

      // Fit bounds to show both markers
      if (source && destination) {
        const bounds = L.latLngBounds(
          [source.lat, source.lng],
          [destination.lat, destination.lng]
        );
        mapRef.current!.fitBounds(bounds, { padding: [80, 80] });
      } else if (source) {
        mapRef.current!.setView([source.lat, source.lng], 14);
      } else if (destination) {
        mapRef.current!.setView([destination.lat, destination.lng], 14);
      }
    };

    loadLeaflet();
  }, [source, destination]);

  // Update route polylines
  useEffect(() => {
    if (!mapRef.current) return;

    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      const layers = layersRef.current;

      // Clear existing route lines
      if (layers.dijkstraLine) {
        layers.dijkstraLine.remove();
        layers.dijkstraLine = null;
      }
      if (layers.astarLine) {
        layers.astarLine.remove();
        layers.astarLine = null;
      }

      // Draw Dijkstra route
      if (
        routes.dijkstra &&
        (activeAlgorithm === "dijkstra" || activeAlgorithm === "both")
      ) {
        const coords = routes.dijkstra.coordinates.map(
          (c) => [c.lat, c.lng] as [number, number]
        );
        layers.dijkstraLine = L.polyline(coords, {
          color: "#3b82f6",
          weight: 5,
          opacity: 0.9,
          dashArray: activeAlgorithm === "both" ? undefined : undefined,
        }).addTo(mapRef.current!);
      }

      // Draw A* route
      if (
        routes.astar &&
        (activeAlgorithm === "astar" || activeAlgorithm === "both")
      ) {
        const coords = routes.astar.coordinates.map(
          (c) => [c.lat, c.lng] as [number, number]
        );
        layers.astarLine = L.polyline(coords, {
          color: "#a855f7",
          weight: 5,
          opacity: 0.9,
          dashArray: activeAlgorithm === "both" ? "12, 8" : undefined,
        }).addTo(mapRef.current!);
      }
    };

    loadLeaflet();
  }, [routes, activeAlgorithm]);

  // Update traffic overlay
  useEffect(() => {
    if (!mapRef.current) return;

    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      const layers = layersRef.current;

      // Clear old traffic
      layers.trafficLines.forEach((line) => line.remove());
      layers.trafficLines = [];

      if (!showTraffic || trafficData.length === 0) return;

      for (const segment of trafficData) {
        const coords = segment.coordinates.map(
          (c) => [c.lat, c.lng] as [number, number]
        );
        const color = getTrafficColor(segment.weight);
        const line = L.polyline(coords, {
          color,
          weight: 3,
          opacity: 0.4,
        }).addTo(mapRef.current!);
        layers.trafficLines.push(line);
      }
    };

    loadLeaflet();
  }, [trafficData, showTraffic]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0"
        role="application"
        aria-label="Interactive route map"
      />
    </>
  );
}
