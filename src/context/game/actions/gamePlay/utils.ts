
import { CardValue, Rank, Player } from '@/types/game';

// Shared utility functions and constants
export const rankValues: Record<Rank, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, 
  '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
};

export const getCardRankValue = (rank: Rank): number => {
  return rankValues[rank] || 0;
};

export const isAIPlayer = (player: Player): boolean => {
  return player.name.includes('Test') || player.name.includes('AI');
};
