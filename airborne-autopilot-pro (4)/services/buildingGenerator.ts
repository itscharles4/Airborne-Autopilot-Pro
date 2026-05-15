import * as THREE from 'three';
import { PlaceData } from './googleMapsService';

export interface Building3D {
  id: string;
  mesh: THREE.Mesh;
  placeData: PlaceData;
  position: THREE.Vector3;
  height: number;
  width: number;
  depth: number;
  color: string;
  type: string;
  categoryId: string;
}

// Building type to category mapping
const PLACE_TYPE_CATEGORIES: Record<string, { name: string; color: string; intensity: number }> = {
  restaurant: { name: 'Dining', color: '#ef4444', intensity: 0.8 },
  cafe: { name: 'Cafes', color: '#f97316', intensity: 0.7 },
  shop: { name: 'Retail', color: '#eab308', intensity: 0.7 },
  store: { name: 'Retail', color: '#eab308', intensity: 0.7 },
  bank: { name: 'Finance', color: '#3b82f6', intensity: 0.8 },
  hospital: { name: 'Medical', color: '#ec4899', intensity: 0.9 },
  pharmacy: { name: 'Medical', color: '#ec4899', intensity: 0.8 },
  police: { name: 'Services', color: '#06b6d4', intensity: 0.8 },
  fire_station: { name: 'Services', color: '#f97316', intensity: 0.8 },
  school: { name: 'Education', color: '#8b5cf6', intensity: 0.7 },
  library: { name: 'Education', color: '#8b5cf6', intensity: 0.7 },
  park: { name: 'Recreation', color: '#10b981', intensity: 0.6 },
  hotel: { name: 'Hospitality', color: '#06b6d4', intensity: 0.8 },
  gym: { name: 'Recreation', color: '#84cc16', intensity: 0.7 },
  default: { name: 'Other', color: '#64748b', intensity: 0.5 },
};

// Get category for place type
export const getPlaceCategory = (type: string) => {
  return PLACE_TYPE_CATEGORIES[type] || PLACE_TYPE_CATEGORIES.default;
};

// Create Building Material
const createBuildingMaterial = (color: string, intensity: number): THREE.MeshPhongMaterial => {
  return new THREE.MeshPhongMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity * 0.3,
    shininess: 100,
    flatShading: false,
    wireframe: false,
  });
};

// Generate 3D building from place data
export const createBuildingMesh = (
  place: PlaceData,
  position: THREE.Vector3,
  sceneScale: number = 0.001
): Building3D => {
  const category = getPlaceCategory(place.type);
  
  // Determine height based on place type and rating
  let height = 20 + Math.random() * 40; // Base 20-60
  if (place.rating) {
    height += place.rating * 8; // Higher rated places are taller
  }
  if (['hospital', 'police', 'fire_station'].includes(place.type)) {
    height += 30; // Important services are taller
  }
  
  // Determine width/depth based on type
  let width = 15 + Math.random() * 10;
  let depth = 15 + Math.random() * 10;
  
  if (['shop', 'store', 'mall'].includes(place.type)) {
    width = 20;
    depth = 20;
  } else if (['park', 'school'].includes(place.type)) {
    width = 40 + Math.random() * 20;
    depth = 40 + Math.random() * 20;
  }

  // Create geometry
  const geometry = new THREE.BoxGeometry(width, height, depth);

  // Create material
  const material = createBuildingMaterial(category.color, category.intensity);

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Add edges for better visibility
  const edges = new THREE.EdgesGeometry(geometry);
  const wireframe = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color: new THREE.Color(category.color),
      linewidth: 1,
      transparent: true,
      opacity: 0.3,
    })
  );
  mesh.add(wireframe);

  return {
    id: place.id,
    mesh,
    placeData: place,
    position,
    height,
    width,
    depth,
    color: category.color,
    type: place.type,
    categoryId: category.name,
  };
};

// Generate multiple buildings from places
export const generateBuildingsFromPlaces = (
  places: PlaceData[],
  centerLat: number,
  centerLng: number,
  mapRadius: number = 1500
): Building3D[] => {
  const buildings: Building3D[] = [];

  places.forEach((place) => {
    // Convert lat/lng to local coordinates
    // Approximate: 1 degree ≈ 111km
    const latOffset = (place.latitude - centerLat) * 111000 * 0.001; // in scaled units
    const lngOffset = (place.longitude - centerLng) * 111000 * 0.001;

    const position = new THREE.Vector3(lngOffset * 100, 0, latOffset * 100);

    const building = createBuildingMesh(place, position);
    buildings.push(building);
  });

  return buildings;
};

// Add glow effect to building
export const addGlowEffect = (mesh: THREE.Mesh, color: string): THREE.Mesh => {
  const glowGeometry = new THREE.BoxGeometry(
    mesh.scale.x * 1.1,
    mesh.scale.y * 1.1,
    mesh.scale.z * 1.1
  );
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide,
  });
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  glowMesh.position.copy(mesh.position);
  
  return glowMesh;
};

// Create city grid background
export const createCityGrid = (size: number = 2000, gridSize: number = 100): THREE.Object3D => {
  const group = new THREE.Group();

  // Create grid lines
  const geometry = new THREE.BufferGeometry();
  const points: number[] = [];

  for (let i = -size; i <= size; i += gridSize) {
    // Lines parallel to Z axis
    points.push(i, 0, -size, i, 0, size);
    // Lines parallel to X axis
    points.push(-size, 0, i, size, 0, i);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.1,
  });

  const lines = new THREE.LineSegments(geometry, material);
  group.add(lines);

  return group;
};

// Setup lighting
export const setupLighting = (): { scene: THREE.Object3D; lights: THREE.Light[] } => {
  const scene = new THREE.Group();
  const lights: THREE.Light[] = [];

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  lights.push(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1000, 1000, 500);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  lights.push(directionalLight);

  // Point light for ambient glow
  const pointLight = new THREE.PointLight(0x0ea5e9, 0.5, 2000);
  pointLight.position.set(500, 500, 500);
  scene.add(pointLight);
  lights.push(pointLight);

  return { scene, lights };
};

// Animate building highlight
export const animateBuildingHighlight = (mesh: THREE.Mesh, color: string, duration: number = 500) => {
  const startEmissiveIntensity = (mesh.material as THREE.MeshPhongMaterial).emissiveIntensity || 0.3;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const material = mesh.material as THREE.MeshPhongMaterial;

    material.emissiveIntensity = startEmissiveIntensity + progress * 0.3;
    material.emissive.setHex(new THREE.Color(color).getHex());

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
};
