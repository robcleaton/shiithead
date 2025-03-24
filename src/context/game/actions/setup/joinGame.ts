
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { NavigateFunction } from 'react-router-dom';

export const joinGame = async (
  dispatch: Dispatch<GameAction>,
  gameId: string,
  playerName: string,
  playerId: string,
  navigate: NavigateFunction
) => {
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();
      
    if (gameError || !gameData) {
      toast.error('Game not found');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('game_id', gameId)
      .maybeSingle();
    
    if (existingPlayer) {
      const { error: updateError } = await supabase
        .from('players')
        .update({ name: playerName })
        .eq('id', playerId)
        .eq('game_id', gameId);
        
      if (updateError) throw updateError;
    } else {
      const { error: playerError } = await supabase
        .from('players')
        .insert([{
          id: playerId,
          name: playerName,
          game_id: gameId,
          is_host: false,
          hand: [],
          face_down_cards: [],
          face_up_cards: [],
          is_active: true,
          is_ready: false
        }]);
        
      if (playerError) throw playerError;
    }
    
    dispatch({ type: 'JOIN_GAME', gameId, playerName });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Joined game as ${playerName}`);
    
    // Navigate directly after state is updated
    navigate('/game');
  } catch (error) {
    console.error('Error joining game:', error);
    toast.error('Failed to join game');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
