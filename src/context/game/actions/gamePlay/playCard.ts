
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { playFaceDownCard } from './playFaceDownCard';
import { playFaceUpCard } from './playFaceUpCard';
import { playHandCards } from './playHandCards';

export const playCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number | number[]
) => {
  if (state.currentPlayerId !== state.playerId) {
    toast.error("It's not your turn!");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    // Handle face down cards (indices < -999, e.g., -1000 and below)
    if (!Array.isArray(cardIndex) && cardIndex <= -1000) {
      // Convert to face down card index
      const faceDownIndex = -(cardIndex + 1000);
      await playFaceDownCard(dispatch, state, faceDownIndex);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Handle face up cards (negative indices)
    if (!Array.isArray(cardIndex) && cardIndex < 0 && cardIndex > -1000) {
      // Convert negative index to face up card index
      const faceUpIndex = -cardIndex - 1;
      await playFaceUpCard(dispatch, state, faceUpIndex);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Handle normal card play from hand
    const cardIndices = Array.isArray(cardIndex) ? cardIndex : [cardIndex];
    await playHandCards(dispatch, state, cardIndices);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error playing card:', error);
    toast.error('Failed to play card');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
