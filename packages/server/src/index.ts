import { Elysia } from 'elysia';
import type { PlayerState } from '@gamme/shared';

const players = new Map<string, PlayerState>();
const sessions = new Map<string, string>(); // sessionId -> currentConnectionId
const playerSessions = new Map<string, string>(); // connectionId -> sessionId

// Gerar ID único de sessão
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const app = new Elysia()
  .ws('/game', {
    open(ws) {
      console.log('Client connected:', ws.id)
    },
    message(ws, message: any) {
      const data = typeof message === 'string' ? JSON.parse(message) : message;

      if (data.type === 'player:reconnect') {
        const sessionId = data.sessionId;
        const oldConnectionId = sessions.get(sessionId);

        console.log({
          sessionId,
          sessions
        })

        if (oldConnectionId) {
          // Encontrar o jogador antigo
          const oldPlayer = players.get(oldConnectionId);

          if (oldPlayer) {
            // Remover conexão antiga
            players.delete(oldConnectionId);
            playerSessions.delete(oldConnectionId);

            // Criar novo jogador com mesmo estado
            const playerId = ws.id as string;
            const reconnectedPlayer: PlayerState = {
              ...oldPlayer,
              id: playerId,
              name: data.name,
              avatar: data.avatar,
              sessionId: sessionId,
            };

            players.set(playerId, reconnectedPlayer);
            sessions.set(sessionId, playerId);
            playerSessions.set(playerId, sessionId);

            // Subscribe
            ws.subscribe('game');

            // Enviar confirmação de reconexão
            ws.send(JSON.stringify({
              type: 'reconnect:success',
              yourId: playerId,
              position: reconnectedPlayer.position,
            }));

            // Enviar estado do jogo
            ws.send(JSON.stringify({
              type: 'game:init',
              players: Array.from(players.values()),
              yourId: playerId,
              sessionId: sessionId,
            }));

            // Notificar outros jogadores
            ws.publish('game', JSON.stringify({
              type: 'player:joined',
              player: reconnectedPlayer,
            }));

            console.log(`Player ${data.name} reconnected with session ${sessionId}`);
            return;
          }
        }

        // Falha na reconexão - enviar falha
        ws.send(JSON.stringify({
          type: 'reconnect:failed',
        }));
        return;
      }

      if (data.type === 'player:join') {
        const playerId = ws.id as string;
        const sessionId = data.sessionId || generateSessionId();

        const newPlayer: PlayerState = {
          id: playerId,
          name: data.name,
          position: { x: 0, y: 0.5, z: 0 },
          rotation: 0,
          score: 0,
          isAlive: true,
          avatar: data.avatar,
          sessionId,
        };

        players.set(playerId, newPlayer);
        sessions.set(sessionId, playerId);
        playerSessions.set(playerId, sessionId);

        // Subscribe this connection to game channel
        ws.subscribe('game')

        // Send current game state to the new player
        ws.send(JSON.stringify({
          type: 'game:init',
          players: Array.from(players.values()),
          yourId: playerId,
          name: data.name,
          sessionId,
        }))

        // Broadcast the new player's state to all other players
        ws.publish('game', JSON.stringify({
          type: 'player:joined',
          player: newPlayer
        }))

        console.log(`Player ${data.name} (${playerId}) joined. Total players: ${players.size}`);
      }

      if (data.type === 'player:move') {
        const playerId = ws.id;
        const player = players.get(playerId);
        if (player) {
          player.position = data.position;
          player.rotation = data.rotation;

          ws.publish('game', JSON.stringify({
            type: 'player:update',
            id: playerId,
            position: data.position,
            rotation: data.rotation,
            isMoving: data.isMoving, // NEW: Broadcast movement state
          }))
        }
      }

      if (data.type === 'player:wave') {
        const playerId = ws.id as string;
        ws.publish('game', JSON.stringify({
          type: 'player:waved',
          id: playerId,
        }));
      }

      if (data.type === 'chat:message') {
        const playerId = ws.id as string;
        const player = players.get(playerId);

        if (player) {
          // Broadcast to ALL players including sender
          const chatData = JSON.stringify({
            type: 'chat:message',
            playerId: playerId,
            playerName: player.name,
            message: data.message,
          });

          ws.publish('game', chatData);
          // Also send to sender
          ws.send(chatData);

          console.log(`${player.name}: ${data.message}`);
        }
      }

    },
    close(ws) {
      const playerId = ws.id;
      const player = players.get(playerId);
      const sessionId = playerSessions.get(playerId);

      if (player) {
        console.log(`Player ${player.name} (${playerId}) disconnected. Waiting for reconnection...`);
        setTimeout(() => {
          // Verificar se ainda está desconectado
          const currentConnectionId = sessions.get(sessionId!);
          if (currentConnectionId === playerId) {
            players.delete(playerId);
            sessions.delete(sessionId!);
            playerSessions.delete(playerId);

            ws.publish('game', JSON.stringify({
              type: 'player:left',
              id: playerId,
            }));

            console.log(`Player ${player.name} (${playerId}) removed after timeout. Total players: ${players.size}`);
          }
        }, 30000)
      }
    }
  })
  .get('/', () => 'Game Server Running')
  .listen(3000);

console.log(`Game config:`);
