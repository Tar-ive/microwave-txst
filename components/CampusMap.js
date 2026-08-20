"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { statusMeta, timeAgo } from "../lib/ui";
import "leaflet/dist/leaflet.css";

// Interactive campus map (Leaflet + OpenStreetMap tiles) with
// status-colored pins for every microwave.
export default function CampusMap({ microwaves }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          center: [29.8888, -97.9435],
          zoom: 16,
          scrollWheelZoom: false,
          tapHold: false,
        });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapRef.current);
      }

      // refresh markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = microwaves.map((mw) => {
        const meta = statusMeta(mw.latestStatus);
        const icon = L.divIcon({
          className: "mw-marker",
          html: `<div class="pin" style="background:${meta.color}"><span>${meta.emoji}</span></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -26],
        });
        const marker = L.marker([mw.lat, mw.lng], { icon }).addTo(
          mapRef.current
        );
        marker.bindPopup(
          `<div style="font-family:inherit;min-width:150px">
            <strong>${mw.name}</strong><br/>
            <span style="color:${meta.color};font-weight:700">${meta.emoji} ${meta.label}</span>
            <span style="color:#777"> · ${timeAgo(mw.latestAt)}</span><br/>
            <a href="/m/${mw.id}" style="color:#501214;font-weight:700">Details &amp; report →</a>
          </div>`
        );
        return marker;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [microwaves, router]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map" />
    </div>
  );
}
