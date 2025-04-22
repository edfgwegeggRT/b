import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWeapons } from "@/lib/stores/useWeapons";

interface WeaponsProps {
  position: [number, number, number];
}

const Weapons = ({ position }: WeaponsProps) => {
  const weaponsRef = useRef<THREE.Group>(null);
  const { currentWeapon, ammo, reloading } = useWeapons();
  
  // Weapon bob animation
  useFrame((state) => {
    if (!weaponsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Add subtle weapon bob
    weaponsRef.current.position.y = position[1] + Math.sin(time * 2) * 0.02;
    
    // Add recoil effect for reloading
    if (reloading) {
      weaponsRef.current.rotation.x = Math.sin(time * 10) * 0.05;
    } else {
      weaponsRef.current.rotation.x = THREE.MathUtils.lerp(
        weaponsRef.current.rotation.x,
        0,
        0.1
      );
    }
  });

  return (
    <group 
      ref={weaponsRef}
      position={position}
    >
      {/* Assault Rifle */}
      {currentWeapon === "assaultRifle" && (
        <group visible={currentWeapon === "assaultRifle"}>
          {/* Main body */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.2, 0.2, 1]} />
            <meshStandardMaterial color="darkgray" />
          </mesh>
          
          {/* Magazine */}
          <mesh position={[0, -0.2, 0.2]}>
            <boxGeometry args={[0.15, 0.3, 0.1]} />
            <meshStandardMaterial color="black" />
          </mesh>
          
          {/* Scope */}
          <mesh position={[0, 0.1, -0.2]}>
            <boxGeometry args={[0.1, 0.1, 0.2]} />
            <meshStandardMaterial color="black" />
          </mesh>
          
          {/* Barrel */}
          <mesh position={[0, 0, -0.6]}>
            <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
            <meshStandardMaterial color="black" />
          </mesh>
        </group>
      )}
      
      {/* Shotgun */}
      {currentWeapon === "shotgun" && (
        <group visible={currentWeapon === "shotgun"}>
          {/* Main body */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.25, 0.25, 0.8]} />
            <meshStandardMaterial color="brown" />
          </mesh>
          
          {/* Barrel */}
          <mesh position={[0, 0, -0.7]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
            <meshStandardMaterial color="darkgray" />
          </mesh>
          
          {/* Handle */}
          <mesh position={[0, -0.3, 0.2]}>
            <boxGeometry args={[0.15, 0.25, 0.15]} />
            <meshStandardMaterial color="brown" />
          </mesh>
        </group>
      )}
      
      {/* Ammo counter */}
      <group position={[0.2, -0.3, 0.2]} scale={0.2}>
        <mesh>
          <boxGeometry args={[1, 0.5, 0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.9, 0.4, 0.02]} />
          <meshStandardMaterial color="green" emissive="green" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
};

export default Weapons;
