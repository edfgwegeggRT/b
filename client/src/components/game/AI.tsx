import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAI } from "@/lib/stores/useAI";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";
import Projectile from "./Projectile";
import { useBuilding } from "@/lib/stores/useBuilding";

// AI states
type AIBehaviorState = "idle" | "chase" | "attack" | "retreat" | "findCover";

const AI = () => {
  const aiRef = useRef<THREE.Group>(null);
  const aiStore = useAI();
  const playerState = usePlayer();
  const buildingState = useBuilding();
  const { phase } = useGame();
  const { playHit } = useAudio();
  const [behaviorState, setBehaviorState] = useState<AIBehaviorState>("idle");
  const lastAttackTime = useRef(0);
  const pathfindingTimer = useRef(0);
  const targetPosition = useRef(new THREE.Vector3(5, 0, 5));
  const lastPositionUpdateTime = useRef(0);

  // Initialize AI position
  useEffect(() => {
    if (phase === "playing" && aiRef.current) {
      // Set initial position
      aiRef.current.position.set(10, 0, 10);
      
      // Only update the Zustand store occasionally to prevent loops
      if (!lastPositionUpdateTime.current) {
        aiStore.setPosition([10, 0, 10]);
        lastPositionUpdateTime.current = performance.now();
      }
    }
  }, [phase, aiStore]);

  // Handle projectile collisions
  useEffect(() => {
    // Check for player projectiles hitting AI
    playerState.projectiles.forEach(projectile => {
      if (projectile.hit) return; // Skip already hit projectiles
      
      const projectilePos = new THREE.Vector3(
        projectile.position[0],
        projectile.position[1],
        projectile.position[2]
      );
      
      // Simple collision detection (within 1 unit of AI)
      if (aiRef.current && 
          projectilePos.distanceTo(aiRef.current.position) < 1) {
        
        // Mark projectile as hit
        playerState.hitProjectile(projectile.id);
        
        // Reduce AI health
        aiStore.takeDamage(projectile.damage);
        
        // Play hit sound
        playHit();
        
        console.log(`AI hit! Health: ${aiStore.health}`);
      }
    });
  }, [playerState.projectiles, aiStore, playHit]);

  // AI behavior and decision making
  useFrame((state, delta) => {
    if (phase !== "playing" || !aiRef.current || aiStore.health <= 0) return;

    // Get positions
    const aiPosition = aiRef.current.position;
    const playerPosition = new THREE.Vector3(
      playerState.position[0],
      playerState.position[1],
      playerState.position[2]
    );
    
    // Calculate distance to player
    const distanceToPlayer = aiPosition.distanceTo(playerPosition);
    
    // Update AI state based on situation
    pathfindingTimer.current += delta;
    const elapsedTime = state.clock.getElapsedTime();
    
    // AI decision making every 0.5 seconds
    if (pathfindingTimer.current > 0.5) {
      pathfindingTimer.current = 0;
      
      // Determine AI state based on situation
      let newState: AIBehaviorState = behaviorState;
      
      if (aiStore.health < 30) {
        // When low health, retreat or find cover
        newState = Math.random() > 0.3 ? "retreat" : "findCover";
      } else if (distanceToPlayer < 15) {
        // When close to player, attack
        newState = "attack";
      } else {
        // Otherwise chase the player
        newState = "chase";
      }
      
      // Only update state if it changes
      if (newState !== behaviorState) {
        setBehaviorState(newState);
      }
      
      // Find a new target position based on current state
      switch (behaviorState) {
        case "chase":
          targetPosition.current = playerPosition.clone();
          break;
        case "attack":
          // Stay at a slight distance for attacking
          const direction = new THREE.Vector3().subVectors(aiPosition, playerPosition).normalize();
          targetPosition.current = playerPosition.clone().add(direction.multiplyScalar(8));
          break;
        case "retreat":
          // Move away from player
          const retreatDir = new THREE.Vector3().subVectors(aiPosition, playerPosition).normalize();
          targetPosition.current = aiPosition.clone().add(retreatDir.multiplyScalar(10));
          break;
        case "findCover":
          // Try to find nearby buildings to use as cover
          const buildings = buildingState.structures;
          if (buildings.length > 0) {
            // Find closest building
            let closestDist = Infinity;
            let closestBuilding = null;
            
            for (const building of buildings) {
              const buildingPos = new THREE.Vector3(
                building.position[0],
                building.position[1],
                building.position[2]
              );
              const dist = aiPosition.distanceTo(buildingPos);
              if (dist < closestDist) {
                closestDist = dist;
                closestBuilding = building;
              }
            }
            
            if (closestBuilding) {
              // Move to building position
              targetPosition.current = new THREE.Vector3(
                closestBuilding.position[0],
                closestBuilding.position[1],
                closestBuilding.position[2]
              );
            }
          } else {
            // No buildings, just retreat
            const retreatDir = new THREE.Vector3().subVectors(aiPosition, playerPosition).normalize();
            targetPosition.current = aiPosition.clone().add(retreatDir.multiplyScalar(10));
          }
          break;
        case "idle":
        default:
          // Random movement
          const randomOffsetX = (Math.random() - 0.5) * 20;
          const randomOffsetZ = (Math.random() - 0.5) * 20;
          targetPosition.current = new THREE.Vector3(randomOffsetX, 0, randomOffsetZ);
          break;
      }
    }
    
    // AI Movement
    const moveSpeed = 2.5 * delta;
    const moveDirection = new THREE.Vector3().subVectors(targetPosition.current, aiPosition).normalize();
    
    // Move towards target (with simple obstacle avoidance)
    aiPosition.add(moveDirection.multiplyScalar(moveSpeed));
    
    // Keep AI on the ground
    if (aiPosition.y > 0) {
      aiPosition.y = 0;
    }
    
    // Looking logic - always look at player
    const lookDirection = new THREE.Vector3().subVectors(playerPosition, aiPosition).normalize();
    const lookQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(lookDirection.x, 0, lookDirection.z).normalize()
    );
    aiRef.current.quaternion.slerp(lookQuaternion, 5 * delta);
    
    // Update AI position in the store (throttled to prevent updates causing state loops)
    const now = performance.now();
    if (now - lastPositionUpdateTime.current > 100) { // Update position every 100ms at most
      aiStore.setPosition([aiPosition.x, aiPosition.y, aiPosition.z]);
      lastPositionUpdateTime.current = now;
    }
    
    // Shooting logic
    if (behaviorState === "attack" && elapsedTime - lastAttackTime.current > 1.5) {
      // AI shoots every 1.5 seconds when in attack mode
      if (distanceToPlayer < 25) {
        aiStore.shoot(lookDirection);
        lastAttackTime.current = elapsedTime;
        console.log("AI shooting");
      }
    }
    
    // Update AI projectiles
    aiStore.updateProjectiles(delta);
  });

  // Debug information (logged to console) - but throttled to prevent spamming
  useEffect(() => {
    const logInterval = setInterval(() => {
      console.log(`AI state: ${behaviorState}, Health: ${aiStore.health}`);
    }, 5000); // Only log every 5 seconds
    
    return () => clearInterval(logInterval);
  }, [behaviorState, aiStore.health]);

  return (
    <>
      {/* AI Character */}
      <group ref={aiRef}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 2, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* AI weapon */}
        <mesh position={[0.5, 0, -0.5]}>
          <boxGeometry args={[0.2, 0.2, 1]} />
          <meshStandardMaterial color="darkgrey" />
        </mesh>
      </group>
      
      {/* Render AI projectiles */}
      {aiStore.projectiles.map((projectile) => (
        <Projectile 
          key={projectile.id}
          position={projectile.position}
          direction={projectile.direction}
          color="red"
        />
      ))}
    </>
  );
};

export default AI;
