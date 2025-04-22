import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls, PointerLockControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import Game from "./components/game/Game";
import { useGame, GameMode } from "./lib/stores/useGame";
import { usePlayer } from './lib/stores/usePlayer';
import { useWeapons } from './lib/stores/useWeapons';
import { useAI } from './lib/stores/useAI';
import HomePage from './components/ui/HomePage';

// Define control keys for the game
export enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
  shoot = 'shoot',
  reload = 'reload',
  build = 'build',
  weaponSwitch = 'weaponSwitch',
  startGame = 'startGame'
}

const keyMap = [
  { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
  { name: Controls.left, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.right, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.jump, keys: ["Space"] },
  { name: Controls.shoot, keys: ["Mouse0"] }, // Left mouse button
  { name: Controls.reload, keys: ["KeyR"] },
  { name: Controls.build, keys: ["KeyB"] },
  { name: Controls.weaponSwitch, keys: ["KeyQ"] },
  { name: Controls.startGame, keys: ["KeyE"] }
];

// Define GameUI component directly to avoid import issues
interface GameUIProps {
  onStartGame: () => void;
  onRestartGame: () => void;
  onBackToHome: () => void;
}

const GameUI = ({ onStartGame, onRestartGame, onBackToHome }: GameUIProps) => {
  const { phase } = useGame();
  const playerState = usePlayer();
  const aiState = useAI();
  const weaponsState = useWeapons();
  const { isMuted, toggleMute } = useAudio();

  // Render start screen
  if (phase === "ready") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-70 text-white">
        <h1 className="text-5xl font-bold mb-8">3D SHOOTER</h1>
        <p className="mb-8 text-xl">Battle against AI in a first-person shooter with building mechanics</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={onStartGame}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-md text-xl hover:bg-primary/90 transition-colors"
          >
            Start Game
          </button>
          <button
            onClick={onBackToHome}
            className="px-8 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Mode Selection
          </button>
        </div>
      </div>
    );
  }

  // Render game over screen
  if (phase === "ended") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-70 text-white">
        <h1 className="text-4xl font-bold mb-6">Game Over</h1>
        <p className="mb-4">Score: {playerState.score}</p>
        <p className="mb-6">Time Survived: {Math.floor(playerState.playTime)}s</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={onRestartGame}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-md text-xl hover:bg-primary/90 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onBackToHome}
            className="px-8 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Mode Selection
          </button>
        </div>
      </div>
    );
  }

  // Render in-game HUD
  if (phase === "playing") {
    return (
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
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

        {/* Reload indicator */}
        {weaponsState.reloading && (
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
  }

  // Default empty UI (should not happen)
  return null;
};

// Main App component
function App() {
  const { phase } = useGame();
  const [showCanvas, setShowCanvas] = useState(false);
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Load audio files
  useEffect(() => {
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);

    const hit = new Audio("/sounds/hit.mp3");
    hit.volume = 0.4;
    setHitSound(hit);

    const success = new Audio("/sounds/success.mp3");
    success.volume = 0.5;
    setSuccessSound(success);

    setShowCanvas(true);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  // Start Game Handler
  const startGame = () => {
    useGame.getState().start();
  };

  // Restart Game Handler
  const restartGame = () => {
    useGame.getState().restart();
  };

  // Handle game mode selection
  const handleSelectMode = (mode: GameMode) => {
    useGame.getState().selectMode(mode);
  };

  // Handle return to home
  const handleReturnToHome = () => {
    useGame.getState().returnToHome();
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {showCanvas && (
        <>
          {/* Home Page UI (only shown when in home phase) */}
          {phase === "home" && (
            <HomePage onSelectMode={handleSelectMode} />
          )}

          {/* Game UI (rendered as HTML, outside of Canvas) */}
          {phase !== "home" && (
            <GameUI 
              onStartGame={startGame} 
              onRestartGame={restartGame} 
              onBackToHome={handleReturnToHome}
            />
          )}

          {/* Game Canvas/3D Content */}
          <KeyboardControls map={keyMap}>
            <Canvas
              shadows
              camera={{
                position: [0, 1.8, 5],
                fov: 75,
                near: 0.1,
                far: 1000
              }}
              gl={{
                antialias: true,
                powerPreference: "default"
              }}
            >
              <color attach="background" args={["#87CEEB"]} />
              <fog attach="fog" args={["#87CEEB", 30, 100]} />

              <Suspense fallback={null}>
                {/* Only render Game component when not in home phase */}
                {phase !== "home" && <Game />}
              </Suspense>
            </Canvas>
          </KeyboardControls>
        </>
      )}
    </div>
  );
}

export default App;