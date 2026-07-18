import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function fixLeafletIcons() {
  try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  } catch (_) {}
}

export default function PropertyMap({
  lat,
  lng,
  markers = [],
  height = "280px",
  zoom = 14,
  onLocationSelect,
  editable = false,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pinMarkerRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    fixLeafletIcons();

    try {
      const worldBounds = L.latLngBounds(
        L.latLng(-90, -180),
        L.latLng(90, 180),
      );

      const map = L.map(mapRef.current, {
        center: [lat || 30.0444, lng || 31.2357],
        zoom,
        zoomControl: true,
        minZoom: 2,
        maxBounds: worldBounds,
        maxBoundsViscosity: 1.0,
        worldCopyJump: false,
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        noWrap: true,
        bounds: worldBounds,
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 200);

      if (markers.length > 0) {
        const points = [];
        markers.forEach((m) => {
          if (!m.lat || !m.lng) return;
          points.push([m.lat, m.lng]);
          const mk = L.marker([m.lat, m.lng]).addTo(map);
          if (m.price) {
            mk.bindPopup(`<strong>${m.price.toLocaleString()} EGP</strong>`);
          }
          if (m.id) {
            mk.on("click", () => {
              window.location.href = `/property/${m.id}`;
            });
          }
        });
        if (points.length > 0) {
          map.fitBounds(L.latLngBounds(points), {
            padding: [40, 40],
            maxZoom: 15,
          });
        }
      } else if (lat && lng) {
        map.setView([lat, lng], zoom);
        const marker = L.marker([lat, lng], { draggable: editable }).addTo(map);
        pinMarkerRef.current = marker;
        if (editable) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onLocationSelect?.(pos.lat, pos.lng);
          });
        }
      }

      if (editable) {
        map.on("click", (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          if (pinMarkerRef.current) {
            pinMarkerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            pinMarkerRef.current = L.marker([clickLat, clickLng], {
              draggable: true,
            }).addTo(map);
            pinMarkerRef.current.on("dragend", () => {
              const pos = pinMarkerRef.current.getLatLng();
              onLocationSelect?.(pos.lat, pos.lng);
            });
          }
          onLocationSelect?.(clickLat, clickLng);
        });
      }
    } catch (err) {
      console.error("Leaflet map failed to initialize:", err);
      setError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, zoom, markers, editable]);

  if (error) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: "280px",
          borderRadius: 10,
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
          color: "#64748b",
        }}
      >
        <i className="fas fa-exclamation-circle fa-2x"></i>
        <span style={{ fontSize: 13 }}>Map failed to load.</span>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height,
        minHeight: height,
        borderRadius: 10,
        zIndex: 1,
        position: "relative",
      }}
    />
  );
}
