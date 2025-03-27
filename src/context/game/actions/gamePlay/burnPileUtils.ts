
import { CardValue } from "@/types/game";

export const processBurnConditions = (
  state: { pile: CardValue[] },
  cardsToPlay: CardValue[],
  updatedPile?: CardValue[]
): {
  updatedPile: CardValue[];
  shouldGetAnotherTurn: boolean;
  burnMessage: string | null;
} => {
  // Use the provided pile or create one based on existing pile and cards to play
  const pileWithPlayedCards = updatedPile || [...state.pile, ...cardsToPlay];
  
  // Default response
  let response = {
    updatedPile: pileWithPlayedCards,
    shouldGetAnotherTurn: false,
    burnMessage: null as string | null
  };
  
  // Process 10s, which clear the pile
  for (const card of cardsToPlay) {
    if (card.rank === '10') {
      return {
        updatedPile: [],
        shouldGetAnotherTurn: true,
        burnMessage: "played a 10 and cleared the pile!"
      };
    }
  }
  
  // Process 4-of-a-kind
  if (pileWithPlayedCards.length >= 4) {
    const cardRanks = pileWithPlayedCards.map(card => card.rank);
    
    // Check if the last card's rank appears at least 4 times in the pile
    const lastCardRank = cardsToPlay[cardsToPlay.length - 1].rank;
    const rankCount = cardRanks.filter(rank => rank === lastCardRank).length;
    
    if (rankCount >= 4) {
      return {
        updatedPile: [],
        shouldGetAnotherTurn: true,
        burnMessage: `played the 4th ${lastCardRank} and burned the pile!`
      };
    }
  }
  
  return response;
};
