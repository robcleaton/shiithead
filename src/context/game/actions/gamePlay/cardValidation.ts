
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
  // Special 7 rule: must play a card below 7 or special cards 2, 3, 8, or another 7
  else if (topCard.rank === '7') {
    if (['2', '3', '7', '8'].includes(cardRank) || rankValues[cardRank] < rankValues['7' as Rank]) {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        errorMessage: "After a 7 is played, you must play a card with rank below 7, a 7, or a special card (2, 3, 8)!"
      };
    }
  }
  // 10 can be played on any card (it's a burn card)
  else if (cardToPlay.rank === '10') {
    return { valid: true };
  }
  // Regular card play validation
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
  
  // Can always play on a 2
  if (topCard.rank === '2') {
    return { valid: true };
  }
  // Special 7 rule: must play a card below 7 or special cards 2, 3, 8, or another 7
  else if (topCard.rank === '7') {
    if (['2', '3', '7', '8'].includes(cardToPlay.rank) || rankValues[cardToPlay.rank] < rankValues['7' as Rank]) {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        errorMessage: "After a 7 is played, you must play a card with rank below 7, a 7, or a special card (2, 3, 8)!"
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
