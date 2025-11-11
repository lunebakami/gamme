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
  SERVER_URL: 'ws://localhost:3000'
} as const;

export interface GameState {
  players: Map<string, PlayerState>
}

export interface ClientToServerEvents {
  'player:join': { name: string }
}

export interface ServerToClientEvents {
  'game.init': { players: PlayerState[], yourId: string },
  'player:joined': PlayerState,
  'player:left': { id: string }
}

console.log('Shared package loaded');
