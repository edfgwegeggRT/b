import { useEffect } from "react";
import { createPortal } from "react-dom";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useWeapons } from "@/lib/stores/useWeapons";
import { useAI } from "@/lib/stores/useAI";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";

// HUD overlay component
const UI = () => {
  // For the Three.js scene, we just return null because UI will be rendered via portal
  return null;
};

// External UI component that will be rendered outside of canvas
export const GameUI = () => {
  const playerState = usePlayer();
  const aiState = useAI();
  const weaponsState = useWeapons();
  const { isMuted, toggleMute } = useAudio();
  const { phase } = useGame();
  
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 100 }}
    >
      {/* Only show UI during gameplay */}
      {phase === "playing" && (
        <>
          {/* Crosshair */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="8" />
              <line x1="12" y1="16" x2="12" y2="22" />
              <line x1="2" y1="12" x2="8" y2="12" />
              <line x1="16" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          
          {/* Health bar and ammo counter */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            {/* Health */}
            <div className="flex flex-col gap-1">
              <div className="text-white text-sm">HEALTH</div>
              <div className="w-64 h-4 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${playerState.health}%` }}
                />
              </div>
            </div>
            
            {/* Ammo */}
            <div className="flex flex-col gap-1 items-end">
              <div className="text-white text-sm">AMMO</div>
              <div className="text-white text-2xl font-bold">
                {weaponsState.ammo}/{weaponsState.maxAmmo}
              </div>
              <div className="text-white text-sm mt-1">
                {weaponsState.currentWeapon.toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* AI information */}
          <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
            <div className="text-white text-sm">ENEMY HEALTH</div>
            <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${aiState.health}%` }}
              />
            </div>
          </div>
          
          {/* Game info and score */}
          <div className="absolute top-6 left-6 flex flex-col gap-1">
            <div className="text-white text-sm">SCORE: {playerState.score}</div>
            <div className="text-white text-sm">TIME: {Math.floor(playerState.playTime)}s</div>
          </div>
          
          {/* Controls reminder */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 p-2 rounded">
            WASD: Move | SPACE: Jump | R: Reload | Q: Change Weapon | B: Build | LMB: Shoot
          </div>
          
          {/* Sound toggle button (with pointer events enabled) */}
          <button 
            className="absolute top-6 left-1/2 transform -translate-x-1/2 text-white bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center pointer-events-auto"
            onClick={toggleMute}
          >
            {isMuted ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" strokeWidth="1.5" />
                <path d="M9 6.75V16.5L3.75 12 9 7.5" />
                <path d="M14.25 8.5V12M14.25 15.5V12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6.75V16.5L3.75 12 9 7.5" />
                <path d="M14.25 12a3 3 0 0 0 0-6M17.25 12a6 6 0 0 0-6-6" />
              </svg>
            )}
          </button>
        </>
      )}
      
      {/* Reload indicator */}
      {weaponsState.reloading && phase === "playing" && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-16 text-white font-bold text-lg bg-black bg-opacity-50 p-2 rounded">
          RELOADING...
        </div>
      )}
      
      {/* Damage indicator when hit */}
      {playerState.lastDamageTime > 0 && (
        <div className="absolute inset-0 pointer-events-none border-8 border-red-500 border-opacity-30 animate-pulse" />
      )}
    </div>
  );
};

export default UI;
