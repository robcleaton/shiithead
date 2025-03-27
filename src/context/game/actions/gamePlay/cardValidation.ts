
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
  // 8 is transparent - look at the card below it (if any)
  else if (topCard.rank === '8') {
    // For an 8, we return valid true - the actual validation against the card below the 8
    // happens in playCard.ts and related functions
    return { valid: true };
  }
  // 8 can be played on any card
  else if (cardToPlay.rank === '8') {
    return { valid: true };
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
  // 8 is transparent - any card can be played
  else if (topCard.rank === '8') {
    return { valid: true };
  }
  // Regular multiple card play validation - updated to allow same or higher rank
  else if (!['2', '3', '8', '10'].includes(cardToPlay.rank)) {
    // Special cards can always be played
    if (['2', '3', '8', '10'].includes(cardToPlay.rank)) {
      return { valid: true };
    }
    
    // For regular cards, they must match OR be higher than the top card's rank
    if (rankValues[cardToPlay.rank] < rankValues[topCard.rank]) {
      return { 
        valid: false, 
        errorMessage: "When playing multiple cards, they must be of equal or higher rank than the top card or be special cards."
      };
    }
  }
  
  return { valid: true };
};
