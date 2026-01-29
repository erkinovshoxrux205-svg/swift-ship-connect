import React, { useState, useEffect } from 'react';
import { Mapbox3DMap } from '@/components/map/Mapbox3DMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Camera, 
  Play, 
  Pause, 
  RotateCw,
  Building,
  Landmark,
  Route,
  Sparkles
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  coordinates: [number, number];
  description: string;
  icon?: string;
  color?: string;
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

const impressiveLocations: Location[] = [
  {
    id: 'moscow-kremlin',
    name: 'Московский Кремль',
    coordinates: [37.6178, 55.7517],
    description: 'Исторический центр Москвы, резиденция Президента России',
    icon: '🏰',
    color: '#DC2626',
    zoom: 16,
    pitch: 65,
    bearing: 45
  },
  {
    id: 'london-shard',
    name: 'The Shard, Лондон',
    coordinates: [-0.0863, 51.5045],
    description: 'Самое высокое здание в Западной Европе, 310 метров',
    icon: '🏢',
    color: '#3B82F6',
    zoom: 17,
    pitch: 70,
    bearing: 30
  },
  {
    id: 'dubai-burj',
    name: 'Burj Khalifa, Дубай',
    coordinates: [55.2744, 25.1972],
    description: 'Самое высокое здание в мире, 828 метров',
    icon: '🏗️',
    color: '#F59E0B',
    zoom: 16,
    pitch: 75,
    bearing: 0
  },
  {
    id: 'newyork-manhattan',
    name: 'Манхэттен, Нью-Йорк',
    coordinates: [-73.9857, 40.7484],
    description: 'Финансовый центр мира, небоскребы и огни города',
    icon: '🌃',
    color: '#8B5CF6',
    zoom: 15,
    pitch: 60,
    bearing: 270
  },
  {
    id: 'paris-eiffel',
    name: 'Эйфелева башня, Париж',
    coordinates: [2.2945, 48.8584],
    description: 'Символ Парижа и Франции, железная башня 324 метра',
    icon: '🗼',
    color: '#EC4899',
    zoom: 17,
    pitch: 65,
    bearing: 180
  },
  {
    id: 'tokyo-tower',
    name: 'Токийская башня, Токио',
    coordinates: [139.6917, 35.6586],
    description: 'Радиовышка и символ Токио, 333 метра высотой',
    icon: '🗾',
    color: '#10B981',
    zoom: 16,
    pitch: 70,
    bearing: 90
  }
];

export const ShowcaseMap: React.FC = () => {
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentLocation = impressiveLocations[currentLocationIndex];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentLocationIndex((prev) => (prev + 1) % impressiveLocations.length);
    }, 5000); // Change location every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Handle location change with animation
  const handleLocationChange = (index: number) => {
    setIsTransitioning(true);
    setCurrentLocationIndex(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  // Fly to current location
  const flyToLocation = (location: Location) => {
    if (!map) return;

    map.flyTo({
      center: location.coordinates,
      zoom: location.zoom || 16,
      pitch: location.pitch || 60,
      bearing: location.bearing || 0,
      speed: 1.5,
      curve: 1.8,
      easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      essential: true
    });
  };

  // Handle map load
  const handleMapLoad = (mapInstance: any) => {
    setMap(mapInstance);
    flyToLocation(currentLocation);
  };

  // Update map when location changes
  useEffect(() => {
    if (map && currentLocation) {
      flyToLocation(currentLocation);
    }
  }, [currentLocationIndex, map]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-yellow-400" />
            3D Карта Мира
            <Sparkles className="w-12 h-12 text-yellow-400" />
          </h1>
          <p className="text-xl text-gray-300">
            Путешествуйте по самым впечатляющим местам планеты в реальном времени
          </p>
        </div>

        {/* Main Map */}
        <div className="mb-8">
          <Mapbox3DMap
            height="600px"
            className="shadow-2xl rounded-2xl"
            autoFlyTo={false}
            targetLocation={{
              coordinates: currentLocation.coordinates,
              zoom: currentLocation.zoom || 16,
              pitch: currentLocation.pitch || 60,
              bearing: currentLocation.bearing || 0
            }}
            markers={[
              {
                coordinates: currentLocation.coordinates,
                title: currentLocation.name,
                description: currentLocation.description,
                icon: currentLocation.icon,
                color: currentLocation.color
              }
            ]}
            onMapLoad={handleMapLoad}
          />
        </div>

        {/* Location Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Location Info */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5" />
                Текущее местоположение
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{currentLocation.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{currentLocation.name}</h3>
                    <Badge className="mt-1" style={{ backgroundColor: currentLocation.color }}>
                      {currentLocation.coordinates[1].toFixed(4)}°, {currentLocation.coordinates[0].toFixed(4)}°
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-300">{currentLocation.description}</p>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-white/10 rounded p-2">
                    <div className="text-gray-400">Масштаб</div>
                    <div className="text-white font-bold">{currentLocation.zoom}z</div>
                  </div>
                  <div className="bg-white/10 rounded p-2">
                    <div className="text-gray-400">Наклон</div>
                    <div className="text-white font-bold">{currentLocation.pitch}°</div>
                  </div>
                  <div className="bg-white/10 rounded p-2">
                    <div className="text-gray-400">Поворот</div>
                    <div className="text-white font-bold">{currentLocation.bearing}°</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Navigation className="w-5 h-5" />
                Управление
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Auto-play controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`flex-1 ${isAutoPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isAutoPlaying ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Пауза
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Авто-пролет
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleLocationChange((currentLocationIndex + 1) % impressiveLocations.length)}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Location grid */}
                <div className="grid grid-cols-2 gap-2">
                  {impressiveLocations.map((location, index) => (
                    <Button
                      key={location.id}
                      onClick={() => handleLocationChange(index)}
                      variant={index === currentLocationIndex ? "default" : "outline"}
                      className={`p-3 h-auto flex flex-col items-center gap-1 ${
                        index === currentLocationIndex 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      }`}
                    >
                      <div className="text-2xl">{location.icon}</div>
                      <div className="text-xs text-center">{location.name}</div>
                    </Button>
                  ))}
                </div>

                {/* Instructions */}
                <div className="bg-white/5 rounded p-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4" />
                    <span className="font-semibold text-white">Управление камерой:</span>
                  </div>
                  <div>↑↓ - Наклон камеры</div>
                  <div>←→ - Поворот камеры</div>
                  <div>+/- - Масштабирование</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Building className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <h3 className="text-white font-semibold">3D Здания</h3>
              <p className="text-gray-300 text-sm">Реалистичные 3D модели зданий</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Route className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <h3 className="text-white font-semibold">Плавные анимации</h3>
              <p className="text-gray-300 text-sm">Кинематографичные перелеты</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Landmark className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <h3 className="text-white font-semibold">Знаменитые места</h3>
              <p className="text-gray-300 text-sm">Лучшие достопримечательности мира</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
