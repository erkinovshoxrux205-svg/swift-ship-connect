import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapPin, Navigation, Clock, Fuel } from 'lucide-react';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import { cn } from '@/lib/utils';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

interface RoutePoint {
  coordinates: [number, number];
  address: string;
  type: 'pickup' | 'delivery' | 'waypoint';
}

interface RouteInfo {
  distance: number; // in km
  duration: number; // in minutes
  fuelEstimate: number; // in liters
  tolls: number; // in currency
}

interface MapboxRouteMapProps {
  routePoints: RoutePoint[];
  className?: string;
  onRouteUpdate?: (routeInfo: RouteInfo) => void;
  height?: string;
}

export const MapboxRouteMap: React.FC<MapboxRouteMapProps> = ({
  routePoints,
  className,
  onRouteUpdate,
  height = '400px'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || routePoints.length < 2) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.styles.streets,
      center: routePoints[0].coordinates,
      zoom: MAPBOX_CONFIG.defaults.zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Fit map to show all points
    const bounds = new mapboxgl.LngLatBounds();
    routePoints.forEach(point => bounds.extend(point.coordinates));
    map.current.fitBounds(bounds, { padding: 50 });

    return () => {
      map.current?.remove();
    };
  }, [routePoints]);

  useEffect(() => {
    if (!map.current || routePoints.length < 2) return;

    const calculateRoute = async () => {
      setIsLoading(true);
      
      try {
        // Create coordinates string for Mapbox Directions API
        const coordinates = routePoints
          .map(point => point.coordinates.join(','))
          .join(';');

        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?` +
          `access_token=${MAPBOX_CONFIG.accessToken}&` +
          `overview=full&` +
          `geometries=geojson&` +
          `steps=true&` +
          `annotations=speed,congestion,distance,duration`
        );

        if (!response.ok) throw new Error('Route calculation failed');

        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          
          // Calculate route info
          const info: RouteInfo = {
            distance: route.distance / 1000, // Convert to km
            duration: route.duration / 60, // Convert to minutes
            fuelEstimate: (route.distance / 1000) * 0.08, // 8L per 100km average
            tolls: 0 // Mapbox doesn't provide toll info in basic API
          };

          setRouteInfo(info);
          onRouteUpdate?.(info);

          // Draw route on map
          if (map.current.getSource('route')) {
            map.current.removeLayer('route');
            map.current.removeSource('route');
          }

          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          // Add markers for each point
          routePoints.forEach((point, index) => {
            const markerElement = document.createElement('div');
            markerElement.className = 'flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs';
            
            if (point.type === 'pickup') {
              markerElement.className += ' bg-green-500';
              markerElement.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6c0 1.887.864 3.578 2.242 4.68L10 18l3.758-5.32C15.136 11.578 16 9.887 16 8a6 6 0 00-6-6z"/></svg>';
            } else if (point.type === 'delivery') {
              markerElement.className += ' bg-red-500';
              markerElement.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6c0 1.887.864 3.578 2.242 4.68L10 18l3.758-5.32C15.136 11.578 16 9.887 16 8a6 6 0 00-6-6z"/></svg>';
            } else {
              markerElement.className += ' bg-blue-500';
              markerElement.innerHTML = `<span>${index + 1}</span>`;
            }

            new mapboxgl.Marker(markerElement)
              .setLngLat(point.coordinates)
              .setPopup(new mapboxgl.Popup().setHTML(`
                <div class="p-2">
                  <div class="font-semibold">${point.type === 'pickup' ? 'Pickup' : point.type === 'delivery' ? 'Delivery' : 'Stop'} ${index + 1}</div>
                  <div class="text-sm text-gray-600">${point.address}</div>
                </div>
              `))
              .addTo(map.current!);
          });
        }
      } catch (error) {
        console.error('Route calculation error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Wait for map to load before calculating route
    if (map.current.loaded()) {
      calculateRoute();
    } else {
      map.current.on('load', calculateRoute);
    }
  }, [routePoints, onRouteUpdate]);

  return (
    <div className={cn("space-y-4", className)}>
      <div 
        ref={mapContainer} 
        className="rounded-lg overflow-hidden border border-gray-200"
        style={{ height }}
      />
      
      {routeInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-xs text-blue-600 font-medium">Distance</div>
                <div className="text-sm font-bold text-blue-900">{routeInfo.distance.toFixed(1)} km</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-xs text-green-600 font-medium">Duration</div>
                <div className="text-sm font-bold text-green-900">{Math.round(routeInfo.duration)} min</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Fuel className="w-4 h-4 text-yellow-600" />
              <div>
                <div className="text-xs text-yellow-600 font-medium">Fuel Est.</div>
                <div className="text-sm font-bold text-yellow-900">{routeInfo.fuelEstimate.toFixed(1)} L</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-xs text-purple-600 font-medium">Stops</div>
                <div className="text-sm font-bold text-purple-900">{routePoints.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Calculating route...</span>
        </div>
      )}
    </div>
  );
};
