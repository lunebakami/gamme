export interface PlayerState {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  score: number;
  isAlive: boolean;
};

export const GAME_CONFIG = {
  TICK_RATE: 60,
  MAX_PLAYERS: 4,
  SERVER_URL: 'ws://localhost:3000',
  UPDATE_RATE: 50,
} as const;

export interface GameState {
  players: Map<string, PlayerState>
}

export interface ClientToServerEvents {
  'player:join': { name: string },
  'player:move': {
    position: { x: number; y: number; z: number };
    rotation: number;
  },
  'player:wave': {};
  'chat:message': { message: string };
}

export interface ServerToClientEvents {
  'game.init': { players: PlayerState[], yourId: string },
  'player:joined': PlayerState,
  'player:left': { id: string },
  'player:update': {
    id: string,
    position: {
      x: number;
      y: number;
      z: number;
    },
    rotation: number;
  'player:waved': { id: string };
  'chat:message': { playerId: string; playerName: string; message: string };
  }
}

console.log('Shared package loaded');
