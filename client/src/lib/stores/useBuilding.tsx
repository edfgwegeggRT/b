import { create } from "zustand";
import { generateId } from "@/components/game/Physics";

// Types of structures that can be placed
export type StructureType = "wall" | "floor" | "ramp";

// Structure interface
export interface Structure {
  id: string;
  position: [number, number, number];
  type: StructureType;
  health: number;
}

interface BuildingState {
  structures: Structure[];
  selectedType: StructureType;
  
  // Actions
  placeStructure: (params: { 
    position: [number, number, number], 
    type?: StructureType 
  }) => void;
  removeStructure: (id: string) => void;
  damageStructure: (id: string, amount: number) => void;
  setSelectedType: (type: StructureType) => void;
  reset: () => void;
}

export const useBuilding = create<BuildingState>((set, get) => ({
  structures: [],
  selectedType: "wall",
  
  placeStructure: ({ position, type }) => {
    const { structures, selectedType } = get();
    
    // Use provided type or fallback to selected type
    const structureType = type || selectedType;
    
    // Check for overlapping structures
    const isOverlapping = structures.some(structure => {
      // Simple distance check (within 2 units)
      const dx = structure.position[0] - position[0];
      const dy = structure.position[1] - position[1];
      const dz = structure.position[2] - position[2];
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      return distanceSquared < 4; // Square of 2 units
    });
    
    // Don't place if overlapping
    if (isOverlapping) {
      console.log("Cannot place structure: overlapping with existing structure");
      return;
    }
    
    // Create new structure
    const newStructure: Structure = {
      id: generateId(),
      position,
      type: structureType,
      health: 100,
    };
    
    set({
      structures: [...structures, newStructure],
    });
    
    console.log(`Placed ${structureType} at [${position.join(", ")}]`);
  },
  
  removeStructure: (id) => {
    set(state => ({
      structures: state.structures.filter(s => s.id !== id),
    }));
  },
  
  damageStructure: (id, amount) => {
    set(state => ({
      structures: state.structures.map(structure => {
        if (structure.id === id) {
          const newHealth = Math.max(0, structure.health - amount);
          
          // If health reaches 0, structure should be destroyed
          if (newHealth <= 0) {
            return { ...structure, health: 0 };
          }
          
          return { ...structure, health: newHealth };
        }
        return structure;
      }),
    }));
    
    // Remove destroyed structures
    const { structures } = get();
    const destroyedStructures = structures.filter(s => s.health <= 0);
    
    if (destroyedStructures.length > 0) {
      destroyedStructures.forEach(structure => {
        get().removeStructure(structure.id);
      });
    }
  },
  
  setSelectedType: (type) => {
    set({ selectedType: type });
  },
  
  reset: () => {
    set({
      structures: [],
    });
  },
}));
