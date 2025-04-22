import { useRef } from "react";
import * as THREE from "three";

interface ProjectileProps {
  position: [number, number, number];
  direction: [number, number, number];
  color?: string;
}

const Projectile = ({ position, direction, color = "#ffff00" }: ProjectileProps) => {
  const projectileRef = useRef<THREE.Mesh>(null);
  
  return (
    <mesh
      ref={projectileRef}
      position={position}
    >
      {/* Display bullet as a small glowing sphere */}
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={2}
      />
      
      {/* Add a trail effect */}
      <mesh position={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.02, 0.05, 0.4, 8]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={1.5} 
          transparent={true} 
          opacity={0.7}
        />
      </mesh>
    </mesh>
  );
};

export default Projectile;
