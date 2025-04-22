import { useRef } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import Building from "./Building";

const World = () => {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  // Load textures
  const grassTexture = useTexture("/textures/grass.png");
  const skyTexture = useTexture("/textures/sky.png");
  
  // Set texture repeat
  grassTexture.repeat.set(50, 50);
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  
  skyTexture.mapping = THREE.EquirectangularReflectionMapping;
  
  return (
    <>
      {/* Scene lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={directionalLightRef}
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Environment setup */}
      <group>
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial 
            map={grassTexture}
            roughness={0.8}
          />
        </mesh>
        
        {/* Sky */}
        <mesh>
          <sphereGeometry args={[50, 32, 32]} />
          <meshBasicMaterial map={skyTexture} side={THREE.BackSide} />
        </mesh>
        
        {/* Game boundary walls */}
        <BoundaryWalls />
        
        {/* Obstacles and cover objects */}
        <Obstacles />
        
        {/* Player-placed buildings */}
        <Building />
      </group>
    </>
  );
};

// Boundary walls to keep players in the game area
const BoundaryWalls = () => {
  return (
    <group>
      {/* North wall */}
      <mesh position={[0, 5, -50]} castShadow receiveShadow>
        <boxGeometry args={[100, 10, 1]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      
      {/* South wall */}
      <mesh position={[0, 5, 50]} castShadow receiveShadow>
        <boxGeometry args={[100, 10, 1]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      
      {/* East wall */}
      <mesh position={[50, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 10, 100]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      
      {/* West wall */}
      <mesh position={[-50, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 10, 100]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
    </group>
  );
};

// Obstacles scattered around the map for cover
const Obstacles = () => {
  // Load wooden crate texture
  const woodTexture = useTexture("/textures/wood.jpg");
  
  // Pre-calculate random positions for obstacles
  const cratePositions = [
    [5, 0.5, -8],
    [-7, 0.5, 3],
    [12, 0.5, 15],
    [-15, 0.5, -12],
    [0, 0.5, 12],
    [8, 0.5, 5],
    [-3, 0.5, -10],
    [15, 0.5, -5],
    [-10, 0.5, 8],
    [3, 0.5, 20],
  ];
  
  const barrelPositions = [
    [7, 1, -5],
    [-5, 1, 5],
    [10, 1, 10],
    [-12, 1, -8],
    [2, 1, 15],
    [15, 1, 2],
    [-8, 1, -2],
    [12, 1, -12],
  ];
  
  return (
    <group>
      {/* Wooden crates */}
      {cratePositions.map((position, index) => (
        <mesh key={`crate-${index}`} position={position} castShadow receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial map={woodTexture} />
        </mesh>
      ))}
      
      {/* Barrels */}
      {barrelPositions.map((position, index) => (
        <mesh key={`barrel-${index}`} position={position} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 0.7, 2, 16]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
      ))}
      
      {/* Large central structure */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 3, 6]} />
          <meshStandardMaterial color="#555555" roughness={0.6} />
        </mesh>
        
        {/* Ramp to get on top */}
        <mesh position={[3, 0.75, 3]} rotation={[Math.PI/8, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 0.2, 6]} />
          <meshStandardMaterial color="#666666" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

export default World;
