
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { NavigateFunction } from 'react-router-dom';
import { generateId } from '@/utils/gameUtils';

export const createGame = async (
  dispatch: Dispatch<GameAction>,
  playerName: string,
  playerId: string,
  navigate: NavigateFunction
) => {
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });

    const gameId = generateId();
    console.log(`Generated game ID: ${gameId}`);

    // Create game in Supabase
    const { error: gameError } = await supabase
      .from('games')
      .insert([{
        id: gameId,
        deck: [],
        pile: [],
        started: false,
        ended: false,
        setup_phase: false,
        current_player_id: null
      }]);

    if (gameError) {
      console.error('Error creating game:', gameError);
      toast.error('Error creating game');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }

    // Create player in Supabase
    const { error: playerError } = await supabase
      .from('players')
      .insert([{
        id: playerId,
        name: playerName,
        game_id: gameId,
        is_host: true,
        hand: [],
        face_down_cards: [],
        face_up_cards: [],
        is_active: true,
        is_ready: false
      }]);

    if (playerError) {
      console.error('Error creating player:', playerError);
      toast.error('Error creating player');

      // Clean up the game if player creation fails
      await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }

    // Store game ID in localStorage for session persistence
    localStorage.setItem('gameId', gameId);
    localStorage.setItem('playerName', playerName);

    // Update state
    dispatch({ type: 'CREATE_GAME', gameId, playerName });
    dispatch({ type: 'SET_LOADING', isLoading: false });

    toast.success('Game created successfully');
    navigate('/game');
  } catch (error) {
    console.error('Error in createGame:', error);
    toast.error('Failed to create game');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
