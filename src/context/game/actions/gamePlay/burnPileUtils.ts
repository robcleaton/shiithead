
import { CardValue } from '@/types/game';
import { toast } from 'sonner';

// Helper function to check if there are 4 cards of the same rank in the pile
export const checkForFourOfAKind = (pile: CardValue[], newCards: CardValue[]): boolean => {
  if (pile.length + newCards.length < 4) return false;
  
  // Create a map to count occurrences of each rank in the combined pile
  const rankCounts = new Map<string, number>();
  
  // Count ranks in the existing pile
  pile.forEach(card => {
    const count = rankCounts.get(card.rank) || 0;
    rankCounts.set(card.rank, count + 1);
  });
  
  // Count ranks in the new cards being played
  newCards.forEach(card => {
    const count = rankCounts.get(card.rank) || 0;
    rankCounts.set(card.rank, count + 1);
  });
  
  // Check if any rank has exactly 4 cards
  for (const [rank, count] of rankCounts.entries()) {
    if (count === 4) {
      return true;
    }
  }
  
  return false;
};

// Process burn conditions and update the pile accordingly
export const processBurnConditions = (
  state: { pile: CardValue[] },
  cardsToPlay: CardValue[]
): { updatedPile: CardValue[], shouldGetAnotherTurn: boolean, burnMessage: string | null } => {
  let updatedPile: CardValue[] = [];
  let shouldGetAnotherTurn = false;
  let burnMessage = null;
  
  // Check for burn conditions
  const isBurnCard = cardsToPlay.some(card => card.rank === '10');
  const isFourOfAKind = checkForFourOfAKind(state.pile, cardsToPlay);
  
  if (isBurnCard) {
    updatedPile = [];
    shouldGetAnotherTurn = true;
    burnMessage = "played a 10 - the discard pile has been completely emptied!";
  } else if (isFourOfAKind) {
    updatedPile = [];
    shouldGetAnotherTurn = true;
    burnMessage = `has completed a set of 4 ${cardsToPlay[0].rank}s - the discard pile has been burned!`;
  } else {
    updatedPile = [...state.pile, ...cardsToPlay];
  }
  
  return { updatedPile, shouldGetAnotherTurn, burnMessage };
};
