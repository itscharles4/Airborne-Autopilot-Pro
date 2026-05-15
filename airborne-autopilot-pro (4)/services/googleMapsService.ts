import { Loader } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let mapsLoaded = false;
let placesService: google.maps.places.PlacesService | null = null;
let map: google.maps.Map | null = null;

// Initialize Google Maps
export const initializeGoogleMaps = async () => {
  if (mapsLoaded) return;

  const loader = new Loader({
    apiKey: API_KEY,
    version: 'weekly',
    libraries: ['places', 'geometry', 'map'],
  });

  try {
    await loader.load();
    mapsLoaded = true;
    console.log('✓ Google Maps API loaded');
  } catch (error) {
    console.error('Failed to load Google Maps API:', error);
    throw error;
  }
};

// Sidebar map for places search
export const initializePlacesMap = (container: HTMLDivElement) => {
  if (!mapsLoaded) throw new Error('Google Maps not initialized');

  const mapOptions: google.maps.MapOptions = {
    center: { lat: 0, lng: 0 },
    zoom: 13,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
      { elementType: 'labels', stylers: [{ color: '#8899aa' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1622' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3a5c' }] },
      { featureType: 'poi', stylers: [{ color: '#1a2a3a' }] },
    ],
  };

  map = new google.maps.Map(container, mapOptions);
  placesService = new google.maps.places.PlacesService(map);
  return map;
};

export interface PlaceData {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  rating?: number;
  reviews?: number;
  icon?: string;
  openNow?: boolean;
}

// Fetch nearby places
export const getNearbyPlaces = (
  latitude: number,
  longitude: number,
  radius: number = 1500
): Promise<PlaceData[]> => {
  return new Promise((resolve, reject) => {
    if (!placesService || !map) {
      reject(new Error('PlacesService not initialized'));
      return;
    }

    if (map) {
      map.setCenter({ lat: latitude, lng: longitude });
    }

    const request: google.maps.places.PlaceSearchRequest = {
      location: { lat: latitude, lng: longitude },
      radius,
      type: ['restaurant', 'shop', 'cafe', 'bank', 'hospital', 'police', 'school', 'park', 'hotel', 'gym'],
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const places: PlaceData[] = results
          .slice(0, 50) // Limit to 50 to avoid performance issues
          .map((place) => ({
            id: place.place_id || `place-${Math.random()}`,
            name: place.name || 'Unknown',
            type: place.types?.[0] || 'unknown',
            latitude: place.geometry?.location?.lat() || 0,
            longitude: place.geometry?.location?.lng() || 0,
            address: place.vicinity || '',
            rating: place.rating,
            reviews: place.user_ratings_total,
            icon: place.icon,
            openNow: place.opening_hours?.open_now,
          }));

        resolve(places);
      } else {
        reject(new Error(`Places search failed: ${status}`));
      }
    });
  });
};

// Get place details
export const getPlaceDetails = (placeId: string): Promise<google.maps.places.PlaceResult | null> => {
  return new Promise((resolve, reject) => {
    if (!placesService) {
      reject(new Error('PlacesService not initialized'));
      return;
    }

    placesService.getDetails(
      { placeId, fields: ['name', 'rating', 'review', 'formatted_address', 'geometry', 'photos'] },
      (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(result);
        } else {
          reject(new Error(`Failed to get place details: ${status}`));
        }
      }
    );
  });
};

// Calculate distance between two coordinates
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  if (!mapsLoaded) return 0;
  
  const p1 = new google.maps.LatLng(lat1, lng1);
  const p2 = new google.maps.LatLng(lat2, lng2);
  
  return google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
};

// Get location autocomplete suggestions
export const getLocationAutocomplete = (
  input: string,
  sessionToken?: google.maps.places.AutocompleteSessionToken
): Promise<google.maps.places.AutocompletePrediction[]> => {
  return new Promise((resolve, reject) => {
    if (!mapsLoaded) {
      reject(new Error('Google Maps not initialized'));
      return;
    }

    const autocompleteService = new google.maps.places.AutocompleteService();

    const request: google.maps.places.AutocompleteRequest = {
      input,
      sessionToken,
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'us' }, // Optional: restrict to specific country
    };

    autocompleteService.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        resolve(predictions);
      } else {
        resolve([]); // Return empty array if no results
      }
    });
  });
};

// Get place details from place ID
export const getPlaceDetailsFromId = (
  placeId: string,
  sessionToken?: google.maps.places.AutocompleteSessionToken
): Promise<{ lat: number; lng: number; address: string } | null> => {
  return new Promise((resolve) => {
    if (!placesService) {
      resolve(null);
      return;
    }

    placesService.getDetails(
      {
        placeId,
        fields: ['geometry', 'formatted_address'],
        sessionToken,
      },
      (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
          resolve({
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
            address: result.formatted_address || '',
          });
        } else {
          resolve(null);
        }
      }
    );
  });
};
