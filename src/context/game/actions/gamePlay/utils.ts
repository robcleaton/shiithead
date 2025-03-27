
import { CardValue, Rank } from '@/types/game';

// Map card ranks to values for comparison
export const rankValues: Record<Rank, number> = {
  'A': 14,
  '2': 15, // Special card
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8, // Invisible card
  '9': 9,
  '10': 10, // Burn card
  'J': 11,
  'Q': 12,
  'K': 13
};

// Find the effective top card, accounting for 8s being transparent
export const getEffectiveTopCard = (pile: CardValue[]): CardValue | undefined => {
  if (pile.length === 0) return undefined;
  
  // Start from the top (last card in the pile)
  for (let i = pile.length - 1; i >= 0; i--) {
    // If we find a non-8 card, that's our effective top card
    if (pile[i].rank !== '8') {
      return pile[i];
    }
  }
  
  // If all cards are 8s, or the pile is empty, return undefined
  return undefined;
};
