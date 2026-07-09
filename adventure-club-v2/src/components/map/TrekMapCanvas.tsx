"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { TrekMapPin } from "@/types/homepage";

const MARKER_STYLE_ID = "trek-map-marker-styles";

const COLLEGE = {
  name: "Srishti Manipal Institute of Art, Design and Technology (New Campus, Bangalore)",
  latitude: 13.1257435,
  longitude: 77.591569,
};

// Injected once into <head> rather than per-marker — this CSS backs the
// plain HTML strings handed to L.divIcon/bindPopup below, since Leaflet
// mounts that markup outside React's tree (CSS Modules can't reach it).
// CSS custom properties still resolve normally here since they cascade
// through the whole document regardless of where a node came from.
function ensureMarkerStyles() {
  if (document.getElementById(MARKER_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = MARKER_STYLE_ID;
  style.textContent = `
    .trek-pin {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: var(--color-midnight, #0d0d0d);
      border: 2px solid var(--color-midnight, #0d0d0d);
    }
    .trek-pin--upcoming {
      background: var(--color-accent, #22c55e);
      animation: trekPinPulse 2s infinite;
    }
    .trek-pin--completed {
      background: var(--color-accent, #22c55e);
    }
    @keyframes trekPinPulse {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
      70% { box-shadow: 0 0 0 14px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }
    .college-pin {
      width: 20px;
      height: 20px;
      background: var(--color-accent, #22c55e);
      border: 2px solid var(--color-midnight, #0d0d0d);
      transform: rotate(45deg);
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
    }
    .leaflet-popup-content-wrapper {
      background: var(--color-charcoal, #1b1b1b);
      border-radius: 12px;
      padding: 0;
    }
    .leaflet-popup-content {
      margin: 0;
      width: 240px !important;
    }
    .leaflet-popup-tip {
      background: var(--color-charcoal, #1b1b1b);
    }
  `;
  document.head.appendChild(style);
}

function popupHtml(pin: TrekMapPin) {
  const dateLabel = new Date(pin.date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const actionHtml = pin.isHistorical
    ? `<span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;background:rgba(34,197,94,0.18);color:var(--color-accent, #22c55e);">Completed</span>`
    : `<a href="/treks/${pin.id}" style="font-size:13px;font-weight:600;color:var(--color-accent, #22c55e);text-decoration:none;">View Trek &rarr;</a>`;

  return `
    <div style="font-family:inherit;">
      <div style="position:relative;height:120px;">
        <img src="${pin.coverImage}" alt="${pin.title}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:12px 12px 0 0;" />
        <span style="position:absolute;top:10px;left:10px;padding:5px 12px;border-radius:999px;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:600;background:rgba(245,245,245,0.15);color:var(--color-text, #f5f5f5);backdrop-filter:blur(6px);">${pin.difficulty}</span>
      </div>
      <div style="padding:14px 16px;">
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--color-text-muted, #9ca3af);margin:0 0 4px;">${pin.destination}</p>
        <h4 style="font-family:var(--font-display, inherit);font-size:18px;color:var(--color-text, #f5f5f5);margin:0 0 10px;">${pin.title}</h4>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:12px;color:var(--color-text-muted, #9ca3af);">${dateLabel}</span>
          ${actionHtml}
        </div>
      </div>
    </div>
  `;
}

export default function TrekMapCanvas({ pins }: { pins: TrekMapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    ensureMarkerStyles();

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
    }).setView([13.0827, 77.5946], 8);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    const markers: L.Marker[] = pins.map((pin) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="trek-pin ${pin.isHistorical ? "trek-pin--completed" : "trek-pin--upcoming"}">${pin.isHistorical ? "&#10003;" : ""}</div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10],
      });

      return L.marker([pin.latitude, pin.longitude], { icon })
        .addTo(map)
        .bindPopup(popupHtml(pin));
    });

    const collegeIcon = L.divIcon({
      className: "",
      html: `<div class="college-pin"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
    });

    const collegeMarker = L.marker([COLLEGE.latitude, COLLEGE.longitude], {
      icon: collegeIcon,
    })
      .addTo(map)
      .bindPopup(
        `<div style="padding:14px 16px;"><h4 style="font-family:var(--font-display, inherit);font-size:16px;color:var(--color-text, #f5f5f5);margin:0;">${COLLEGE.name}</h4></div>`
      );

    const allPoints = [...markers.map((m) => m.getLatLng()), collegeMarker.getLatLng()];

    if (allPoints.length === 1) {
      map.setView(allPoints[0], 11);
    } else {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds.pad(0.25));
    }

    return () => {
      map.remove();
    };
  }, [pins]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
