
import { toast } from 'sonner';
import { Player, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { getEffectiveTopCard } from './utils';

// Shared validation for face up and face down cards
export const validateCardPlay = (
  player: Player,
  cardIndex: number,
  cardType: 'faceUp' | 'faceDown',
  topCard: CardValue | undefined,
  validation: (card: CardValue, topCard: CardValue | undefined) => { valid: boolean; errorMessage?: string },
  dispatch: Dispatch<GameAction>
): {
  isValid: boolean;
  cardToPlay?: CardValue;
  updatedCards?: CardValue[];
} => {
  const cardArray = cardType === 'faceUp' ? player.faceUpCards : player.faceDownCards;
  
  if (cardIndex < 0 || cardIndex >= cardArray.length) {
    toast.error(`Invalid ${cardType === 'faceUp' ? 'face up' : 'face down'} card selection`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return { isValid: false };
  }
  
  // Cannot play these cards if the player still has cards in hand
  if (player.hand.length > 0) {
    toast.error("You must play all cards in your hand first!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return { isValid: false };
  }
  
  // Cannot play face down cards if the player still has face up cards
  if (cardType === 'faceDown' && player.faceUpCards.length > 0) {
    toast.error("You must play all your face up cards first!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return { isValid: false };
  }
  
  const cardToPlay = cardArray[cardIndex];
  const updatedCards = [...cardArray];
  updatedCards.splice(cardIndex, 1);
  
  // Skip validation for face down cards (they're revealed when played)
  if (cardType === 'faceDown') {
    return { isValid: true, cardToPlay, updatedCards };
  }
  
  // Check if this is a valid play for face up cards
  if (topCard) {
    // Get the effective top card (accounting for 8s)
    const effectiveTopCard = getEffectiveTopCard([topCard]);
    
    // Special exception for 3's
    if (effectiveTopCard?.rank === '3' && cardToPlay.rank !== '3') {
      toast.error("You must play a 3 or pick up the pile!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return { isValid: false };
    }
    
    const validationResult = validation(cardToPlay, effectiveTopCard);
    if (!validationResult.valid) {
      toast.error(validationResult.errorMessage);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return { isValid: false };
    }
  }
  
  return { isValid: true, cardToPlay, updatedCards };
};
