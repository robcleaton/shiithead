
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

export const selectFaceUpCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number | number[]
) => {
  if (Array.isArray(cardIndex)) {
    // Handle array of indices by calling selectMultipleFaceUpCards
    return selectMultipleFaceUpCards(dispatch, state, cardIndex);
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    const cardToMove = player.hand[cardIndex];
    
    if (!cardToMove) {
      toast.error('Invalid card selection');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    if (player.faceUpCards.length >= 3) {
      toast.error('You already have 3 face-up cards');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const updatedHand = [...player.hand];
    updatedHand.splice(cardIndex, 1);
    
    const updatedFaceUpCards = [...player.faceUpCards, cardToMove];
    
    const { error } = await supabase
      .from('players')
      .update({
        hand: updatedHand,
        face_up_cards: updatedFaceUpCards,
        is_ready: updatedFaceUpCards.length === 3
      })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (error) throw error;
    
    dispatch({ type: 'SELECT_FACE_UP_CARD', cardIndex });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    
    if (updatedFaceUpCards.length === 3) {
      toast.success('You are ready to start!');
    }
  } catch (error) {
    console.error('Error selecting face-up card:', error);
    toast.error('Failed to select face-up card');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

export const selectMultipleFaceUpCards = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndices: number[]
) => {
  try {
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    const maxAllowed = 3 - player.faceUpCards.length;
    if (maxAllowed <= 0) {
      toast.error("You've already selected 3 cards to place face-up");
      return;
    }
    
    if (cardIndices.length > maxAllowed) {
      toast.error(`You can only select ${maxAllowed} more card${maxAllowed !== 1 ? 's' : ''}`);
      return;
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    
    const updatedHand = [...player.hand];
    const selectedCards = [];
    
    for (const cardIndex of sortedIndices) {
      if (cardIndex >= 0 && cardIndex < updatedHand.length) {
        const cardToMove = updatedHand[cardIndex];
        selectedCards.push(cardToMove);
        updatedHand.splice(cardIndex, 1);
      }
    }
    
    const updatedFaceUpCards = [...player.faceUpCards, ...selectedCards];
    const isReady = updatedFaceUpCards.length === 3;
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ 
        hand: updatedHand,
        face_up_cards: updatedFaceUpCards,
        is_ready: isReady
      })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    dispatch({ type: 'SELECT_MULTIPLE_FACE_UP_CARDS', cardIndices: cardIndices });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    
    if (isReady) {
      toast.success("You've selected all your face-up cards!");
    }
  } catch (error) {
    console.error('Error selecting face-up cards:', error);
    toast.error('Failed to select face-up cards');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
