import { reactive } from 'vue';

interface GameStore {
  isConnected: boolean;
  playerName: string;
  playerId: string | null;
  players: Map<string, any>;
}

export const gameStore = reactive<GameStore>({
  isConnected: false,
  playerName: '',
  playerId: null,
  players: new Map(),
});
