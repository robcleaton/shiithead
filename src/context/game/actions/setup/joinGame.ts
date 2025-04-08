
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
    
    // First check if the game exists
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();
      
    if (gameError) {
      console.error('Error fetching game:', gameError);
      toast.error('Error fetching game');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    if (!gameData) {
      toast.error('Game not found');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    console.log(`Found game: ${gameId}`);
    
    // Check if player exists in this game
    const { data: existingPlayer, error: playerQueryError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('game_id', gameId)
      .maybeSingle();
    
    if (playerQueryError) {
      console.error('Error checking player:', playerQueryError);
      toast.error('Error checking player status');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    if (existingPlayer) {
      console.log(`Updating existing player: ${playerName} (${playerId})`);
      
      // Update existing player
      const { error: updateError } = await supabase
        .from('players')
        .update({ name: playerName, is_active: true })
        .eq('id', playerId)
        .eq('game_id', gameId);
        
      if (updateError) {
        console.error('Error updating player:', updateError);
        toast.error('Error updating player');
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    } else {
      console.log(`Creating new player: ${playerName} (${playerId})`);
      
      // Create new player
      const { error: insertError } = await supabase
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
        
      if (insertError) {
        console.error('Error creating player:', insertError);
        toast.error('Error creating player');
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    }
    
    // Store game ID in localStorage for session persistence
    localStorage.setItem('gameId', gameId);
    
    // Update state and navigate only after all operations completed successfully
    dispatch({ type: 'JOIN_GAME', gameId, playerName });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Joined game as ${playerName}`);
    
    // Use the navigate function after all state updates
    navigate('/game');
  } catch (error) {
    console.error('Error joining game:', error);
    toast.error('Failed to join game');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
