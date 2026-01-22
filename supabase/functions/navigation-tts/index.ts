import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Cloud TTS API endpoint
const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

// Russian WaveNet voice - clear, professional male voice
const VOICE_CONFIG = {
  languageCode: "ru-RU",
  name: "ru-RU-Wavenet-D",
  ssmlGender: "MALE",
};

// Audio settings optimized for navigation
const AUDIO_CONFIG = {
  audioEncoding: "MP3",
  speakingRate: 1.1, // Slightly faster for navigation
  pitch: 0,
  volumeGainDb: 2.0, // Louder for car environment
};

interface TTSRequest {
  text: string;
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    if (!GOOGLE_API_KEY) {
      console.error("GOOGLE_MAPS_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Google API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, language = "ru" } = await req.json() as TTSRequest;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("TTS request:", { text: text.substring(0, 50), language });

    // Build voice config based on language
    const voiceConfig = language === "ru" 
      ? VOICE_CONFIG 
      : { languageCode: "en-US", name: "en-US-Wavenet-D", ssmlGender: "MALE" };

    const response = await fetch(`${GOOGLE_TTS_URL}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: voiceConfig,
        audioConfig: AUDIO_CONFIG,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google TTS API error:", response.status, errorText);
      
      // Return 503 for temporary issues to trigger frontend circuit breaker
      const statusCode = response.status === 403 || response.status === 429 ? 503 : response.status;
      
      return new Response(
        JSON.stringify({ error: `TTS failed: ${response.status}` }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Google TTS returns base64-encoded audio in audioContent field
    if (!data.audioContent) {
      console.error("No audio content in response");
      return new Response(
        JSON.stringify({ error: "No audio content received" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("TTS generated successfully");

    return new Response(
      JSON.stringify({ audioContent: data.audioContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in navigation-tts:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
