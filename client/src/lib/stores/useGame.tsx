import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "home" | "ready" | "playing" | "ended";
export type GameMode = "singleplayer";

interface GameState {
  phase: GamePhase;
  mode: GameMode | null;
  
  // Actions
  selectMode: (mode: GameMode) => void;
  start: () => void;
  restart: () => void;
  end: () => void;
  returnToHome: () => void;
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set) => ({
    phase: "home", // Start at home screen initially
    mode: null,
    
    selectMode: (mode) => {
      set({ 
        mode,
        phase: "ready" // Move to ready phase after selecting a mode
      });
    },
    
    start: () => {
      set((state) => {
        // Only transition from ready to playing
        if (state.phase === "ready") {
          return { phase: "playing" };
        }
        return {};
      });
    },
    
    restart: () => {
      set(() => ({ phase: "ready" }));
    },
    
    end: () => {
      set((state) => {
        // Only transition from playing to ended
        if (state.phase === "playing") {
          return { phase: "ended" };
        }
        return {};
      });
    },
    
    returnToHome: () => {
      set({ 
        phase: "home",
        mode: null
      });
    }
  }))
);
