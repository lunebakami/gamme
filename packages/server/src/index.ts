import { Elysia } from 'elysia';
import type { PlayerState } from '@gamme/shared';

const players = new Map<string, PlayerState>();

const app = new Elysia()
  .ws('/game', {
    open(ws) {
      console.log('Client connected:', ws.id)
    },
    message(ws, message: any) {
      const data = typeof message === 'string' ? JSON.parse(message) : message;

      if (data.type === 'player:join') {
        const playerId = ws.id as string;

        const newPlayer: PlayerState = {
          id: playerId,
          name: data.name,
          position: { x: 0, y: 0.5, z: 0 },
          rotation: 0,
          score: 0,
          isAlive: true
        };

        players.set(playerId, newPlayer);


        // Subscribe this connection to game channel
        ws.subscribe('game')

        // Send current game state to the new player
        ws.send(JSON.stringify({
          type: 'game:init',
          players: Array.from(players.values()),
          yourId: playerId
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
          }))
        }
      }
    },
    close(ws) {
      const playerId = ws.id;
      const player = players.get(playerId);
      if (player) {
        players.delete(playerId);
        // Notify other players that the player has left
        ws.publish('game', JSON.stringify({
          type: 'player:left',
          id: playerId
        }))

        console.log(`Player ${player.name} (${playerId}) left. Total players: ${players.size}`);
      }
    }
  })
  .get('/', () => 'Game Server Running')
  .listen(3000);

console.log(`Game config:`);
