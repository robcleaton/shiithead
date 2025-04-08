
import { GameState } from '@/types/game';
import { generateId } from '@/utils/gameUtils';

export const initialState: GameState = {
  players: [],
  deck: [],
  pile: [],
  currentPlayerId: null,
  gameStarted: false,
  gameOver: false,
  gameId: null,
  playerId: generateId(),
  currentPlayerName: '',
  isHost: false,
  isLoading: false,
  setupPhase: false
};
