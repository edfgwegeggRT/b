import React, { useState } from 'react';
import { useGame } from '@/lib/stores/useGame';

// Define game mode options
export type GameMode = "singleplayer" | "multiplayer";

interface HomePageProps {
  onSelectMode: (mode: GameMode) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectMode }) => {
  const [hoveredMode, setHoveredMode] = useState<GameMode | null>(null);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-80 text-white">
      <div className="mb-10">
        <h1 className="text-7xl font-bold text-center mb-4">3D SHOOTER</h1>
        <p className="text-xl text-center text-gray-300">First-person shooter with building mechanics</p>
      </div>
      
      <div className="w-full max-w-3xl flex justify-center gap-8 mb-16">
        {/* Single Player Mode Card */}
        <div 
          className={`relative w-64 h-80 bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer 
            ${hoveredMode === 'singleplayer' ? 'scale-105 shadow-lg shadow-primary/50' : 'opacity-90 scale-100'}`}
          onMouseEnter={() => setHoveredMode('singleplayer')}
          onMouseLeave={() => setHoveredMode(null)}
          onClick={() => onSelectMode('singleplayer')}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
          <div className="h-full w-full bg-gradient-to-br from-red-600 to-orange-500" />
          <div className="absolute bottom-0 left-0 p-5 z-20">
            <h3 className="text-2xl font-bold mb-2">Bot Mode</h3>
            <p className="text-sm text-gray-200">Fight against AI opponents with advanced behaviors</p>
          </div>
          {hoveredMode === 'singleplayer' && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <button className="px-6 py-3 bg-white text-black font-bold rounded-md hover:bg-opacity-90 transition-colors">
                PLAY NOW
              </button>
            </div>
          )}
        </div>

        {/* Multiplayer Mode Card */}
        <div 
          className={`relative w-64 h-80 bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer 
            ${hoveredMode === 'multiplayer' ? 'scale-105 shadow-lg shadow-primary/50' : 'opacity-90 scale-100'}`}
          onMouseEnter={() => setHoveredMode('multiplayer')}
          onMouseLeave={() => setHoveredMode(null)}
          onClick={() => onSelectMode('multiplayer')}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
          <div className="h-full w-full bg-gradient-to-br from-blue-600 to-purple-500" />
          <div className="absolute bottom-0 left-0 p-5 z-20">
            <h3 className="text-2xl font-bold mb-2">1v1 Online</h3>
            <p className="text-sm text-gray-200">Compete against other players in real-time battles</p>
          </div>
          {hoveredMode === 'multiplayer' && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <button className="px-6 py-3 bg-white text-black font-bold rounded-md hover:bg-opacity-90 transition-colors">
                PLAY NOW
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center text-gray-400 text-sm">
        <p>Use WASD to move | SPACE to jump | MOUSE to aim & shoot</p>
        <p className="mt-1">Q to switch weapons | R to reload | B to build</p>
      </div>
    </div>
  );
};

export default HomePage;