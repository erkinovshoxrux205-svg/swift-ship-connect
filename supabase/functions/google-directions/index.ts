import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TravelMode = "driving" | "walking" | "transit" | "bicycling";

interface DirectionsRequest {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
  waypoints?: { lat: number; lng: number }[];
  mode?: TravelMode;
  alternatives?: boolean;
  language?: string;
}

interface RouteResult {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  durationInTraffic?: { text: string; value: number };
  startAddress: string;
  endAddress: string;
  points: { lat: number; lng: number }[];
  steps: {
    instruction: string;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    startLocation: { lat: number; lng: number };
    endLocation: { lat: number; lng: number };
    maneuver?: string;
    travelMode?: string;
    transitDetails?: {
      lineName: string;
      lineColor: string;
      vehicleType: string;
      departureStop: string;
      arrivalStop: string;
      numStops: number;
    };
  }[];
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  summary: string;
  warnings: string[];
}

// Decode Google's encoded polyline format
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

// Map travel mode to Routes API format
function mapTravelMode(mode: TravelMode): string {
  const modeMap: Record<TravelMode, string> = {
    driving: "DRIVE",
    walking: "WALK",
    transit: "TRANSIT",
    bicycling: "BICYCLE",
  };
  return modeMap[mode] || "DRIVE";
}

// Format duration text from seconds
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

// Format distance text from meters
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} км`;
  }
  return `${meters} м`;
}

// Extract maneuver from instruction
function extractManeuver(instruction: string): string | undefined {
  const lowerInstr = instruction.toLowerCase();
  if (lowerInstr.includes("turn left") || lowerInstr.includes("поверните налево")) return "turn-left";
  if (lowerInstr.includes("turn right") || lowerInstr.includes("поверните направо")) return "turn-right";
  if (lowerInstr.includes("u-turn") || lowerInstr.includes("разворот")) return "uturn";
  if (lowerInstr.includes("merge") || lowerInstr.includes("въезд")) return "merge";
  if (lowerInstr.includes("roundabout") || lowerInstr.includes("кольц")) return "roundabout";
  if (lowerInstr.includes("straight") || lowerInstr.includes("прямо")) return "straight";
  return undefined;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Google Maps API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      origin, 
      destination, 
      waypoints, 
      mode = "driving", 
      alternatives = false,
      language = "ru" 
    } = await req.json() as DirectionsRequest;

    console.log("Directions request:", { origin, destination, mode, alternatives, language });

    // Format location for Routes API
    const formatLocation = (loc: { lat: number; lng: number } | string): any => {
      if (typeof loc === "string") {
        return { address: loc };
      }
      return {
        location: {
          latLng: {
            latitude: loc.lat,
            longitude: loc.lng,
          },
        },
      };
    };

    // Build request body for Routes API
    const requestBody: any = {
      origin: formatLocation(origin),
      destination: formatLocation(destination),
      travelMode: mapTravelMode(mode),
      routingPreference: mode === "driving" ? "TRAFFIC_AWARE" : undefined,
      computeAlternativeRoutes: alternatives,
      languageCode: language,
      units: "METRIC",
    };

    // Add waypoints if provided
    if (waypoints && waypoints.length > 0) {
      requestBody.intermediates = waypoints.map(w => ({
        location: {
          latLng: {
            latitude: w.lat,
            longitude: w.lng,
          },
        },
      }));
    }

    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";

    console.log("Fetching directions from Routes API...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.startLocation,routes.legs.endLocation,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.startLocation,routes.legs.steps.endLocation,routes.viewport,routes.warnings,routes.description",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Routes API error:", data.error);
      return new Response(
        JSON.stringify({ 
          error: `Routes API error: ${data.error.status}`, 
          message: data.error.message,
          status: data.error.status
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.routes || data.routes.length === 0) {
      console.error("No routes found");
      return new Response(
        JSON.stringify({ error: "No routes found", status: "ZERO_RESULTS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse all routes
    const routes: RouteResult[] = data.routes.map((route: any) => {
      const leg = route.legs?.[0] || {};
      const durationSeconds = parseInt(route.duration?.replace("s", "") || "0");
      const distanceMeters = route.distanceMeters || 0;

      return {
        distance: { 
          text: formatDistance(distanceMeters), 
          value: distanceMeters 
        },
        duration: { 
          text: formatDuration(durationSeconds), 
          value: durationSeconds 
        },
        durationInTraffic: { 
          text: formatDuration(durationSeconds), 
          value: durationSeconds 
        },
        startAddress: "",
        endAddress: "",
        points: route.polyline?.encodedPolyline 
          ? decodePolyline(route.polyline.encodedPolyline) 
          : [],
        steps: (leg.steps || []).map((step: any) => {
          const stepDuration = parseInt(step.staticDuration?.replace("s", "") || "0");
          const stepDistance = step.distanceMeters || 0;
          const instruction = step.navigationInstruction?.instructions || "";
          
          return {
            instruction: instruction.replace(/<[^>]*>/g, ""),
            distance: { text: formatDistance(stepDistance), value: stepDistance },
            duration: { text: formatDuration(stepDuration), value: stepDuration },
            startLocation: step.startLocation?.latLng 
              ? { lat: step.startLocation.latLng.latitude, lng: step.startLocation.latLng.longitude }
              : { lat: 0, lng: 0 },
            endLocation: step.endLocation?.latLng
              ? { lat: step.endLocation.latLng.latitude, lng: step.endLocation.latLng.longitude }
              : { lat: 0, lng: 0 },
            maneuver: extractManeuver(instruction),
            travelMode: mode.toUpperCase(),
          };
        }),
        bounds: route.viewport ? {
          northeast: { 
            lat: route.viewport.high?.latitude || 0, 
            lng: route.viewport.high?.longitude || 0 
          },
          southwest: { 
            lat: route.viewport.low?.latitude || 0, 
            lng: route.viewport.low?.longitude || 0 
          },
        } : {
          northeast: { lat: 0, lng: 0 },
          southwest: { lat: 0, lng: 0 },
        },
        summary: route.description || "",
        warnings: route.warnings || [],
      };
    });

    console.log("Directions fetched successfully:", {
      routesCount: routes.length,
      mainRoute: {
        distance: routes[0].distance.text,
        duration: routes[0].duration.text,
      },
    });

    return new Response(
      JSON.stringify({ 
        routes,
        ...routes[0]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in google-directions:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
