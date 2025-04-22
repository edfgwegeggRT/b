import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PointerLockControls, Stats } from "@react-three/drei";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";
import World from "./World";
import Player from "./Player";
import AI from "./AI";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useAI } from "@/lib/stores/useAI";

const Game = () => {
  const { phase } = useGame();
  const { backgroundMusic, isMuted } = useAudio();
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const playerState = usePlayer();
  const aiState = useAI();
  const lastFrameTime = useRef(0);

  // Initialize the game
  useEffect(() => {
    if (phase === "playing") {
      // Lock controls when game starts
      if (controlsRef.current) {
        controlsRef.current.lock();
      }

      // Start background music if not muted
      if (backgroundMusic && !isMuted) {
        backgroundMusic.play().catch(err => console.log("Audio play prevented:", err));
      }

      // Initialize game state
      playerState.reset();
      aiState.reset();
    }

    // Clean up function
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
    };
  }, [phase, backgroundMusic, isMuted]);

  // Handle player respawn
  useEffect(() => {
    if (playerState.health <= 0 && phase === "playing") {
      useGame.getState().end();
      console.log("Player died, game ended");
    }
  }, [playerState.health, phase]);

  // Handle game end when AI dies
  useEffect(() => {
    if (aiState.health <= 0 && phase === "playing") {
      console.log("AI died, returning to home");
      useGame.getState().returnToHome();
    }
  }, [aiState.health, phase]);

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

  return (
    <>
      <Stats />
      <PointerLockControls ref={controlsRef} args={[camera, gl.domElement]} />
      <World />
      <Player />
      <AI />
    </>
  );
};

export default Game;