export interface Avatar {
  color: string;
  body: string;
}

export interface PlayerState {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  score: number;
  isAlive: boolean;
  avatar: Avatar;
  sessionId?: string; // NOVO: Para reconexão
};

export const GAME_CONFIG = {
  TICK_RATE: 60,
  MAX_PLAYERS: 4,
  SERVER_URL: Bun.env.SERVER_URL || 'ws://localhost:3000',
  UPDATE_RATE: 50,
} as const;

export interface GameState {
  players: Map<string, PlayerState>
}

export interface ClientToServerEvents {
  'player:join': { name: string; avatar: any; sessionId?: string }; // ATUALIZADO
  'player:reconnect': { sessionId: string; name: string; avatar: any }; // NOVO
  'player:move': {
    position: { x: number; y: number; z: number };
    rotation: number;
    isMoving?: boolean; // NEW: Optional movement state
  },
  'player:wave': {};
  'player:birthday': {};
  'chat:message': { message: string };
}

export interface ServerToClientEvents {
  'game:init': { players: PlayerState[]; yourId: string; sessionId: string }; // ATUALIZADO
  'player:joined': PlayerState,
  'player:reconnected': PlayerState,
  'player:left': { id: string },
  'player:update': {
    id: string,
    position: {
      x: number;
      y: number;
      z: number;
    },
    rotation: number;
    isMoving?: boolean; // NEW: Optional movement state
  'player:waved': { id: string };
  'player:birthday': { id: string };
  'chat:message': { playerId: string; playerName: string; message: string };
  'reconnect:success': { yourId: string; position: any }; // NOVO
  'reconnect:failed': {}; // NOVO
  }
}

console.log('Shared package loaded');
