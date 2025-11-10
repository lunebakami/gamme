export interface PlayerState {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  }
};

export const GAME_CONFIG = {
  TICK_RATE: 60,
  MAX_PLAYERS: 4,
} as const;

console.log('Shared package loaded');
