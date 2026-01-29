import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Truck, 
  Clock, 
  Fuel, 
  DollarSign, 
  Route, 
  Settings, 
  Zap,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface RoutePoint {
  id: string;
  address: string;
  coordinates: [number, number];
  type: 'pickup' | 'delivery' | 'waypoint';
  priority: 'high' | 'medium' | 'low';
  timeWindow?: {
    start: string;
    end: string;
  };
  estimatedTime?: number;
}

interface OptimizationPreferences {
  optimizeFor: 'time' | 'distance' | 'fuel' | 'cost';
  avoidTolls: boolean;
  avoidHighways: boolean;
  considerTraffic: boolean;
  maxStopsPerRoute: number;
  workingHours: {
    start: string;
    end: string;
  };
  breakTime: number; // minutes
  fuelPrice: number; // per liter
  averageSpeed: number; // km/h
  fuelConsumption: number; // liters per 100km
}

interface OptimizationResult {
  routes: {
    id: string;
    points: RoutePoint[];
    totalDistance: number;
    totalDuration: number;
    fuelCost: number;
    estimatedCost: number;
    efficiency: number;
  }[];
  totalSavings: {
    time: number;
    distance: number;
    cost: number;
    fuel: number;
  };
}

export const RouteOptimizer: React.FC<{
  routePoints: RoutePoint[];
  onOptimizationComplete: (result: OptimizationResult) => void;
}> = ({ routePoints, onOptimizationComplete }) => {
  const [preferences, setPreferences] = useState<OptimizationPreferences>({
    optimizeFor: 'time',
    avoidTolls: false,
    avoidHighways: false,
    considerTraffic: true,
    maxStopsPerRoute: 8,
    workingHours: {
      start: '08:00',
      end: '18:00'
    },
    breakTime: 30,
    fuelPrice: 1.5,
    averageSpeed: 50,
    fuelConsumption: 8
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const optimizeRoutes = async () => {
    setIsOptimizing(true);
    
    try {
      // Simulate API call to optimization service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simple optimization logic (in real app, this would call Mapbox Optimization API)
      const optimizedRoutes = simulateOptimization(routePoints, preferences);
      
      setResult(optimizedRoutes);
      onOptimizationComplete(optimizedRoutes);
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const simulateOptimization = (points: RoutePoint[], prefs: OptimizationPreferences): OptimizationResult => {
    // Group points by priority and create optimized routes
    const highPriorityPoints = points.filter(p => p.priority === 'high');
    const mediumPriorityPoints = points.filter(p => p.priority === 'medium');
    const lowPriorityPoints = points.filter(p => p.priority === 'low');
    
    const allPoints = [...highPriorityPoints, ...mediumPriorityPoints, ...lowPriorityPoints];
    
    // Create routes based on max stops per route
    const routes = [];
    const totalRoutes = Math.ceil(allPoints.length / prefs.maxStopsPerRoute);
    
    for (let i = 0; i < totalRoutes; i++) {
      const routePoints = allPoints.slice(i * prefs.maxStopsPerRoute, (i + 1) * prefs.maxStopsPerRoute);
      const distance = calculateRouteDistance(routePoints);
      const duration = calculateRouteDuration(routePoints, prefs);
      const fuelCost = (distance / 100) * prefs.fuelConsumption * prefs.fuelPrice;
      const estimatedCost = fuelCost + (duration / 60) * 20; // Add driver cost
      
      routes.push({
        id: `route-${i + 1}`,
        points: routePoints,
        totalDistance: distance,
        totalDuration: duration,
        fuelCost,
        estimatedCost,
        efficiency: calculateEfficiency(distance, duration, prefs)
      });
    }
    
    const totalSavings = {
      time: Math.round(allPoints.length * 15 * 0.2), // 20% time savings
      distance: Math.round(allPoints.length * 10 * 0.15), // 15% distance savings
      cost: Math.round(routes.reduce((sum, r) => sum + r.estimatedCost, 0) * 0.18), // 18% cost savings
      fuel: Math.round(routes.reduce((sum, r) => sum + r.fuelCost, 0) * 0.12) // 12% fuel savings
    };
    
    return { routes, totalSavings };
  };

  const calculateRouteDistance = (points: RoutePoint[]): number => {
    // Simplified distance calculation
    return points.length * 12.5; // Average 12.5km between stops
  };

  const calculateRouteDuration = (points: RoutePoint[], prefs: OptimizationPreferences): number => {
    const distance = calculateRouteDistance(points);
    const drivingTime = (distance / prefs.averageSpeed) * 60; // minutes
    const stopTime = points.length * 15; // 15 minutes per stop
    const breaks = Math.floor(drivingTime / 240) * prefs.breakTime; // Break every 4 hours
    
    return drivingTime + stopTime + breaks;
  };

  const calculateEfficiency = (distance: number, duration: number, prefs: OptimizationPreferences): number => {
    const baseEfficiency = 100;
    const timeEfficiency = prefs.optimizeFor === 'time' ? 20 : 0;
    const fuelEfficiency = prefs.optimizeFor === 'fuel' ? 15 : 0;
    const trafficBonus = prefs.considerTraffic ? 10 : 0;
    
    return Math.min(100, baseEfficiency + timeEfficiency + fuelEfficiency + trafficBonus);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Optimization Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Optimize For</Label>
              <div className="flex space-x-2 mt-2">
                {(['time', 'distance', 'fuel', 'cost'] as const).map((option) => (
                  <Button
                    key={option}
                    variant={preferences.optimizeFor === option ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, optimizeFor: option }))}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Max Stops per Route</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={preferences.maxStopsPerRoute}
                  onChange={(e) => setPreferences(prev => ({ ...prev, maxStopsPerRoute: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">{preferences.maxStopsPerRoute}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={preferences.avoidTolls}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, avoidTolls: checked }))}
              />
              <Label className="text-sm">Avoid Tolls</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={preferences.avoidHighways}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, avoidHighways: checked }))}
              />
              <Label className="text-sm">Avoid Highways</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={preferences.considerTraffic}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, considerTraffic: checked }))}
              />
              <Label className="text-sm">Consider Traffic</Label>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Fuel Price ($/L)</Label>
              <input
                type="number"
                step="0.1"
                value={preferences.fuelPrice}
                onChange={(e) => setPreferences(prev => ({ ...prev, fuelPrice: parseFloat(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Avg Speed (km/h)</Label>
              <input
                type="number"
                value={preferences.averageSpeed}
                onChange={(e) => setPreferences(prev => ({ ...prev, averageSpeed: parseInt(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Fuel (L/100km)</Label>
              <input
                type="number"
                step="0.1"
                value={preferences.fuelConsumption}
                onChange={(e) => setPreferences(prev => ({ ...prev, fuelConsumption: parseFloat(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Break Time (min)</Label>
              <input
                type="number"
                value={preferences.breakTime}
                onChange={(e) => setPreferences(prev => ({ ...prev, breakTime: parseInt(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          
          <Button 
            onClick={optimizeRoutes} 
            disabled={isOptimizing || routePoints.length < 2}
            className="w-full"
          >
            {isOptimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Optimizing Routes...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Optimize Routes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Optimization Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.totalSavings.time}min</div>
                  <div className="text-sm text-gray-600">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.totalSavings.distance}km</div>
                  <div className="text-sm text-gray-600">Distance Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">${result.totalSavings.cost}</div>
                  <div className="text-sm text-gray-600">Cost Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{result.totalSavings.fuel}L</div>
                  <div className="text-sm text-gray-600">Fuel Saved</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {result.routes.map((route) => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Route className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{route.id}</span>
                        <Badge variant="outline">{route.points.length} stops</Badge>
                        <Badge variant="secondary">{route.efficiency}% efficient</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-600">Distance:</span>
                        </div>
                        <div className="font-medium">{route.totalDistance.toFixed(1)} km</div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-600">Duration:</span>
                        </div>
                        <div className="font-medium">{Math.round(route.totalDuration)} min</div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <Fuel className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-600">Fuel Cost:</span>
                        </div>
                        <div className="font-medium">${route.fuelCost.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-600">Total Cost:</span>
                        </div>
                        <div className="font-medium">${route.estimatedCost.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
