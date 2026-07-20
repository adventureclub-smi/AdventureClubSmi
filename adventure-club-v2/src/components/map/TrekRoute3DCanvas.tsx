"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { TrekWaypoint } from "@/types/homepage";

// Free, no-account-needed sources — no Mapbox/Google token involved:
// - Esri World Imagery for the satellite basemap.
// - AWS's public "elevation-tiles-prod" Terrarium DEM for real 3D terrain.
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "esri-imagery": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Esri, Maxar, Earthstar Geographics, and the GIS community",
    },
    "terrain-dem": {
      type: "raster-dem",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      tileSize: 256,
      encoding: "terrarium",
      maxzoom: 15,
    },
  },
  layers: [
    {
      id: "esri-imagery-layer",
      type: "raster",
      source: "esri-imagery",
    },
  ],
};

const STYLE_ID = "trek-route-3d-styles";

// Injected once into <head> — MapLibre markers/popups/controls live outside
// React's tree, so CSS Modules can't reach them. CSS custom properties
// still resolve normally since they cascade through the whole document.
function ensureRoute3DStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .route3d-marker {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--color-accent, #22c55e);
      border: 2px solid var(--color-midnight, #0d0d0d);
      color: var(--color-midnight, #0d0d0d);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
    }
    .route3d-panel {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(13, 13, 13, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(245, 245, 245, 0.1);
      border-radius: 14px;
      padding: 12px;
    }
    .route3d-panel button {
      border: none;
      border-radius: 8px;
      padding: 9px 16px;
      background: rgba(245, 245, 245, 0.08);
      color: var(--color-text, #f5f5f5);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: 0.2s;
    }
    .route3d-panel button:hover {
      background: var(--color-accent, #22c55e);
      color: var(--color-midnight, #0d0d0d);
    }
    .route3d-popup .maplibregl-popup-content {
      background: var(--color-charcoal, #1b1b1b);
      border-radius: 12px;
      padding: 0;
      width: 240px;
    }
    .route3d-popup .maplibregl-popup-tip {
      border-top-color: var(--color-charcoal, #1b1b1b);
      border-bottom-color: var(--color-charcoal, #1b1b1b);
    }
    .route3d-popup .maplibregl-popup-close-button {
      color: var(--color-text, #f5f5f5);
      font-size: 16px;
      padding: 4px 8px;
    }
  `;
  document.head.appendChild(style);
}

function popupHtml(point: TrekWaypoint) {
  const mediaHtml = !point.mediaUrl
    ? ""
    : point.mediaType === "video"
    ? `<video src="${point.mediaUrl}" autoplay loop muted playsinline style="width:100%;height:140px;object-fit:cover;display:block;"></video>`
    : `<img src="${point.mediaUrl}" alt="${point.label}" style="width:100%;height:140px;object-fit:cover;display:block;" />`;

  return `
    <div style="font-family:inherit;">
      ${mediaHtml ? `<div style="border-radius:12px 12px 0 0;overflow:hidden;">${mediaHtml}</div>` : ""}
      <div style="padding:14px 16px;">
        <h4 style="font-family:var(--font-display, inherit);font-size:18px;color:var(--color-text, #f5f5f5);margin:0 0 8px;">${point.label}</h4>
        ${point.description ? `<p style="font-size:13px;line-height:1.5;color:var(--color-text-muted, #9ca3af);margin:0;">${point.description}</p>` : ""}
      </div>
    </div>
  `;
}

// A pre-recorded flythrough clip covers this same ground on the public
// homepage (see TrekRoute3D), so this cinematic mode only exists to make
// recording that clip easy: it flies through every waypoint on its own,
// looping continuously, so whoever is screen-recording doesn't have to
// click through the route by hand.
const AUTO_FLY_INITIAL_DELAY_MS = 1200;
const AUTO_FLY_STEP_MS = 3200;

export default function TrekRoute3DCanvas({
  waypoints,
  autoFly = false,
}: {
  waypoints: TrekWaypoint[];
  autoFly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const autoFlyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flyToWaypoint(point: TrekWaypoint, bearing: number) {
    const map = mapRef.current;
    if (!map) return;

    const center: [number, number] = [point.longitude, point.latitude];

    map.flyTo({
      center,
      zoom: 14.5,
      pitch: 60,
      bearing,
      duration: 2500,
      essential: true,
    });

    // Otherwise every stop (manual clicks, or each loop of auto-fly) leaves
    // its popup open, stacking up over the recording instead of showing
    // just the current waypoint.
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({
      offset: 25,
      closeButton: true,
      className: "route3d-popup",
    })
      .setLngLat(center)
      .setHTML(popupHtml(point))
      .addTo(map);
  }

  useEffect(() => {
    if (!containerRef.current || waypoints.length === 0) return;

    ensureRoute3DStyles();

    const centerLng =
      waypoints.reduce((sum, w) => sum + w.longitude, 0) / waypoints.length;
    const centerLat =
      waypoints.reduce((sum, w) => sum + w.latitude, 0) / waypoints.length;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [centerLng, centerLat],
      zoom: 13,
      pitch: 60,
      bearing: 30,
      // Free panning/zooming/rotating loads a fresh batch of satellite and
      // terrain tiles every time (15+ image requests per gesture) — the
      // camera should only move via the waypoint buttons/markers below,
      // which fly to a fixed set of points instead of unbounded exploring.
      interactive: false,
      canvasContextAttributes: { antialias: true },
    });

    mapRef.current = map;

    map.on("load", () => {
      map.setTerrain({ source: "terrain-dem", exaggeration: 1.2 });

      map.setSky({
        "sky-color": "#0d0d0d",
        "sky-horizon-blend": 0.5,
        "horizon-color": "#1b1b1b",
        "horizon-fog-blend": 0.5,
        "fog-color": "#1b1b1b",
        "fog-ground-blend": 0.5,
      });

      waypoints.forEach((point, i) => {
        const el = document.createElement("div");
        el.className = "route3d-marker";
        el.textContent = String(i + 1);

        el.addEventListener("click", () => flyToWaypoint(point, 30 + i * 40));

        new maplibregl.Marker({ element: el })
          .setLngLat([point.longitude, point.latitude])
          .addTo(map);
      });

      if (autoFly && waypoints.length > 0) {
        let step = 0;

        function flyNext() {
          const point = waypoints[step % waypoints.length];
          flyToWaypoint(point, 30 + step * 40);
          step += 1;
          autoFlyTimeoutRef.current = setTimeout(flyNext, AUTO_FLY_STEP_MS);
        }

        autoFlyTimeoutRef.current = setTimeout(flyNext, AUTO_FLY_INITIAL_DELAY_MS);
      }
    });

    return () => {
      if (autoFlyTimeoutRef.current) clearTimeout(autoFlyTimeoutRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [waypoints, autoFly]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      <div className="route3d-panel">
        {waypoints.map((point, i) => (
          <button
            key={point.id}
            type="button"
            onClick={() => flyToWaypoint(point, 30 + i * 40)}
          >
            {point.label}
          </button>
        ))}
      </div>
    </div>
  );
}
