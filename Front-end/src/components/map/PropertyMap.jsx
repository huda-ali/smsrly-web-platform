import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker asset links (Vite/Webpack build system issue)
function fixLeafletIcons() {
  try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  } catch (_) {}
}

export default function PropertyMap({ lat, lng, markers = [], height = '280px', zoom = 14, onLocationSelect, editable = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pinMarkerRef = useRef(null);
  const [error, setError] = useState(false);

  // Egypt's Bounding Coordinates Box (SouthWest to NorthEast borders)
  const egyptBounds = L.latLngBounds(
    [21.99, 24.69], // Bottom-Left Corner (Border near Sudan/Libya)
    [31.67, 36.89]  // Top-Right Corner (Mediterranean Coast near Sinai)
  );

  useEffect(() => {
    if (!mapRef.current) return;

    // Reset clean map instances to prevent "Map container already initialized" crashes
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    fixLeafletIcons();

    try {
      // 1. BOUNDS RESTRAINT: Lock navigation context within Egypt boundaries
      const map = L.map(mapRef.current, {
        center: [lat || 30.0444, lng || 31.2357], // Defaults straight to Cairo
        zoom,
        minZoom: 6,                     // Stops users from zooming out into outer space
        maxBounds: egyptBounds,         // Restricts panning away from Egypt
        maxBoundsViscosity: 1.0,        // Solid rubber-band barrier back to bounds
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Force-refresh Layout Rendering Frame
      setTimeout(() => map.invalidateSize(), 200);

      // 2. DYNAMIC AUTO-FIT: Center on explicit markers or scale canvas to frame everything
      if (markers.length > 0) {
        const markerPoints = markers
          .filter(m => m.lat && m.lng)
          .map(m => L.latLng(m.lat, m.lng));

        if (markerPoints.length > 0) {
          const dynamicallyBoundArea = L.latLngBounds(markerPoints);
          map.fitBounds(dynamicallyBoundArea, {
            padding: [50, 50], // Extra safety pixel margin so points don't clip at borders
            maxZoom: 15        // Stops deep zooming if only 1 item matches criteria
          });
        }
      } else if (lat && lng) {
        map.setView([lat, lng], zoom);
      } else {
        map.fitBounds(egyptBounds); // Reset out to safe country framework perspective if empty
      }

      // 3. BRAND LOGO INTERFACE LAYER: Inject an overlay onto the viewport canvas
      const LogoControl = L.Control.extend({
        options: { position: 'bottomleft' }, // Places it securely out of navigation lanes
        onAdd: function() {
          const div = L.DomUtil.create('div', 'map-brand-watermark');
          div.innerHTML = `
            <div style="
              background: rgba(29, 58, 107, 0.9);
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              font-family: sans-serif;
              font-weight: 800;
              font-size: 13px;
              letter-spacing: 1px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              display: flex;
              align-items: center;
              gap: 6px;
              user-select: none;
            ">
              <i class="fas fa-home" style="color: #60a5fa;"></i>
              SMSRLY
            </div>
          `;
          return div;
        }
      });
      map.addControl(new LogoControl());

      // Main Property Landmark Pin (draggable + click-to-place when editable)
      if (lat && lng) {
        const mainIcon = L.divIcon({
          html: `<div style="
            background:#dc2626;color:#fff;
            padding:6px 12px;border-radius:20px;
            font-size:12px;font-weight:700;
            white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);
            border:2px solid #fff;
          "><i class="fas fa-building" style="margin-right:4px"></i>${editable ? 'Property Location' : 'Selected'}</div>`,
          className: '',
          iconAnchor: [40, 20],
        });
        const pin = L.marker([lat, lng], { icon: mainIcon, draggable: editable }).addTo(map);
        pinMarkerRef.current = pin;
        if (editable) {
          pin.on('dragend', () => {
            const pos = pin.getLatLng();
            onLocationSelect?.(pos.lat, pos.lng);
          });
        }
      }

      // Price Pin Bubble Generators
      markers.forEach(m => {
        if (!m.lat || !m.lng) return;
        const priceIcon = L.divIcon({
          html: `<div style="
            background:#1d3a6b;color:#fff;
            padding:5px 10px;border-radius:8px;
            font-size:11px;font-weight:700;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
            border:2px solid #fff;cursor:pointer;
            white-space:nowrap;
          ">${m.price >= 1000 ? (m.price / 1000).toFixed(1) + 'k' : m.price} EGP</div>`,
          className: '',
          iconAnchor: [30, 18],
        });
        
        const mk = L.marker([m.lat, m.lng], { icon: priceIcon }).addTo(map);
        if (m.id) {
          mk.on('click', () => {
            window.location.href = `/property/${m.id}`;
          });
        }
      });

      // Click to Select Coordinates Callback
      if (onLocationSelect) {
        map.on('click', (e) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

    } catch (err) {
      console.error("Leaflet Execution Crash Code:", err);
      setError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, zoom, markers]); 
  if (error) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#64748b' }}>
        <i className="fas fa-exclamation-circle fa-2x"></i>
        <span style={{ fontSize: 13 }}>Map initialization failed. Verify browser layout coordinates.</span>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: 10, zIndex: 1, position: 'relative' }}
    />
  );
}