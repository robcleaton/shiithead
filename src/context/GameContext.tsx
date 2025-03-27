
// Re-export from the refactored structure for backward compatibility
import { GameContext, GameProvider } from './game/GameContext';
import { CardValue, Suit, Rank, Player, GameState } from '@/types/game';

export { GameContext, GameProvider };
export type { CardValue, Suit, Rank, Player, GameState };
