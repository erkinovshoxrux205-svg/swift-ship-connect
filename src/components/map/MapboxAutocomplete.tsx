import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import { cn } from '@/lib/utils';

interface MapboxAutocompleteProps {
  onLocationSelect: (location: {
    coordinates: [number, number];
    address: string;
    placeName: string;
  }) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  disabled?: boolean;
}

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
  place_type: string[];
}

export const MapboxAutocomplete: React.FC<MapboxAutocompleteProps> = ({
  onLocationSelect,
  placeholder = "Enter address...",
  className,
  value,
  disabled = false
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_CONFIG.accessToken}&types=address,place,poi&limit=8`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Geocoding error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        searchLocations(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const location = {
      coordinates: suggestion.center,
      address: suggestion.place_name,
      placeName: suggestion.text
    };
    
    onLocationSelect(location);
    setQuery(suggestion.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "bg-white text-gray-900 placeholder-gray-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3 border-b border-gray-100 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.text}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {suggestion.place_name.replace(suggestion.text + ', ', '')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
