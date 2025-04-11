import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { jsonToCardValues } from '@/utils/gameUtils';

export const removePlayer = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  playerId: string
) => {
  if (!state.gameId || state.gameStarted || !state.isHost) {
    toast.error("Only the host can remove players before the game starts");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const playerToRemove = state.players.find(p => p.id === playerId);
    if (!playerToRemove) {
      toast.error("Player not found");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Optimistic UI update - remove player from local state immediately
    dispatch({ type: 'REMOVE_PLAYER', playerId: playerId });
    
    console.log(`Removing player ${playerToRemove.name} (${playerId}) from game ${state.gameId}`);
    
    // Delete the player from the database with accurate constraints
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)
      .eq('game_id', state.gameId);
      
    if (error) {
      console.error('Error removing player from database:', error);
      toast.error('Failed to remove player');
      
      // Revert the optimistic update by refetching all players
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', state.gameId);
        
      if (playersData) {
        // Re-dispatch current players from database to ensure UI is in sync
        dispatch({ type: 'SET_PLAYERS', players: playersData.map(p => ({
          id: p.id,
          name: p.name,
          isHost: p.is_host,
          hand: jsonToCardValues(p.hand),
          faceDownCards: jsonToCardValues(p.face_down_cards),
          faceUpCards: jsonToCardValues(p.face_up_cards),
          isActive: p.is_active,
          isReady: p.is_ready,
          gameId: p.game_id
        }))});
      }
      
      throw error;
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: false });
    
    // Keep confirmation toast since it's an action the user explicitly took
    toast.success(`Removed ${playerToRemove.name} from the game`);
    
  } catch (error) {
    console.error('Error removing player:', error);
    toast.error('Failed to remove player');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
