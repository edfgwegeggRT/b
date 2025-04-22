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
  | "structure_damage";

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
  // Create WebSocket server
  const wss = new WebSocket.Server({ server });
  
  // Track connected players
  const players = new Map<string, PlayerData>();
  
  // Connection handler
  wss.on("connection", (ws) => {
    // Generate unique ID for player
    const playerId = Math.random().toString(36).substring(2, 9);
    console.log(`WebSocket: New player connected (${playerId})`);
    
    // Add player to connected players
    players.set(playerId, {
      id: playerId,
      position: [0, 0, 0],
      health: 100
    });
    
    // Send initial connection message with player ID
    ws.send(JSON.stringify({
      type: "connect",
      data: {
        id: playerId,
        players: Array.from(players.values())
      }
    }));
    
    // Broadcast new player to all other players
    broadcastToOthers(playerId, {
      type: "connect",
      data: {
        id: playerId,
        position: [0, 0, 0],
        health: 100
      }
    });
    
    // Message handler
    ws.on("message", (message: string) => {
      try {
        const parsedMessage = JSON.parse(message) as WebSocketMessage;
        
        // Handle different message types
        switch (parsedMessage.type) {
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
      
      // Broadcast disconnect to all other players
      broadcastToOthers(playerId, {
        type: "disconnect",
        data: {
          id: playerId
        }
      });
    });
    
    // Broadcast to all players except sender
    function broadcastToOthers(senderId: string, message: WebSocketMessage) {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
    
    // Broadcast to all players including sender
    function broadcastToAll(message: WebSocketMessage) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
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
