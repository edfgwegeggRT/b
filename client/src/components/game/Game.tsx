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

// Type for remote player
interface RemotePlayer {
  id: string;
  position: [number, number, number];
  health: number;
}

const Game = () => {
  const { phase, mode } = useGame();
  const { backgroundMusic, isMuted } = useAudio();
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const playerState = usePlayer();
  const aiState = useAI();
  const lastFrameTime = useRef(0);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);

  // WebSocket connection
  const socketRef = useRef<WebSocket | null>(null);
  // Store player ID to filter out own messages
  const playerIdRef = useRef<string>("");
  // Connection and matchmaking status
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "matched">("disconnected");
  // Timer for WebSocket heartbeat
  const heartbeatTimerRef = useRef<number | null>(null);

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
      const setupGame = () => {
        // Reset player state
        playerState.reset();
        
        // Reset AI in singleplayer mode
        if (mode === "singleplayer") {
          aiState.reset();
        }
        
        console.log(`Game started in ${mode} mode - controls locked, states reset`);
        
        // Setup WebSocket for multiplayer mode
        if (mode === "multiplayer" && !socketRef.current) {
          setupMultiplayerConnection();
        }
      };
      
      // Setup multiplayer WebSocket connection
      const setupMultiplayerConnection = () => {
        try {
          // Use secure WebSocket if page is loaded over HTTPS
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          console.log(`Connecting to WebSocket with ${protocol} protocol`);
          
          // Update connection status
          setConnectionStatus("connecting");
          
          const ws = new WebSocket(`${protocol}//${window.location.host}`);
          
          // Generate a unique player ID
          playerIdRef.current = "player_" + Math.random().toString(36).substring(2, 9);
          
          ws.onopen = () => {
            console.log("WebSocket connection established");
            
            // Send initial player data
            ws.send(JSON.stringify({
              type: "connect",
              data: {
                id: playerIdRef.current,
                position: playerState.position,
                health: playerState.health
              }
            }));
          };
          
          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              console.log("WebSocket message received:", message);
              
              // Handle different message types
              switch (message.type) {
                case "connect":
                  // Server confirms connection
                  console.log("Connection confirmed, player ID:", message.data.id);
                  break;
                  
                case "player_list":
                  // Update remote players list (filter out own player)
                  setRemotePlayers(message.data.filter((p: RemotePlayer) => 
                    p.id !== playerIdRef.current
                  ));
                  break;
                  
                case "player_update":
                  // Update a specific player's position
                  setRemotePlayers(prev => 
                    prev.map(p => p.id === message.data.id ? 
                      { ...p, position: message.data.position, health: message.data.health } : p
                    )
                  );
                  break;
                  
                case "player_join":
                  // Add a new player
                  if (message.data.id !== playerIdRef.current) {
                    setRemotePlayers(prev => [...prev, message.data]);
                  }
                  break;
                  
                case "player_leave":
                  // Remove a player
                  setRemotePlayers(prev => 
                    prev.filter(p => p.id !== message.data.id)
                  );
                  break;
                  
                case "match_found":
                  // Handle match found message
                  console.log("Match found with opponent:", message.data.opponent);
                  setRemotePlayers([message.data.opponent]);
                  break;
              }
            } catch (error) {
              console.error("Error parsing WebSocket message:", error);
            }
          };
          
          ws.onclose = () => {
            console.log("WebSocket connection closed");
            socketRef.current = null;
          };
          
          ws.onerror = (error) => {
            console.error("WebSocket error:", error);
          };
          
          // Store the WebSocket connection
          socketRef.current = ws;
        } catch (error) {
          console.error("Error creating WebSocket connection:", error);
        }
      };
      
      // Call setup once
      setupGame();
    }
    
    // Clean up function
    return () => {
      // Stop background music
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
      
      // Close WebSocket connection when component unmounts or game phase changes
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [phase, backgroundMusic, isMuted, mode]);

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
