import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import Game from "./components/game/Game";
import { useGame } from "./lib/stores/useGame";
import GameUI from "./components/ui/GameUI";

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
  weaponSwitch = 'weaponSwitch'
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
  { name: Controls.weaponSwitch, keys: ["KeyQ"] }
];

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

  return (
    <div className="w-full h-full relative overflow-hidden">
      {showCanvas && (
        <>
          {/* Game UI (rendered as HTML, outside of Canvas) */}
          <GameUI onStartGame={startGame} onRestartGame={restartGame} />
          
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
                <Game />
              </Suspense>
            </Canvas>
          </KeyboardControls>
        </>
      )}
    </div>
  );
}

export default App;
