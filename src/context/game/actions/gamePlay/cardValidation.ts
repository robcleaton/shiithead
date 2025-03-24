
import { CardValue } from '@/types/game';
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
  
  if (topCard.rank === '2') {
    return { valid: true };
  }
  else if (topCard.rank === '7' && !specialCards.includes(cardRank) && rankValues[cardRank] >= rankValues['7']) {
    return { 
      valid: false, 
      errorMessage: "After a 7 is played, you must play a card with rank below 7 or a special card!"
    };
  }
  else if (cardToPlay.rank === '10' && topCard.rank === '7') {
    return { 
      valid: false, 
      errorMessage: "Cannot play a 10 on top of a 7!"
    };
  }
  else if (!specialCards.includes(cardRank) && cardRank !== topCard.rank) {
    if (rankValues[cardRank] <= rankValues[topCard.rank]) {
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
  
  if (topCard.rank === '2') {
    return { valid: true };
  }
  else if (topCard.rank === '7' && cardToPlay.rank !== '7' && cardToPlay.rank !== '2' && 
           cardToPlay.rank !== '3' && cardToPlay.rank !== '8' && rankValues[cardToPlay.rank] >= rankValues['7']) {
    return { 
      valid: false, 
      errorMessage: "After a 7 is played, you must play a card with rank below a 7, or a special card!"
    };
  }
  else if (cardToPlay.rank !== '2' && cardToPlay.rank !== '3' && cardToPlay.rank !== '8' && 
           cardToPlay.rank !== '10' && cardToPlay.rank !== topCard.rank) {
    return { 
      valid: false, 
      errorMessage: "When playing multiple cards, they must match the top card's rank or be special cards."
    };
  }
  
  return { valid: true };
};
