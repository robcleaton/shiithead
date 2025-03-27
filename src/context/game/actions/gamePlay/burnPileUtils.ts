
import { GameState, CardValue } from '@/types/game';
import { toast } from 'sonner';

export const processBurnConditions = (
  state: GameState,
  cardsToPlay: CardValue[]
): {
  updatedPile: CardValue[];
  shouldGetAnotherTurn: boolean;
  burnMessage: string | null;
} => {
  // Start with a copy of the current pile
  let updatedPile = [...state.pile];
  
  // Add the new cards to the pile
  updatedPile = [...updatedPile, ...cardsToPlay];
  
  // If a 10 is played, clear the pile and give player another turn
  if (cardsToPlay.some(card => card.rank === '10')) {
    return {
      updatedPile: [],
      shouldGetAnotherTurn: true,
      burnMessage: 'played a 10 and cleared the pile!'
    };
  }
  
  // Check for 4 of a kind in the resulting pile
  const rankCounts: Record<string, number> = {};
  
  // Count occurrences of each rank
  for (const card of updatedPile) {
    if (!rankCounts[card.rank]) {
      rankCounts[card.rank] = 0;
    }
    rankCounts[card.rank]++;
  }
  
  // Check if any rank has 4 occurrences
  for (const [rank, count] of Object.entries(rankCounts)) {
    if (count >= 4) {
      return {
        updatedPile: [],
        shouldGetAnotherTurn: true,
        burnMessage: `played the 4th ${rank} and burned the pile!`
      };
    }
  }
  
  // No burn conditions met
  return {
    updatedPile,
    shouldGetAnotherTurn: false,
    burnMessage: null
  };
};
