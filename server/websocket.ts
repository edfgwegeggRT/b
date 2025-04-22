import WebSocket from "ws";
import { Server } from "http";

// Message types
type MessageType = 
  | "connect"
  | "disconnect" 
  | "player_update"
  | "projectile_create"
  | "projectile_hit"
  | "structure_create"
  | "structure_damage"
  | "player_list"
  | "player_join"
  | "player_leave"
  | "match_found";

// Message interface
interface WebSocketMessage {
  type: MessageType;
  data: any;
}

// Player data
interface PlayerData {
  id: string;
  position: [number, number, number];
  health: number;
}

// WebSocket handler for multiplayer functionality
export function setupWebSocketServer(server: Server) {
  // Create WebSocket server that works with both HTTP and HTTPS
  const wss = new WebSocket.Server({ 
    server,
    // Enable connection from both secure and insecure origins
    perMessageDeflate: true 
  });
  
  // Track connected players and their WebSocket connections
  const players = new Map<string, PlayerData>();
  const connections = new Map<string, WebSocket>();
  
  // 1v1 matchmaking state
  const waitingPlayers: string[] = [];
  const matches = new Map<string, string[]>(); // matchId -> [playerId1, playerId2]
  const playerMatches = new Map<string, string>(); // playerId -> matchId
  
  // Connection handler
  wss.on("connection", (ws) => {
    // Generate unique ID for player
    const playerId = "player_" + Math.random().toString(36).substring(2, 9);
    console.log(`WebSocket: New player connected (${playerId})`);
    
    // Add player to connected players
    players.set(playerId, {
      id: playerId,
      position: [0, 0, 0],
      health: 100
    });
    
    // Store connection
    connections.set(playerId, ws);
    
    // Send initial connection message with player ID
    ws.send(JSON.stringify({
      type: "connect",
      data: {
        id: playerId,
        players: [] // Don't send all players - will be handled by matchmaking
      }
    }));
    
    // 1v1 Matchmaking - add player to waiting list
    waitingPlayers.push(playerId);
    console.log(`WebSocket: Player ${playerId} added to matchmaking queue`);
    
    // If we have two waiting players, create a match
    if (waitingPlayers.length >= 2) {
      const player1Id = waitingPlayers.shift()!;
      const player2Id = waitingPlayers.shift()!;
      
      // Create a new match
      const matchId = `match_${Date.now()}`;
      matches.set(matchId, [player1Id, player2Id]);
      playerMatches.set(player1Id, matchId);
      playerMatches.set(player2Id, matchId);
      
      console.log(`WebSocket: Created 1v1 match ${matchId} between ${player1Id} and ${player2Id}`);
      
      // Get player connections
      const player1Ws = connections.get(player1Id);
      const player2Ws = connections.get(player2Id);
      
      if (player1Ws && player2Ws) {
        // Get player data
        const player1Data = players.get(player1Id);
        const player2Data = players.get(player2Id);
        
        if (player1Data && player2Data) {
          // Notify player 1 about player 2
          player1Ws.send(JSON.stringify({
            type: "match_found",
            data: {
              opponent: player2Data
            }
          }));
          
          // Notify player 2 about player 1
          player2Ws.send(JSON.stringify({
            type: "match_found",
            data: {
              opponent: player1Data
            }
          }));
        }
      }
    }
    
    // Message handler
    ws.on("message", (message: string) => {
      try {
        const parsedMessage = JSON.parse(message) as WebSocketMessage;
        
        // Handle different message types
        switch (parsedMessage.type) {
          case "connect":
            // Client confirms connection with their data
            if (parsedMessage.data.id && parsedMessage.data.position) {
              // Update player data
              const playerData = players.get(playerId);
              if (playerData) {
                playerData.position = parsedMessage.data.position;
                playerData.health = parsedMessage.data.health || 100;
              }
            }
            break;
          case "player_update":
            handlePlayerUpdate(playerId, parsedMessage.data);
            break;
          case "projectile_create":
            handleProjectileCreate(playerId, parsedMessage.data);
            break;
          case "projectile_hit":
            handleProjectileHit(playerId, parsedMessage.data);
            break;
          case "structure_create":
            handleStructureCreate(playerId, parsedMessage.data);
            break;
          case "structure_damage":
            handleStructureDamage(playerId, parsedMessage.data);
            break;
          default:
            console.log(`WebSocket: Unknown message type: ${parsedMessage.type}`);
        }
      } catch (error) {
        console.log("WebSocket: Error parsing message", error);
      }
    });
    
    // Disconnect handler
    ws.on("close", () => {
      console.log(`WebSocket: Player disconnected (${playerId})`);
      
      // Remove player from connected players
      players.delete(playerId);
      connections.delete(playerId);
      
      // Remove from waiting queue if present
      const waitingIndex = waitingPlayers.indexOf(playerId);
      if (waitingIndex !== -1) {
        waitingPlayers.splice(waitingIndex, 1);
      }
      
      // Check if player was in a match
      const matchId = playerMatches.get(playerId);
      if (matchId) {
        // Get the match players
        const matchPlayerIds = matches.get(matchId);
        
        if (matchPlayerIds) {
          // Notify the opponent that this player has left
          for (const opponentId of matchPlayerIds) {
            if (opponentId !== playerId) {
              const opponentWs = connections.get(opponentId);
              if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
                opponentWs.send(JSON.stringify({
                  type: "player_leave",
                  data: {
                    id: playerId
                  }
                }));
              }
            }
          }
          
          // Remove match
          matches.delete(matchId);
        }
        
        // Remove player from match mapping
        playerMatches.delete(playerId);
      }
      
      // Broadcast disconnect to all other players
      broadcastToOthers(playerId, {
        type: "disconnect",
        data: {
          id: playerId
        }
      });
    });
    
    // Broadcast to opponent in the same match
    function broadcastToOpponent(senderId: string, message: WebSocketMessage) {
      // Check if player is in a match
      const matchId = playerMatches.get(senderId);
      if (matchId) {
        // Get match players
        const matchPlayerIds = matches.get(matchId);
        if (matchPlayerIds) {
          // Find the opponent
          for (const opponentId of matchPlayerIds) {
            if (opponentId !== senderId) {
              // Get opponent connection
              const opponentWs = connections.get(opponentId);
              if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
                // Send message to opponent
                opponentWs.send(JSON.stringify(message));
              }
            }
          }
        }
      }
    }
    
    // Broadcast to all players except sender (legacy method, kept for compatibility)
    function broadcastToOthers(senderId: string, message: WebSocketMessage) {
      // Use the new match-based method instead
      broadcastToOpponent(senderId, message);
    }
    
    // Broadcast to all players in the same match
    function broadcastToAll(message: WebSocketMessage) {
      // Check if player is in a match
      const matchId = playerMatches.get(playerId);
      if (matchId) {
        // Get match players
        const matchPlayerIds = matches.get(matchId);
        if (matchPlayerIds) {
          // Send to all players in the match
          for (const matchPlayerId of matchPlayerIds) {
            const playerWs = connections.get(matchPlayerId);
            if (playerWs && playerWs.readyState === WebSocket.OPEN) {
              playerWs.send(JSON.stringify(message));
            }
          }
        }
      }
    }
    
    // Handler functions
    function handlePlayerUpdate(playerId: string, data: any) {
      // Update player data
      const playerData = players.get(playerId);
      if (playerData) {
        playerData.position = data.position;
        playerData.health = data.health;
      }
      
      // Broadcast update to all other players
      broadcastToOthers(playerId, {
        type: "player_update",
        data: {
          id: playerId,
          position: data.position,
          health: data.health
        }
      });
    }
    
    function handleProjectileCreate(playerId: string, data: any) {
      // Broadcast projectile to all other players
      broadcastToOthers(playerId, {
        type: "projectile_create",
        data: {
          id: data.id,
          playerId: playerId,
          position: data.position,
          direction: data.direction,
          damage: data.damage
        }
      });
    }
    
    function handleProjectileHit(playerId: string, data: any) {
      // Broadcast hit to all players
      broadcastToAll({
        type: "projectile_hit",
        data: {
          id: data.id,
          targetId: data.targetId
        }
      });
    }
    
    function handleStructureCreate(playerId: string, data: any) {
      // Broadcast structure to all players
      broadcastToAll({
        type: "structure_create",
        data: {
          id: data.id,
          position: data.position,
          type: data.type
        }
      });
    }
    
    function handleStructureDamage(playerId: string, data: any) {
      // Broadcast damage to all players
      broadcastToAll({
        type: "structure_damage",
        data: {
          id: data.id,
          damage: data.damage
        }
      });
    }
  });
  
  console.log("WebSocket server initialized");
  return wss;
}
