
import { CardValue } from '@/types/game';
import { toast } from 'sonner';
import { validateSingleCardPlay, validateMultipleCardsPlay } from './cardValidation';

// Validate that all cards to be played are of the same rank
export const validateSameRank = (
  cardsToPlay: CardValue[]
): boolean => {
  const firstCardRank = cardsToPlay[0]?.rank;
  return cardsToPlay.every(card => card.rank === firstCardRank);
};

// Validate the indices of cards to be played
export const validateCardIndices = (
  sortedIndices: number[],
  handLength: number
): boolean => {
  return !sortedIndices.some(index => index < 0 || index >= handLength);
};

// Validate the play against the top card on the pile
export const validatePlayAgainstPile = (
  cardsToPlay: CardValue[],
  pile: CardValue[]
): boolean => {
  if (pile.length === 0) return true;
  
  const topCard = pile[pile.length - 1];
  
  if (topCard.rank === '3' && cardsToPlay[0].rank !== '3') {
    toast.error("You must play a 3 or pick up the pile!");
    return false;
  }
  
  if (cardsToPlay.length === 1) {
    const validation = validateSingleCardPlay(cardsToPlay[0], topCard);
    if (!validation.valid) {
      toast.error(validation.errorMessage);
      return false;
    }
  } else {
    const validation = validateMultipleCardsPlay(cardsToPlay[0], topCard);
    if (!validation.valid) {
      toast.error(validation.errorMessage);
      return false;
    }
  }
  
  return true;
};
