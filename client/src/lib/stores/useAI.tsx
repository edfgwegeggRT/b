import { create } from "zustand";
import { generateId, normalizeVector } from "@/components/game/Physics";
import { Projectile } from "./usePlayer";
import { usePlayer } from "./usePlayer";
import * as THREE from "three";

interface AIState {
  position: [number, number, number];
  health: number;
  difficulty: "easy" | "medium" | "hard";
  projectiles: Projectile[];
  
  // Actions
  setPosition: (position: [number, number, number]) => void;
  takeDamage: (amount: number) => void;
  shoot: (direction: THREE.Vector3) => void;
  updateProjectiles: (delta: number) => void;
  hitProjectile: (id: string) => void;
  reset: () => void;
  setDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
}

export const useAI = create<AIState>((set, get) => ({
  position: [10, 0, 10],
  health: 100,
  difficulty: "medium",
  projectiles: [],
  
  setPosition: (position) => {
    set({ position });
  },
  
  takeDamage: (amount) => {
    const { health, difficulty } = get();
    
    // Adjust damage based on difficulty
    let damageMultiplier = 1;
    switch (difficulty) {
      case "easy":
        damageMultiplier = 1.5; // AI takes more damage on easy
        break;
      case "hard":
        damageMultiplier = 0.7; // AI takes less damage on hard
        break;
      default:
        damageMultiplier = 1;
    }
    
    const actualDamage = amount * damageMultiplier;
    const newHealth = Math.max(0, health - actualDamage);
    
    set({ health: newHealth });
    
    // Give player score when damaging AI
    if (newHealth < health) {
      usePlayer.getState().addScore(Math.ceil(actualDamage));
      
      // Give bonus score for kill
      if (newHealth <= 0) {
        usePlayer.getState().addScore(50);
      }
    }
  },
  
  shoot: (direction) => {
    const { position, projectiles, difficulty } = get();
    
    // Convert direction to array format
    const dir: [number, number, number] = [
      direction.x,
      direction.y,
      direction.z
    ];
    
    // Add inaccuracy based on difficulty
    let inaccuracy = 0;
    switch (difficulty) {
      case "easy":
        inaccuracy = 0.2; // More inaccurate on easy
        break;
      case "medium":
        inaccuracy = 0.1;
        break;
      case "hard":
        inaccuracy = 0.03; // Very accurate on hard
        break;
    }
    
    // Add random spread
    const spreadDirection: [number, number, number] = [
      dir[0] + (Math.random() - 0.5) * inaccuracy,
      dir[1] + (Math.random() - 0.5) * inaccuracy,
      dir[2] + (Math.random() - 0.5) * inaccuracy
    ];
    
    // Normalize direction
    const normalizedDirection = normalizeVector(spreadDirection);
    
    // Create projectile
    const newProjectile: Projectile = {
      id: generateId(),
      position: [position[0], position[1] + 1.5, position[2]], // Start at AI eye level
      direction: normalizedDirection,
      speed: 40, // Units per second
      damage: difficulty === "hard" ? 15 : difficulty === "medium" ? 10 : 5,
      timeCreated: Date.now(),
      color: "red",
      hit: false,
    };
    
    set({
      projectiles: [...projectiles, newProjectile],
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
  
  reset: () => {
    // Only reset if actually needed to prevent infinite loops
    const { health, position } = get();
    if (health !== 100 || position[0] !== 10 || position[1] !== 0 || position[2] !== 10) {
      set({
        position: [10, 0, 10],
        health: 100,
        projectiles: [],
      });
    }
  },
  
  setDifficulty: (difficulty) => {
    set({ difficulty });
  },
}));
