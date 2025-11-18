import { GAME_CONFIG } from '@gamme/shared';
import { spawnOtherPlayer, removeOtherPlayer, updateOtherPlayer } from './Scene';

let ws: WebSocket | null = null;
let myPlayerId: string | null = null;
let lastPositionSent = 0;
const POSITION_UPDATE_INTERVAL = 50; // Send updates every 100ms

// Chat message callback
let chatMessageCallback: ((data: any) => void) | null = null;

export function connectToServer(playerName: string, avatar: any) {
  ws = new WebSocket(GAME_CONFIG.SERVER_URL + '/game');

  ws.onopen = () => {
    console.log('Connected to server');
    ws?.send(JSON.stringify({
      type: 'player:join',
      name: playerName,
      avatar: avatar,
    }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'game:init') {
      myPlayerId = data.yourId;
      console.log('My player ID:', myPlayerId);
      console.log('Current players:', data.players);

      data.players.forEach((player: any) => {
        if (player.id !== myPlayerId) {
          spawnOtherPlayer(player);
        }
      });
    }

    if (data.type === 'player:joined') {
      const player = data.player;
      if (player.id !== myPlayerId) {
        console.log('Player joined:', player.name);
        spawnOtherPlayer(player);
      }
    }

    if (data.type === 'player:left') {
      console.log('Player left:', data.id);
      removeOtherPlayer(data.id);
    }

    if (data.type === 'player:update') {
      if (data.id !== myPlayerId) {
        updateOtherPlayer(data.id, data.position, data.isMoving || false);
      }
    }

    if (data.type === 'chat:message') {
      console.log('Chat message received:', data);
      if (chatMessageCallback) {
        chatMessageCallback(data);
      }
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Disconnected from server');
  };
}

export function sendMovement(position: { x: number; y: number; z: number }, isMoving: boolean = true) {
  const now = Date.now();
  if (ws && ws.readyState === WebSocket.OPEN && now - lastPositionSent > POSITION_UPDATE_INTERVAL) {
    ws.send(JSON.stringify({
      type: 'player:move',
      position: position,
      rotation: 0,
      isMoving: isMoving, // NEW: Send movement state
    }));
    lastPositionSent = now;
  }
}

export function sendWave() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'player:wave',
    }));
  }
}

export function sendChatMessage(message: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'chat:message',
      message: message,
    }));
  }
}

export function onChatMessage(callback: (data: any) => void) {
  chatMessageCallback = callback;
}
