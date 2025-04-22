import { useRef } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useBuilding } from "@/lib/stores/useBuilding";

// Building component that renders all placed structures
const Building = () => {
  const { structures } = useBuilding();
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Set texture repeat
  woodTexture.repeat.set(1, 1);
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  
  return (
    <group>
      {/* Render all placed structures */}
      {structures.map((structure) => (
        <Structure 
          key={structure.id}
          position={structure.position}
          type={structure.type}
          texture={woodTexture}
        />
      ))}
    </group>
  );
};

interface StructureProps {
  position: [number, number, number];
  type: "wall" | "floor" | "ramp";
  texture: THREE.Texture;
}

// Individual structure component
const Structure = ({ position, type, texture }: StructureProps) => {
  const structureRef = useRef<THREE.Mesh>(null);
  
  // Determine the geometry based on structure type
  let geometry;
  let rotationY = 0;
  
  switch (type) {
    case "wall":
      geometry = <boxGeometry args={[3, 2, 0.2]} />;
      break;
    case "floor":
      geometry = <boxGeometry args={[3, 0.2, 3]} />;
      break;
    case "ramp":
      geometry = <boxGeometry args={[3, 0.2, 3]} />;
      rotationY = Math.PI / 4; // 45 degrees rotation
      break;
    default:
      geometry = <boxGeometry args={[1, 1, 1]} />;
  }
  
  return (
    <mesh 
      ref={structureRef}
      position={position}
      rotation={[0, rotationY, 0]}
      castShadow 
      receiveShadow
    >
      {geometry}
      <meshStandardMaterial 
        map={texture} 
        roughness={0.7}
      />
    </mesh>
  );
};

export default Building;
