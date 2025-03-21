
// Re-export from the refactored structure for backward compatibility
import { GameProvider, useGame } from './game/GameContext';
import { CardValue, Suit, Rank, Player, GameState } from '@/types/game';

export { GameProvider, useGame };
export type { CardValue, Suit, Rank, Player, GameState };
