"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Navigation, X, Loader2 } from "lucide-react";
import type { LocationResult } from "@/lib/route-store";

interface LocationSearchProps {
  label: string;
  placeholder: string;
  value: LocationResult | null;
  onChange: (location: LocationResult | null) => void;
  icon: "source" | "destination";
}

export function LocationSearch({
  label,
  placeholder,
  value,
  onChange,
  icon,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (location: LocationResult) => {
    onChange(location);
    setQuery(location.displayName.split(",")[0]);
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery("");
    onChange(null);
    setResults([]);
    setIsOpen(false);
  };

  useEffect(() => {
    if (value) {
      setQuery(value.displayName.split(",")[0]);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-3 z-10">
          {icon === "source" ? (
            <div className="w-3 h-3 rounded-full bg-geo-green shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-geo-red shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          aria-label={label}
        />
        <div className="absolute right-3 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {query && (
            <button
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {results.map((result, i) => (
            <button
              key={`${result.lat}-${result.lng}-${i}`}
              onClick={() => handleSelect(result)}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
            >
              {icon === "source" ? (
                <Navigation className="w-4 h-4 text-geo-green mt-0.5 shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-geo-red mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">
                  {result.displayName.split(",")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {result.displayName.split(",").slice(1, 3).join(",")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
