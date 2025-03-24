
import { CardValue, Rank } from '@/types/game';
import { rankValues } from './utils';

export const validateSingleCardPlay = (
  cardToPlay: CardValue,
  topCard: CardValue | undefined
): { valid: boolean; errorMessage?: string } => {
  if (!topCard) {
    return { valid: true };
  }
  
  const specialCards = ['2', '3', '7', '8', '10'];
  const cardRank = cardToPlay.rank;
  
  // Can always play on a 2
  if (topCard.rank === '2') {
    return { valid: true };
  }
  // Special 7 rule: must play a card below 7 or special cards 2, 3, 8
  else if (topCard.rank === '7') {
    if (['2', '3', '8'].includes(cardRank) || rankValues[cardRank as Rank] < rankValues['7' as Rank]) {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        errorMessage: "After a 7 is played, you must play a card with rank below 7 or a special card (2, 3, 8)!"
      };
    }
  }
  // Cannot play 10 on 7
  else if (cardToPlay.rank === '10' && topCard.rank === '7') {
    return { 
      valid: false, 
      errorMessage: "Cannot play a 10 on top of a 7!"
    };
  }
  // Regular card play validation
  else if (!specialCards.includes(cardRank) && cardRank !== topCard.rank) {
    if (rankValues[cardRank as Rank] <= rankValues[topCard.rank as Rank]) {
      return { 
        valid: false, 
        errorMessage: "Invalid move! Card must be higher ranked than the top card or be a special card (2, 3, 7, 8, 10)."
      };
    }
  }
  
  return { valid: true };
};

export const validateMultipleCardsPlay = (
  cardToPlay: CardValue,
  topCard: CardValue | undefined
): { valid: boolean; errorMessage?: string } => {
  if (!topCard) {
    return { valid: true };
  }
  
  // Can always play on a 2
  if (topCard.rank === '2') {
    return { valid: true };
  }
  // Special 7 rule: must play a card below 7 or special cards 2, 3, 8
  else if (topCard.rank === '7') {
    if (['2', '3', '8'].includes(cardToPlay.rank) || rankValues[cardToPlay.rank as Rank] < rankValues['7' as Rank]) {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        errorMessage: "After a 7 is played, you must play a card with rank below 7, or a special card (2, 3, 8)!"
      };
    }
  }
  // Regular multiple card play validation
  else if (!['2', '3', '8', '10'].includes(cardToPlay.rank) && cardToPlay.rank !== topCard.rank) {
    return { 
      valid: false, 
      errorMessage: "When playing multiple cards, they must match the top card's rank or be special cards."
    };
  }
  
  return { valid: true };
};

export const isValidPlay = (
  card: CardValue,
  pile: CardValue[],
  playerHand: CardValue[]
): boolean => {
  // Empty pile, any card is valid
  if (pile.length === 0) {
    return true;
  }

  const topCard = pile[pile.length - 1];

  // Special cards handling
  if (card.rank === "2" || card.rank === "10") {
    return true; // 2 and 10 can be played on anything
  }

  if (topCard.rank === "8") {
    return card.rank === "8"; // Only an 8 can be played on an 8
  }

  // When a 7 was played, next card must be lower than 7 or special cards (2, 3, 8)
  if (topCard.rank === "7") {
    return ["2", "3", "8"].includes(card.rank) || rankValues[card.rank as Rank] < rankValues['7' as Rank];
  }

  // Match by rank or higher value
  return card.rank === topCard.rank || rankValues[card.rank as Rank] >= rankValues[topCard.rank as Rank];
};

function getCardRankValue(rank: string): number {
  return rankValues[rank as Rank];
}
