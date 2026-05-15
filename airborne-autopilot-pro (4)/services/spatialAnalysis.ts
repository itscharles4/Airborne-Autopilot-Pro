import { PlaceData } from './googleMapsService';

export interface PlaceCluster {
  id: string;
  center: { lat: number; lng: number };
  places: PlaceData[];
  radius: number;
  density: number;
  category: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  places: PlaceData[];
  color: string;
  count: number;
  icon: string;
}

// Simple K-means clustering
export const clusterPlaces = (
  places: PlaceData[],
  k: number = 5,
  maxIterations: number = 10
): PlaceCluster[] => {
  if (places.length === 0) return [];

  // Initialize random centroids
  const centroids: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < Math.min(k, places.length); i++) {
    const randomPlace = places[Math.floor(Math.random() * places.length)];
    centroids.push({ lat: randomPlace.latitude, lng: randomPlace.longitude });
  }

  let clusters: PlaceCluster[] = [];
  let assignment: number[] = new Array(places.length).fill(0);
  let previousAssignment: number[] = [...assignment];

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    assignment = places.map((place) => {
      let minDistance = Infinity;
      let nearestCentroid = 0;

      centroids.forEach((centroid, idx) => {
        const distance = calculateDistance(place.latitude, place.longitude, centroid.lat, centroid.lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = idx;
        }
      });

      return nearestCentroid;
    });

    // Check convergence
    if (JSON.stringify(assignment) === JSON.stringify(previousAssignment)) break;
    previousAssignment = [...assignment];

    // Update centroids
    for (let i = 0; i < centroids.length; i++) {
      const clusterPlaces = places.filter((_, idx) => assignment[idx] === i);
      if (clusterPlaces.length > 0) {
        const avgLat = clusterPlaces.reduce((sum, p) => sum + p.latitude, 0) / clusterPlaces.length;
        const avgLng = clusterPlaces.reduce((sum, p) => sum + p.longitude, 0) / clusterPlaces.length;
        centroids[i] = { lat: avgLat, lng: avgLng };
      }
    }
  }

  // Create cluster objects
  clusters = centroids.map((centroid, idx) => {
    const clusterPlaces = places.filter((_, pidx) => assignment[pidx] === idx);
    const distances = clusterPlaces.map((p) => 
      calculateDistance(centroid.lat, centroid.lng, p.latitude, p.longitude)
    );
    const radius = Math.max(...distances, 100);

    return {
      id: `cluster-${idx}`,
      center: centroid,
      places: clusterPlaces,
      radius,
      density: clusterPlaces.length / (Math.PI * radius * radius) * 1000000,
      category: determineDominantCategory(clusterPlaces),
    };
  });

  return clusters.filter((c) => c.places.length > 0);
};

// Group places by category
export const groupPlacesByCategory = (places: PlaceData[]): CategoryGroup[] => {
  const categoryMap = new Map<string, PlaceData[]>();

  places.forEach((place) => {
    const category = place.type || 'other';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(place);
  });

  const categoryColors: Record<string, string> = {
    restaurant: '#ef4444',
    cafe: '#f97316',
    shop: '#eab308',
    store: '#eab308',
    bank: '#3b82f6',
    hospital: '#ec4899',
    pharmacy: '#ec4899',
    police: '#06b6d4',
    fire_station: '#f97316',
    school: '#8b5cf6',
    library: '#8b5cf6',
    park: '#10b981',
    hotel: '#06b6d4',
    gym: '#84cc16',
  };

  const categoryIcons: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    shop: '🛍️',
    store: '🏬',
    bank: '🏦',
    hospital: '🏥',
    pharmacy: '💊',
    police: '🚔',
    fire_station: '🚒',
    school: '🎓',
    library: '📚',
    park: '🌳',
    hotel: '🏨',
    gym: '💪',
  };

  const groups: CategoryGroup[] = Array.from(categoryMap.entries()).map(([category, places]) => ({
    id: `category-${category}`,
    name: formatCategoryName(category),
    places,
    color: categoryColors[category] || '#64748b',
    count: places.length,
    icon: categoryIcons[category] || '📍',
  }));

  return groups.sort((a, b) => b.count - a.count);
};

// Determine dominant category in a cluster
const determineDominantCategory = (places: PlaceData[]): string => {
  if (places.length === 0) return 'unknown';

  const typeCounts: Record<string, number> = {};
  places.forEach((place) => {
    const type = place.type || 'other';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return Object.entries(typeCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
};

// Format category name for display
const formatCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    restaurant: 'Dining',
    cafe: 'Cafes',
    shop: 'Retail',
    store: 'Stores',
    bank: 'Finance',
    hospital: 'Medical',
    pharmacy: 'Pharmacies',
    police: 'Safety',
    fire_station: 'Emergency',
    school: 'Education',
    library: 'Libraries',
    park: 'Recreation',
    hotel: 'Hospitality',
    gym: 'Fitness',
  };

  return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

// Calculate distance between two coordinates (in meters)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Analyze spatial distribution
export const analyzeSpatialDistribution = (places: PlaceData[]) => {
  if (places.length === 0) {
    return {
      totalPlaces: 0,
      averageDensity: 0,
      coverage: 0,
      clusters: [],
      categories: [],
    };
  }

  const clusters = clusterPlaces(places, Math.min(5, Math.ceil(places.length / 10)));
  const categories = groupPlacesByCategory(places);

  // Calculate coverage area (bounding box)
  const lats = places.map((p) => p.latitude);
  const lngs = places.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const coverage = (maxLat - minLat) * (maxLng - minLng);

  return {
    totalPlaces: places.length,
    averageDensity: places.length / coverage,
    coverage,
    clusters,
    categories,
  };
};

// Get heatmap data for visualization
export const generateHeatmapData = (places: PlaceData[]) => {
  const gridSize = 50; // 50x50 grid
  const heatmap: Array<{ x: number; y: number; intensity: number }> = [];

  const lats = places.map((p) => p.latitude);
  const lngs = places.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latStep = (maxLat - minLat) / gridSize;
  const lngStep = (maxLng - minLng) / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cellMinLat = minLat + i * latStep;
      const cellMaxLat = minLat + (i + 1) * latStep;
      const cellMinLng = minLng + j * lngStep;
      const cellMaxLng = minLng + (j + 1) * lngStep;

      const placesInCell = places.filter(
        (p) =>
          p.latitude >= cellMinLat &&
          p.latitude <= cellMaxLat &&
          p.longitude >= cellMinLng &&
          p.longitude <= cellMaxLng
      );

      heatmap.push({
        x: i,
        y: j,
        intensity: placesInCell.length,
      });
    }
  }

  return heatmap;
};
