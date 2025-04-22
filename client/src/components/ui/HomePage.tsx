import React from 'react';
import { GameMode } from '../../lib/stores/useGame';

interface HomePageProps {
  onSelectMode: (mode: GameMode) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectMode }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-70 text-white">
      <h1 className="text-5xl font-bold mb-8">3D SHOOTER</h1>
      <p className="mb-12 text-xl text-center max-w-2xl">
        Battle against AI or other players in this first-person shooter with building mechanics
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        {/* Singleplayer Card */}
        <div className="bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all">
          <div className="p-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Singleplayer</h2>
            <p className="text-gray-300 flex-grow mb-6">
              Fight against AI opponents with different difficulty levels. Build structures to defend yourself and test your skills.
            </p>
            <button 
              onClick={() => onSelectMode("singleplayer")}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Play Singleplayer
            </button>
          </div>
        </div>
        
        {/* Multiplayer Card */}
        <div className="bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all">
          <div className="p-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Multiplayer</h2>
            <p className="text-gray-300 flex-grow mb-6">
              Challenge other players in real-time battles. Use building mechanics and different weapons to gain advantage.
            </p>
            <button 
              onClick={() => onSelectMode("multiplayer")}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Play Multiplayer
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-gray-300 mb-2">Controls:</p>
        <p className="text-gray-400 text-sm">
          WASD: Move | SPACE: Jump | MOUSE: Look | LEFT CLICK: Shoot | R: Reload | Q: Change Weapon | B: Build
        </p>
      </div>
    </div>
  );
};

export default HomePage;