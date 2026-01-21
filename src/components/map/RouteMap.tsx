import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/contexts/LanguageContext";

interface City {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

interface RouteMapProps {
  fromCity: City | null;
  toCity: City | null;
  distance?: number;
}

const countryFlags: Record<string, string> = {
  UZ: "🇺🇿",
  KZ: "🇰🇿",
  KG: "🇰🇬",
  TJ: "🇹🇯",
  TM: "🇹🇲",
  AF: "🇦🇫",
};

export const RouteMap = ({ fromCity, toCity, distance }: RouteMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([41.3, 64.5], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    if (!fromCity || !toCity) {
      map.setView([41.3, 64.5], 5);
      return;
    }

    // Create custom icon
    const createIcon = (color: string, emoji: string) => {
      return L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
          ">
            ${emoji}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    };

    // Add markers
    const fromMarker = L.marker([fromCity.lat, fromCity.lon], {
      icon: createIcon("#22c55e", countryFlags[fromCity.country] || "📍"),
    }).addTo(map);
    
    const toMarker = L.marker([toCity.lat, toCity.lon], {
      icon: createIcon("#ef4444", countryFlags[toCity.country] || "🏁"),
    }).addTo(map);

    // Add popups
    fromMarker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong>${fromCity.name}</strong><br/>
        <span style="color: #22c55e;">● ${t("calculator.from")}</span>
      </div>
    `);

    toMarker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <strong>${toCity.name}</strong><br/>
        <span style="color: #ef4444;">● ${t("calculator.to")}</span>
        ${distance ? `<br/><strong>${distance} ${t("common.km")}</strong>` : ""}
      </div>
    `);

    // Draw route line with animation effect
    const routeCoords: L.LatLngExpression[] = [
      [fromCity.lat, fromCity.lon],
      [toCity.lat, toCity.lon],
    ];

    // Add curved line effect
    const midLat = (fromCity.lat + toCity.lat) / 2;
    const midLon = (fromCity.lon + toCity.lon) / 2;
    const offset = Math.abs(fromCity.lon - toCity.lon) * 0.15;
    
    const curvedRoute: L.LatLngExpression[] = [
      [fromCity.lat, fromCity.lon],
      [midLat + offset, midLon],
      [toCity.lat, toCity.lon],
    ];

    // Main route line
    L.polyline(curvedRoute, {
      color: "#3b82f6",
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1,
      dashArray: "10, 10",
    }).addTo(map);

    // Background line for contrast
    L.polyline(curvedRoute, {
      color: "#1e40af",
      weight: 6,
      opacity: 0.3,
      smoothFactor: 1,
    }).addTo(map);

    // Fit bounds
    const bounds = L.latLngBounds([
      [fromCity.lat, fromCity.lon],
      [toCity.lat, toCity.lon],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      // Cleanup markers on unmount
    };
  }, [fromCity, toCity, distance, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[300px] rounded-lg overflow-hidden border"
      style={{ zIndex: 0 }}
    />
  );
};
