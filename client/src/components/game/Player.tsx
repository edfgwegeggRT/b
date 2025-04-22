import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { Controls } from "@/App";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useWeapons } from "@/lib/stores/useWeapons";
import { useAI } from "@/lib/stores/useAI";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";
import Weapons from "./Weapons";
import Projectile from "./Projectile";
import { useBuilding } from "@/lib/stores/useBuilding";

const Player = () => {
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const isJumpingRef = useRef(false);
  
  // Get state from stores
  const { phase } = useGame();
  const playerState = usePlayer();
  const aiState = useAI();
  const weaponsState = useWeapons();
  const buildingState = useBuilding();
  const { playHit } = useAudio();
  
  // Get keyboard controls
  const [, getKeys] = useKeyboardControls<Controls>();
  
  // Register one-time keyboard actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase !== "playing") return;
      
      switch(event.code) {
        case "KeyR": // Reload
          weaponsState.reload();
          console.log("Reloading weapon");
          break;
        case "KeyQ": // Switch weapon
          weaponsState.switchWeapon();
          console.log(`Switched to ${weaponsState.currentWeapon}`);
          break;
        case "KeyB": // Build
          const position = new THREE.Vector3();
          position.set(0, 0, -3).applyMatrix4(camera.matrixWorld);
          position.y = 0; // Place on ground
          
          buildingState.placeStructure({
            position: [position.x, position.y, position.z],
            type: "wall"
          });
          console.log("Building structure");
          break;
      }
    };
    
    // Add event listener
    window.addEventListener("keydown", handleKeyDown);
    
    // Mouse click handler for shooting
    const handleMouseDown = (event: MouseEvent) => {
      if (phase !== "playing" || event.button !== 0) return;
      
      const canShoot = weaponsState.shoot();
      if (canShoot) {
        console.log("Player shooting");
        playerState.createProjectile();
      }
    };
    
    window.addEventListener("mousedown", handleMouseDown);
    
    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [camera, phase, playerState, weaponsState, buildingState]);

  // Initialize player position and store camera reference globally for projectiles
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.position.set(0, 1, 0);
      camera.position.set(0, 1.8, 0);
      
      // Store camera reference in window for projectiles to use
      if (typeof window !== 'undefined') {
        (window as any).threeCamera = camera;
      }
    }
    
    // Clean up the global reference when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).threeCamera = null;
      }
    };
  }, [camera]);

  // Handle projectile collisions
  useEffect(() => {
    // Check for AI projectiles hitting player
    aiState.projectiles.forEach(projectile => {
      if (projectile.hit) return; // Skip already hit projectiles
      
      const projectilePos = new THREE.Vector3(
        projectile.position[0],
        projectile.position[1],
        projectile.position[2]
      );
      
      // Simple collision detection (within 0.5 units of player)
      if (playerRef.current && 
          projectilePos.distanceTo(playerRef.current.position) < 0.5) {
        
        // Mark projectile as hit
        aiState.hitProjectile(projectile.id);
        
        // Reduce player health
        playerState.takeDamage(projectile.damage);
        
        // Play hit sound
        playHit();
        
        console.log(`Player hit! Health: ${playerState.health}`);
      }
    });
  }, [aiState.projectiles, playerState, playHit, aiState]);

  // Player movement and physics
  useFrame((state, delta) => {
    if (phase !== "playing" || !playerRef.current) return;

    // Get current control states
    const { forward, backward, left, right, jump } = getKeys();

    const speed = playerState.isSprinting ? 5 : 3;
    const jumpForce = 8;
    const gravity = 20;
    
    // Get camera direction vectors
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    // Get right vector from camera - fix inverted left/right controls
    const rightVector = new THREE.Vector3(
      -cameraDirection.z,
      0,
      cameraDirection.x
    ).normalize();
    
    // Reset movement velocity
    const velocity = velocityRef.current;
    velocity.x = 0;
    velocity.z = 0;
    
    // Apply movement based on key presses
    if (forward) {
      velocity.add(cameraDirection.clone().multiplyScalar(speed * delta));
    }
    if (backward) {
      velocity.add(cameraDirection.clone().multiplyScalar(-speed * delta));
    }
    if (left) {
      velocity.add(rightVector.clone().multiplyScalar(-speed * delta));
    }
    if (right) {
      velocity.add(rightVector.clone().multiplyScalar(speed * delta));
    }
    
    // Apply gravity
    if (playerRef.current.position.y > 0) {
      velocity.y -= gravity * delta;
    } else {
      velocity.y = 0;
      playerRef.current.position.y = 0;
      isJumpingRef.current = false;
    }
    
    // Handle jumping
    if (jump && !isJumpingRef.current && playerRef.current.position.y < 0.1) {
      velocity.y = jumpForce * delta;
      isJumpingRef.current = true;
    }
    
    // Apply velocity
    playerRef.current.position.add(velocity);
    
    // Update camera position to follow player (with height offset)
    camera.position.x = playerRef.current.position.x;
    camera.position.z = playerRef.current.position.z;
    camera.position.y = playerRef.current.position.y + 1.8;
    
    // Update player state with current position
    playerState.setPosition([
      playerRef.current.position.x,
      playerRef.current.position.y,
      playerRef.current.position.z
    ]);
    
    // Update player's projectiles
    playerState.updateProjectiles(delta);
  });

  return (
    <>
      {/* Player mesh (invisible in first person) */}
      <group ref={playerRef}>
        <mesh visible={false}>
          <boxGeometry args={[1, 1.8, 1]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        
        {/* Weapon model */}
        <Weapons position={[0.3, -0.3, -0.5]} />
      </group>
      
      {/* Render player projectiles */}
      {playerState.projectiles.map((projectile) => (
        <Projectile 
          key={projectile.id}
          position={projectile.position}
          direction={projectile.direction}
          color={projectile.color}
        />
      ))}
    </>
  );
};

export default Player;
