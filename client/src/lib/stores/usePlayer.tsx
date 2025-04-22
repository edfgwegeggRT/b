import { create } from "zustand";
import { generateId, normalizeVector } from "@/components/game/Physics";
import { useWeapons } from "./useWeapons";
import * as THREE from "three";

// Projectile type
export interface Projectile {
  id: string;
  position: [number, number, number];
  direction: [number, number, number];
  speed: number;
  damage: number;
  timeCreated: number;
  color: string;
  hit: boolean;
}

interface PlayerState {
  position: [number, number, number];
  health: number;
  score: number;
  kills: number;
  projectiles: Projectile[];
  isSprinting: boolean;
  lastDamageTime: number;
  playTime: number;
  
  // Actions
  setPosition: (position: [number, number, number]) => void;
  createProjectile: () => void;
  updateProjectiles: (delta: number) => void;
  hitProjectile: (id: string) => void;
  takeDamage: (amount: number) => void;
  addScore: (points: number) => void;
  reset: () => void;
  updatePlayTime: (delta: number) => void;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  position: [0, 0, 0],
  health: 100,
  score: 0,
  kills: 0,
  projectiles: [],
  isSprinting: false,
  lastDamageTime: 0,
  playTime: 0,
  
  setPosition: (position) => {
    set({ position });
  },
  
  createProjectile: () => {
    const { position, projectiles } = get();
    const weaponsState = useWeapons.getState();
    const weaponData = weaponsState.getCurrentWeaponData();
    
    // Use THREE directly to get camera direction
    // We need to use the actual camera direction from the scene rather than a fixed vector
    // Using global THREE object's current camera if available
    let cameraDirection: [number, number, number];
    
    // Retrieve the global THREE.Camera object if it exists in window
    if (typeof window !== 'undefined' && (window as any).threeCamera) {
      const camera = (window as any).threeCamera;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      cameraDirection = [direction.x, direction.y, direction.z];
    } else {
      // Fallback to forward direction if camera not available
      cameraDirection = [0, 0, -1];
    }
    
    // Get weapon data
    const bulletDamage = weaponData.damage;
    const projectilesPerShot = weaponData.projectilesPerShot;
    
    // Create projectiles
    const newProjectiles: Projectile[] = [];
    
    for (let i = 0; i < projectilesPerShot; i++) {
      // Start with camera direction
      let direction: [number, number, number] = [...cameraDirection];
      
      if (weaponsState.currentWeapon === "shotgun") {
        // Add random spread for shotgun (-15 to 15 degrees in both axes)
        const spreadX = (Math.random() - 0.5) * 0.5;
        const spreadY = (Math.random() - 0.5) * 0.5;
        direction = [direction[0] + spreadX, direction[1] + spreadY, direction[2]];
        direction = normalizeVector(direction);
      }
      
      newProjectiles.push({
        id: generateId(),
        position: [position[0], position[1] + 1.6, position[2]], // Start at player eye level
        direction: direction,
        speed: 40, // Units per second
        damage: 25, // Increase damage to make it more noticeable
        timeCreated: Date.now(),
        color: "#ffff00",
        hit: false,
      });
    }
    
    set({
      projectiles: [...projectiles, ...newProjectiles],
    });
  },
  
  updateProjectiles: (delta) => {
    const { projectiles } = get();
    
    // Update projectile positions
    const updatedProjectiles = projectiles
      .filter(projectile => {
        // Remove old projectiles (after 5 seconds) or ones that hit
        const age = (Date.now() - projectile.timeCreated) / 1000;
        return age < 5 && !projectile.hit;
      })
      .map(projectile => {
        // Update position based on direction and speed
        const newPosition: [number, number, number] = [
          projectile.position[0] + projectile.direction[0] * projectile.speed * delta,
          projectile.position[1] + projectile.direction[1] * projectile.speed * delta,
          projectile.position[2] + projectile.direction[2] * projectile.speed * delta,
        ];
        
        return {
          ...projectile,
          position: newPosition,
        };
      });
    
    set({ projectiles: updatedProjectiles });
  },
  
  hitProjectile: (id) => {
    set(state => ({
      projectiles: state.projectiles.map(p => 
        p.id === id ? { ...p, hit: true } : p
      ),
    }));
  },
  
  takeDamage: (amount) => {
    const { health } = get();
    const newHealth = Math.max(0, health - amount);
    
    set({
      health: newHealth,
      lastDamageTime: Date.now(),
    });
    
    // Clear damage indicator after 500ms
    setTimeout(() => {
      set({ lastDamageTime: 0 });
    }, 500);
  },
  
  addScore: (points) => {
    set(state => ({
      score: state.score + points,
    }));
  },
  
  reset: () => {
    // Only reset if actually needed to prevent infinite loops
    const { health, playTime } = get();
    if (health !== 100 || playTime !== 0) {
      set({
        position: [0, 0, 0],
        health: 100,
        projectiles: [],
        lastDamageTime: 0,
        playTime: 0,
      });
    }
  },
  
  updatePlayTime: (delta) => {
    set(state => ({
      playTime: state.playTime + delta,
    }));
  },
}));
