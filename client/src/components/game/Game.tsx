import { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PointerLockControls, Stats } from "@react-three/drei";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";
import World from "./World";
import Player from "./Player";
import AI from "./AI";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useAI } from "@/lib/stores/useAI";
import RemotePlayer from "./RemotePlayer"; // Will create this component later

const Game = () => {
  const { phase, mode } = useGame();
  const { backgroundMusic, isMuted } = useAudio();
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const playerState = usePlayer();
  const aiState = useAI();
  const lastFrameTime = useRef(0);
  const [remotePlayers, setRemotePlayers] = useState<{id: string, position: [number, number, number]}[]>([]);

  // Initialize the game
  useEffect(() => {
    if (phase === "playing") {
      if (controlsRef.current) {
        controlsRef.current.lock();
      }
      
      // Start background music if not muted
      if (backgroundMusic && !isMuted) {
        backgroundMusic.play().catch(err => console.log("Audio play prevented:", err));
      }
      
      // Initialize states only on first game start
      // Use a single time setup to prevent update loops
      const setupGame = () => {
        // Only reset if needed to prevent excessive updates
        playerState.reset();
        aiState.reset();
        console.log("Game started - controls locked, states reset");
      };
      
      // Call setup once
      setupGame();
    }
    
    // Clean up function
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
    };
  // Remove the dependencies that cause updates, keep only phase and audio
  }, [phase, backgroundMusic, isMuted]);

  // Handle player respawn
  useEffect(() => {
    if (playerState.health <= 0 && phase === "playing") {
      // End the game if player dies
      useGame.getState().end();
      console.log("Player died, game ended");
    }
  }, [playerState.health, phase]);

  // Handle AI respawn
  useEffect(() => {
    if (aiState.health <= 0 && phase === "playing") {
      console.log("AI died, respawning");
      setTimeout(() => {
        aiState.reset();
      }, 3000);
    }
  }, [aiState.health, phase]);

  // Game update logic with frame rate limiting to prevent excessive updates
  useFrame((state, delta) => {
    if (phase !== "playing") return;
    
    // Throttle updates to 60 frames per second
    const now = performance.now();
    if (now - lastFrameTime.current < 16.67) { // 60 FPS = ~16.67ms per frame
      return;
    }
    lastFrameTime.current = now;
    
    // Update time counter
    playerState.updatePlayTime(delta);
    
    // Check for game end condition (e.g., time limit)
    if (playerState.playTime > 300) { // 5 minutes time limit
      useGame.getState().end();
    }
  });

  // Lock/unlock pointer when clicking canvas
  useEffect(() => {
    const handleCanvasClick = () => {
      if (phase === "playing" && controlsRef.current) {
        controlsRef.current.lock();
      }
    };

    const handleControlsUnlock = () => {
      if (phase === "playing") {
        console.log("Controls unlocked (paused)");
      }
    };

    // Add event listeners
    gl.domElement.addEventListener("click", handleCanvasClick);
    if (controlsRef.current) {
      controlsRef.current.addEventListener("unlock", handleControlsUnlock);
    }

    // Clean up event listeners
    return () => {
      gl.domElement.removeEventListener("click", handleCanvasClick);
      if (controlsRef.current) {
        controlsRef.current.removeEventListener("unlock", handleControlsUnlock);
      }
    };
  }, [gl, phase]);

  // Create a placeholder component for RemotePlayer until we create the actual file
  const RemotePlayerPlaceholder = ({ id, position }: { id: string, position: [number, number, number] }) => {
    return (
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[1, 1.8, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    );
  };

  return (
    <>
      {/* Performance stats (visible in development) */}
      <Stats />
      
      {/* First-person camera controls */}
      <PointerLockControls ref={controlsRef} args={[camera, gl.domElement]} />
      
      {/* Game world elements */}
      <World />
      
      {/* Player instance */}
      <Player />
      
      {/* Render opponents based on game mode */}
      {mode === "singleplayer" ? (
        // Render AI in singleplayer mode
        <AI />
      ) : (
        // Render remote players in multiplayer mode
        <>
          {remotePlayers.map(player => (
            <RemotePlayerPlaceholder 
              key={player.id} 
              id={player.id} 
              position={player.position} 
            />
          ))}
        </>
      )}
    </>
  );
};

export default Game;
