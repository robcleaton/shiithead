
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';
import { GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const usePlayerUpdates = (dispatch: Dispatch<GameAction>) => {
  const handlePlayerUpdate = useCallback(async (payload: any, gameId: string) => {
    if (!gameId) return;
    
    console.log('Player update received for game:', gameId, 'Type:', payload.eventType);
    
    try {
      // If this is a DELETE event, we need to handle player removal immediately
      if (payload.eventType === 'DELETE' && payload.old) {
        const removedPlayerId = payload.old.id;
        console.log('Player removed from database:', removedPlayerId);
        
        // If the removed player is the current player, handle removal gracefully
        const currentPlayerId = localStorage.getItem('playerId');
        if (removedPlayerId === currentPlayerId) {
          console.log('Current player was removed from the game');
          
          // Clear game state first
          dispatch({ type: 'RESET_GAME' });
          
          // Show toast message
          toast.error('You have been removed from the game by the host');
          
          // Use react-router navigation instead of forced page refresh
          dispatch({ type: 'SET_LOADING', isLoading: false });
          
          // We'll handle navigation in the component through game state changes
          return;
        }
        
        // If it's another player being removed, update our local state
        dispatch({ type: 'REMOVE_PLAYER', playerId: removedPlayerId });
        return;
      }
      
      // For other events (INSERT, UPDATE), verify if current player still exists in the game
      // by checking the database directly
      const currentPlayerId = localStorage.getItem('playerId');
      
      if (currentPlayerId) {
        // Directly check if current player still exists in this game
        const { data: currentPlayerExists, error: playerCheckError } = await supabase
          .from('players')
          .select('id')
          .eq('id', currentPlayerId)
          .eq('game_id', gameId)
          .maybeSingle();
        
        if (playerCheckError) {
          console.error('Error checking if player exists:', playerCheckError);
        } else if (!currentPlayerExists) {
          // Player doesn't exist in this game anymore, they must have been removed
          console.log('Player no longer exists in game');
          dispatch({ type: 'RESET_GAME' });
          toast.error('You have been removed from the game by the host');
          // We'll handle navigation in the component through game state changes
          return;
        }
      }
      
      // Proceed with normal update - fetch all players to update the state
      const { data: playersData, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId);
        
      if (error) {
        console.error('Error fetching players data after update:', error);
        toast.error('Failed to sync player data. Please refresh.');
        return;
      }
        
      if (playersData && playersData.length > 0) {
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
    } catch (error) {
      console.error('Error processing players update:', error);
      toast.error('Error updating player data');
    }
  }, [dispatch]);

  return { handlePlayerUpdate };
};
