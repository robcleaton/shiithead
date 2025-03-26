
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

export const drawCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  if (state.currentPlayerId !== state.playerId) {
    toast.error("It's not your turn!");
    return;
  }

  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    // Check if the pile only contains 3s
    if (state.pile.length > 0 && state.pile.every(card => card.rank === '3')) {
      const hasThree = player.hand.some(card => card.rank === '3');
      
      if (!hasThree) {
        // Player doesn't have any 3s, so skip their turn and reset the pile
        const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const nextIndex = (playerIndex + 1) % state.players.length;
        const nextPlayerId = state.players[nextIndex].id;
        
        const { error: gameError } = await supabase
          .from('games')
          .update({ 
            pile: [],
            current_player_id: nextPlayerId
          })
          .eq('id', state.gameId);
          
        if (gameError) throw gameError;
        
        toast.info(`${player.name} couldn't play a 3, so the pile has been reset and their turn is skipped.`);
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    }
    
    if (state.deck.length === 0) {
      toast.error("No cards left in the deck!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const updatedDeck = [...state.deck];
    const drawnCard = updatedDeck.pop();
    
    if (!drawnCard) {
      toast.error("Failed to draw a card!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const updatedHand = [...player.hand, drawnCard];
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    const nextIndex = (playerIndex + 1) % state.players.length;
    const nextPlayerId = state.players[nextIndex].id;
    
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        deck: updatedDeck,
        current_player_id: nextPlayerId
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    toast.success(`Drew a ${drawnCard.rank} of ${drawnCard.suit}.`);
    
    if (updatedDeck.length === 0) {
      toast.info('That was the last card in the deck!');
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error drawing card:', error);
    toast.error('Failed to draw card');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
