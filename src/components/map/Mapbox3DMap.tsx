import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG } from '@/config/mapbox';
import { cn } from '@/lib/utils';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

interface Mapbox3DMapProps {
  className?: string;
  height?: string;
  autoFlyTo?: boolean;
  targetLocation?: {
    coordinates: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
  };
  markers?: Array<{
    coordinates: [number, number];
    title: string;
    description?: string;
    icon?: string;
    color?: string;
  }>;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export const Mapbox3DMap: React.FC<Mapbox3DMapProps> = ({
  className,
  height = '500px',
  autoFlyTo = true,
  targetLocation = {
    coordinates: [55.7558, 37.6173], // Moscow
    zoom: 15,
    pitch: 60,
    bearing: 0
  },
  markers = [],
  onMapLoad
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize Mapbox GL JS map with 3D features
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.styles.dark, // Dark theme for night effect
      center: targetLocation.coordinates,
      zoom: targetLocation.zoom,
      pitch: targetLocation.pitch,
      bearing: targetLocation.bearing,
      antialias: true, // Enable antialiasing for better 3D rendering
      attributionControl: false,
    });

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add 3D terrain and buildings when map loads
    mapInstance.on('load', () => {
      setIsLoaded(true);
      
      // Add 3D terrain
      mapInstance.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });

      // Set the terrain source with exaggeration for dramatic effect
      mapInstance.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

      // Add 3D building layer
      mapInstance.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            '#1a1a2e',
            18,
            '#16213e'
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.8
        }
      });

      // Add atmospheric lighting effects
      mapInstance.setFog({
        'horizon-blend': 0.1,
        'color': '#2c3e50',
        'high-color': '#243447',
        'space-color': '#0f0f23',
        'star-intensity': 0.15
      });

      // Auto fly to target location with animation
      if (autoFlyTo) {
        setTimeout(() => {
          setIsFlying(true);
          mapInstance.flyTo({
            center: targetLocation.coordinates,
            zoom: targetLocation.zoom,
            pitch: targetLocation.pitch,
            bearing: targetLocation.bearing,
            speed: 1.2,
            curve: 1.4,
            easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t, // Ease-in-out cubic
            essential: true
          });

          setTimeout(() => {
            setIsFlying(false);
          }, 3000);
        }, 1000);
      }

      // Add custom markers
      markers.forEach((marker, index) => {
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-3d-marker';
        markerElement.innerHTML = `
          <div class="marker-3d" style="
            background: ${marker.color || '#3B82F6'};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border: 3px solid rgba(255,255,255,0.2);
            animation: pulse 2s infinite;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            ${marker.icon || `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`}
          </div>
          <div class="marker-label" style="
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            backdrop-filter: blur(10px);
          ">
            ${marker.title}
          </div>
        `;

        // Add hover effect
        markerElement.addEventListener('mouseenter', () => {
          markerElement.querySelector('.marker-3d')!.style.transform = 'scale(1.1)';
          markerElement.querySelector('.marker-3d')!.style.boxShadow = '0 6px 30px rgba(59,130,246,0.5)';
        });

        markerElement.addEventListener('mouseleave', () => {
          markerElement.querySelector('.marker-3d')!.style.transform = 'scale(1)';
          markerElement.querySelector('.marker-3d')!.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        });

        new mapboxgl.Marker({
          element: markerElement,
          anchor: 'bottom',
          offset: [0, 20]
        })
        .setLngLat(marker.coordinates)
        .setPopup(new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'custom-popup-3d'
        }).setHTML(`
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            max-width: 250px;
          ">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${marker.title}</h3>
            ${marker.description ? `<p style="margin: 0; font-size: 14px; opacity: 0.9;">${marker.description}</p>` : ''}
          </div>
        `))
        .addTo(mapInstance);
      });

      // Add animated route lines if multiple markers
      if (markers.length > 1) {
        const coordinates = markers.map(m => m.coordinates);
        
        mapInstance.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': coordinates
            }
          }
        });

        mapInstance.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#3B82F6',
            'line-width': 4,
            'line-opacity': 0.8,
            'line-blur': 0.5
          }
        });

        // Animate the route
        let progress = 0;
        const animateRoute = () => {
          progress += 0.01;
          if (progress > 1) progress = 0;

          // Update route animation
          mapInstance.setPaintProperty('route', 'line-opacity', 0.3 + Math.sin(progress * Math.PI * 2) * 0.3);
          
          requestAnimationFrame(animateRoute);
        };
        animateRoute();
      }

      onMapLoad?.(mapInstance);
    });

    // Add custom CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      .custom-popup-3d .mapboxgl-popup-content {
        background: transparent !important;
        padding: 0 !important;
      }
      
      .custom-popup-3d .mapboxgl-popup-tip {
        display: none;
      }
    `;
    document.head.appendChild(style);

    map.current = mapInstance;

    return () => {
      map.current?.remove();
      document.head.removeChild(style);
    };
  }, []);

  // Add keyboard controls for camera movement
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!map.current || !isLoaded) return;

      switch(e.key) {
        case 'ArrowUp':
          map.current.easeTo({ pitch: Math.min(map.current.getPitch() + 5, 85) });
          break;
        case 'ArrowDown':
          map.current.easeTo({ pitch: Math.max(map.current.getPitch() - 5, 0) });
          break;
        case 'ArrowLeft':
          map.current.easeTo({ bearing: map.current.getBearing() - 10 });
          break;
        case 'ArrowRight':
          map.current.easeTo({ bearing: map.current.getBearing() + 10 });
          break;
        case '+':
        case '=':
          map.current.easeTo({ zoom: Math.min(map.current.getZoom() + 1, 20) });
          break;
        case '-':
        case '_':
          map.current.easeTo({ zoom: Math.max(map.current.getZoom() - 1, 1) });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLoaded]);

  return (
    <div className={cn("relative", className)}>
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg overflow-hidden shadow-2xl"
        style={{ height }}
      />
      
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-sm">Загрузка 3D карты...</p>
          </div>
        </div>
      )}
      
      {/* Flying indicator */}
      {isFlying && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full text-sm backdrop-blur-sm">
          ✈️ Полет к цели...
        </div>
      )}
      
      {/* Controls hint */}
      {isLoaded && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-sm">
          <div>🎮 Управление:</div>
          <div>↑↓ - Наклон | ←→ - Поворот | +/- - Масштаб</div>
        </div>
      )}
    </div>
  );
};
