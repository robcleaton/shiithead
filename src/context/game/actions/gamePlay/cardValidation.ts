
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
  // Special 3 rule: must play a 3 or pick up the pile
  else if (topCard.rank === '3') {
    if (cardRank === '3') {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        errorMessage: "After a 3 is played, you must play another 3 or pick up the pile!"
      };
    }
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
  // 3 can be played on any card
  else if (cardToPlay.rank === '3') {
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
  cardsToPlay: CardValue[], // Changed parameter to accept array of cards
  topCard: CardValue | undefined
): { valid: boolean; errorMessage?: string } => {
  if (!topCard) {
    return { valid: true };
  }
  
  // For multiple cards, we only care that they're all the same rank
  // First ensure all cards are the same rank
  const firstCard = cardsToPlay[0];
  const allSameRank = cardsToPlay.every(card => card.rank === firstCard.rank);
  
  if (!allSameRank) {
    return {
      valid: false,
      errorMessage: "All cards must be of the same rank to play multiple cards!"
    };
  }
  
  // Special card rules still apply for the first card
  
  // Can always play on a 2
  if (topCard.rank === '2') {
    return { valid: true };
  }
  // Special 3 rule: must play a 3 or pick up the pile
  else if (topCard.rank === '3') {
    if (firstCard.rank === '3') {
      return { valid: true };
    } else {
      return {
        valid: false,
        errorMessage: "After a 3 is played, you must play another 3 or pick up the pile!"
      };
    }
  }
  // Special 7 rule: must play a card below 7 or special cards 2, 3, 8, or another 7
  else if (topCard.rank === '7') {
    if (['2', '3', '7', '8'].includes(firstCard.rank) || rankValues[firstCard.rank] < rankValues['7' as Rank]) {
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
  
  // For multiple cards of the same rank, they can always be played on the same rank
  if (firstCard.rank === topCard.rank) {
    return { valid: true };
  }
  
  // Special cards can always be played
  if (['2', '3', '8', '10'].includes(firstCard.rank)) {
    return { valid: true };
  }
  
  // For multiple cards of the same rank, they can be played if higher than top card
  if (rankValues[firstCard.rank] > rankValues[topCard.rank]) {
    return { valid: true };
  }
  
  return { 
    valid: false, 
    errorMessage: "When playing multiple cards of the same rank, they must be higher ranked than the top card or be special cards."
  };
};
