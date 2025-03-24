
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Dispatch } from 'react';
import { GameAction, GameState } from '@/types/game';
import { jsonToCardValues } from '@/utils/gameUtils';

export const useFetchGameData = (
  gameId: string | null,
  playerId: string,
  dispatch: Dispatch<GameAction>
) => {
  useEffect(() => {
    if (!gameId) return;
    
    const fetchGameData = async () => {
      try {
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .maybeSingle();
          
        if (gameError) {
          console.error('Error fetching initial game data:', gameError);
          toast.error('Error loading game data');
          dispatch({ type: 'SET_LOADING', isLoading: false });
          return;
        }
        
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId);
          
        if (playersError) {
          console.error('Error fetching initial players data:', playersError);
          toast.error('Error loading players data');
          dispatch({ type: 'SET_LOADING', isLoading: false });
          return;
        }
        
        if (gameData) {
          dispatch({ 
            type: 'SET_GAME_STATE', 
            gameState: {
              gameStarted: gameData.started,
              gameOver: gameData.ended,
              currentPlayerId: gameData.current_player_id,
              deck: jsonToCardValues(gameData.deck),
              pile: jsonToCardValues(gameData.pile),
              setupPhase: gameData.setup_phase
            }
          });
        }
        
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
          
          const currentPlayer = playersData.find(p => p.id === playerId);
          if (currentPlayer) {
            dispatch({ 
              type: 'SET_GAME_STATE', 
              gameState: {
                isHost: currentPlayer.is_host,
                currentPlayerName: currentPlayer.name
              }
            });
          }
          
          dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
        }
        
        dispatch({ type: 'SET_LOADING', isLoading: false });
      } catch (error) {
        console.error('Error in fetchGameData:', error);
        toast.error('Error loading game data');
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    };
    
    fetchGameData();
  }, [gameId, dispatch, playerId]);
};
