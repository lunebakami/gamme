import { spawnOtherPlayer, removeOtherPlayer, updateOtherPlayer, otherPlayerWaves, setMyPlayerPosition } from './Scene';

let ws: WebSocket | null = null;
let myPlayerId: string | null = null;
let mySessionId: string | null = null;
let lastPositionSent = 0;
const POSITION_UPDATE_INTERVAL = 50; // Send updates every 100ms

// Salvar sessão no localStorage
function saveSession(sessionId: string, playerData: any) {
  localStorage.setItem('gameSession', JSON.stringify({
    sessionId,
    playerData,
    timestamp: Date.now(),
  }));
}

// Recuperar sessão do localStorage
function loadSession() {
  const saved = localStorage.getItem('gameSession');
  if (!saved) return null;

  const session = JSON.parse(saved);
  const age = Date.now() - session.timestamp;

  // Sessão válida por 5 minutos
  if (age > 5 * 60 * 1000) {
    localStorage.removeItem('gameSession');
    return null;
  }

  return session;
}

// Limpar sessão
function clearSession() {
  localStorage.removeItem('gameSession');
}

// Chat message callback
let chatMessageCallback: ((data: any) => void) | null = null;

export function connectToServer(playerName: string, avatar: any) {
  // Tentar recuperar sessão existente
  const savedSession = loadSession();
  const isReconnecting = savedSession !== null;

  const url = import.meta.env.VITE_SERVER_URL;
  ws = new WebSocket(url + '/game');

  ws.onopen = () => {
    console.log('Connected to server');

    if (isReconnecting) {
      console.log('Attempting to reconnect with session:', savedSession.sessionId);
      ws?.send(JSON.stringify({
        type: 'player:reconnect',
        sessionId: savedSession.sessionId,
        name: playerName,
        avatar: avatar,
      }));
    } else {
      ws?.send(JSON.stringify({
        type: 'player:join',
        name: playerName,
        avatar: avatar,
      }));
    }
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'reconnect:success') {
      console.log('Reconnection successful!');
      myPlayerId = data.yourId;

      // Restaurar posição
      if (data.position) {
        setMyPlayerPosition(data.position);
      }
    }

    if (data.type === 'reconnect:failed') {
      console.log('Reconnection failed, joining as new player');
      clearSession();
    }

    if (data.type === 'game:init') {
      console.log('Game initialized');
      myPlayerId = data.yourId;
      mySessionId = data.sessionId;

      // Salvar sessão
      saveSession(data.sessionId, { name: playerName, avatar });
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

    if (data.type === 'player:waved') {
      if (data.id !== myPlayerId) {
        otherPlayerWaves(data.id)
      }
    }
    //
    // Limpar sessão ao sair da página (não ao recarregar)
    window.addEventListener('beforeunload', (e) => {
      // Não fazer nada - deixar a sessão salva para reconexão
    });
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
