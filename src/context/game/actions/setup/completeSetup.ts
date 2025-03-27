
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

export const completeSetup = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  const allReady = state.players.every(p => p.isReady);
  
  if (!allReady) {
    toast.error("Not all players have selected their face-up cards");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const firstPlayerId = state.players[0].id;
    const updatedDeck = [...state.deck];
    
    const emptyPile: CardValue[] = [];
    
    // Update local state first for immediate UI response
    dispatch({
      type: 'SET_GAME_STATE',
      gameState: {
        gameStarted: true,
        setupPhase: false,
        currentPlayerId: firstPlayerId,
        deck: updatedDeck,
        pile: emptyPile
      }
    });
    
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        started: true,
        setup_phase: false,
        current_player_id: firstPlayerId,
        deck: updatedDeck,
        pile: emptyPile
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    dispatch({ type: 'COMPLETE_SETUP' });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success('Game started!');
  } catch (error) {
    console.error('Error completing setup:', error);
    toast.error('Failed to start game');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
