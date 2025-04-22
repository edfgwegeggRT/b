import * as THREE from "three";

// Helper functions for physics and collisions

// Check collision between two bounding boxes
export const checkBoxCollision = (
  box1: THREE.Box3,
  box2: THREE.Box3
): boolean => {
  return box1.intersectsBox(box2);
};

// Check if a point is inside a box
export const isPointInBox = (
  point: THREE.Vector3,
  box: THREE.Box3
): boolean => {
  return box.containsPoint(point);
};

// Calculate bounding box from position and size
export const calculateBoundingBox = (
  position: [number, number, number],
  size: [number, number, number]
): THREE.Box3 => {
  const x = position[0];
  const y = position[1];
  const z = position[2];
  
  const halfWidth = size[0] / 2;
  const halfHeight = size[1] / 2;
  const halfDepth = size[2] / 2;
  
  return new THREE.Box3(
    new THREE.Vector3(x - halfWidth, y - halfHeight, z - halfDepth),
    new THREE.Vector3(x + halfWidth, y + halfHeight, z + halfDepth)
  );
};

// Calculate ray-box intersection
export const rayBoxIntersection = (
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  box: THREE.Box3
): THREE.Vector3 | null => {
  const ray = new THREE.Ray(origin, direction);
  const intersectionPoint = new THREE.Vector3();
  
  if (ray.intersectBox(box, intersectionPoint)) {
    return intersectionPoint;
  }
  
  return null;
};

// Calculate distance between two points
export const distance = (
  point1: [number, number, number],
  point2: [number, number, number]
): number => {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  const dz = point1[2] - point2[2];
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Normalize a 3D vector
export const normalizeVector = (
  vector: [number, number, number]
): [number, number, number] => {
  const length = Math.sqrt(
    vector[0] * vector[0] + 
    vector[1] * vector[1] + 
    vector[2] * vector[2]
  );
  
  if (length === 0) {
    return [0, 0, 0];
  }
  
  return [
    vector[0] / length,
    vector[1] / length,
    vector[2] / length
  ];
};

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
