
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { jsonToCardValues } from '@/utils/gameUtils';
import { GameAction } from '@/types/game';
import { Dispatch } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Define the payload type to match useSupabaseChannel
interface RealtimePayload {
  type?: string;
  event?: string;
  eventType?: string;
  new?: Record<string, any>;
  old?: Record<string, any>;
  record?: Record<string, any>;
  schema?: string;
  table?: string;
  isDeleteEvent?: boolean;
  [key: string]: any;
}

export const usePlayerUpdates = (dispatch: Dispatch<GameAction>) => {
  const navigate = useNavigate();

  const handlePlayerUpdate = useCallback(async (payload: RealtimePayload, gameId: string) => {
    if (!gameId) return;
    
    console.log('Player update received for game:', gameId, 'Payload:', payload);
    
    try {
      // Enhanced detection of DELETE events
      const isDeleteEvent = 
        (payload.event === 'DELETE') || 
        (payload.eventType === 'DELETE') || 
        (payload.isDeleteEvent === true);
      
      // Get the player data from the record
      let playerRecord = null;
      if (payload.old) {
        playerRecord = payload.old;
      } else if (payload.record) {
        playerRecord = payload.record;
      }
      
      console.log('DELETE detection:', isDeleteEvent, 'Player record:', playerRecord);
      
      if (isDeleteEvent && playerRecord) {
        const removedPlayerId = playerRecord.id;
        console.log('Player removed from database:', removedPlayerId);
        
        // If the removed player is the current player, handle removal gracefully
        const currentPlayerId = localStorage.getItem('playerId');
        if (removedPlayerId === currentPlayerId) {
          console.log('Current player was removed from the game');
          
          // Clear game state first
          dispatch({ type: 'RESET_GAME' });
          
          // Show toast message
          toast.error('You have been removed from the game by the host');
          
          // Navigate to home page
          navigate('/');
          
          // Return early to prevent unnecessary player data fetch
          return;
        }
        
        // For all other clients, update their player list to remove the player from UI
        console.log(`Dispatching REMOVE_PLAYER action for player ID: ${removedPlayerId}`);
        dispatch({ type: 'REMOVE_PLAYER', playerId: removedPlayerId });
      }
      
      // For non-DELETE events or if the DELETE event didn't have sufficient info
      // Fetch the complete player list to ensure all clients are in sync
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
        
        console.log('Updated player list:', mappedPlayers);
        dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
      } else {
        // If no players returned, check if current player is still in the game
        const currentPlayerId = localStorage.getItem('playerId');
        if (currentPlayerId) {
          const { data: currentPlayerCheck } = await supabase
            .from('players')
            .select('id')
            .eq('id', currentPlayerId)
            .eq('game_id', gameId)
            .maybeSingle();
            
          if (!currentPlayerCheck) {
            console.log('Player not found in game - redirecting to home');
            dispatch({ type: 'RESET_GAME' });
            toast.error('You are no longer part of this game');
            navigate('/');
          }
        }
      }
    } catch (error) {
      console.error('Error processing players update:', error);
      toast.error('Error updating player data');
    }
  }, [dispatch, navigate]);

  return { handlePlayerUpdate };
};
