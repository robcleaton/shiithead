
import { toast } from 'sonner';
import { CardValue } from '@/types/game';
import { validateSingleCardPlay, validateMultipleCardsPlay } from './cardValidation';
import { getEffectiveTopCard } from './utils';

// Validate that all cards have the same rank
export const validateSameRank = (cards: CardValue[]): boolean => {
  if (cards.length <= 1) return true;
  
  const firstRank = cards[0].rank;
  return cards.every(card => card.rank === firstRank);
};

// Validate card indices are within range
export const validateCardIndices = (cardIndices: number[], handLength: number): boolean => {
  return cardIndices.every(index => index >= 0 && index < handLength);
};

// Validate the card play against the top card on the pile
export const validatePlayAgainstPile = (cards: CardValue[], pile: CardValue[]): boolean => {
  if (pile.length === 0) return true; // Can play any card on an empty pile
  
  // Find the actual top card, skipping 8s since they're transparent
  const effectiveTopCard = getEffectiveTopCard(pile);
  
  // If all the cards are 8s, any card can be played
  if (!effectiveTopCard) return true;
  
  // Special case for multiples of 7s - they can be played on any card
  if (cards.length > 1 && cards[0].rank === '7' && validateSameRank(cards)) {
    return true;
  }
  
  // Special case for multiple cards of the same rank
  if (cards.length > 1) {
    const validationResult = validateMultipleCardsPlay(cards, effectiveTopCard);
    if (!validationResult.valid) {
      toast.error(validationResult.errorMessage);
      return false;
    }
    return true;
  }
  
  // For a single card
  const validationResult = validateSingleCardPlay(cards[0], effectiveTopCard);
  if (!validationResult.valid) {
    toast.error(validationResult.errorMessage);
    return false;
  }
  
  return true;
};
