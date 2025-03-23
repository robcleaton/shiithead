
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { generateId } from '@/utils/gameUtils';
import { NavigateFunction } from 'react-router-dom';

export const createGame = async (
  dispatch: Dispatch<GameAction>,
  playerName: string,
  playerId: string,
  navigate: NavigateFunction
) => {
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    const gameId = generateId();
    
    const { error: gameError } = await supabase
      .from('games')
      .insert([{ 
        id: gameId,
        started: false,
        ended: false,
        setup_phase: false
      }]);
      
    if (gameError) throw gameError;
    
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
      
    if (playerError) throw playerError;
    
    dispatch({ type: 'CREATE_GAME', gameId, playerName });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Game created! Share the game ID: ${gameId}`);
    navigate('/game');
  } catch (error) {
    console.error('Error creating game:', error);
    toast.error('Failed to create game');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
