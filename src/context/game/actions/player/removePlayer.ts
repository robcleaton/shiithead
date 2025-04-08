
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
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
    
    // Optimistic UI update - remove player from state immediately
    dispatch({ type: 'REMOVE_PLAYER', playerId: playerId });
    
    // Delete the player from the database
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)
      .eq('game_id', state.gameId);
      
    if (error) {
      console.error('Error removing player from database:', error);
      
      // Revert the optimistic update by refetching players
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', state.gameId);
        
      if (playersData) {
        const mappedPlayers = playersData.map(p => ({
          id: p.id,
          name: p.name,
          isHost: p.is_host,
          hand: jsonToCardValues(p.hand),
          faceDownCards: jsonToCardValues(p.face_down_cards),
          faceUpCards: jsonToCardValues(p.face_up_cards),
          isActive: p.is_active,
          isReady: p.is_ready,
          gameId: p.game_id
        }));
        
        dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
      }
      
      throw error;
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Removed ${playerToRemove.name} from the game`);
    
    // The removed player will be redirected by the usePlayerUpdates hook
    // when they receive the DELETE event via the Supabase realtime subscription
    
  } catch (error) {
    console.error('Error removing player:', error);
    toast.error('Failed to remove player');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
