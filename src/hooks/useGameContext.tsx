
import { useReducer, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameReducer, initialState } from '@/context/game/gameReducer';
import { 
  createGame,
  joinGame,
  startGame,
  completeSetup,
  resetGame
} from '@/context/game/actions/setup';

import {
  playCard,
  drawCard,
  pickupPile,
  handleAIPlayerTurn
} from '@/context/game/actions/gamePlayActions';

import {
  selectFaceUpCard,
  selectMultipleFaceUpCards,
  addTestPlayer,
  invitePlayer
} from '@/context/game/actions/playerActions';

import { useGameSubscriptions } from './useGameSubscriptions';
import { useFetchGameData } from './useFetchGameData';
import { GameState } from '@/types/game';
import { toast } from 'sonner';

const useGameContext = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const navigate = useNavigate();
  
  // Set up real-time subscriptions
  const { updateGameStateRef } = useGameSubscriptions(state.gameId, state.playerId, dispatch);
  
  // Fetch initial game data
  useFetchGameData(state.gameId, state.playerId, dispatch);

  // Update the game state ref whenever state changes
  useEffect(() => {
    updateGameStateRef(state);
  }, [state, updateGameStateRef]);

  // Function to refresh the game state without reloading the page
  const refreshGameState = async () => {
    if (!state.gameId) {
      toast.error("No active game to refresh");
      return;
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    try {
      // Re-fetch game data from Supabase
      const fetchGameData = async () => {
        // Import the useFetchPlayers hook rather than trying to destructure fetchPlayers directly
        const { useFetchPlayers } = await import('./useFetchPlayers');
        const { useFetchGameData } = await import('./useFetchGameData');
        
        // Create a temporary instance of the hook to get the fetchPlayers function
        const { fetchPlayers } = useFetchPlayers(dispatch);
        
        // Fetch the latest players data
        await fetchPlayers(state.gameId);
        
        // Create mock hooks to get the fetchGameData function
        const mockDispatch = dispatch;
        
        // Manually call the fetch function from useFetchGameData
        const fetchGameDataFn = () => {
          // Recreate the function from useFetchGameData but call it immediately
          const fetchData = async () => {
            try {
              const { supabase } = await import('@/integrations/supabase/client');
              const { jsonToCardValues } = await import('@/utils/gameUtils');
              
              const { data: gameData, error: gameError } = await supabase
                .from('games')
                .select('*')
                .eq('id', state.gameId)
                .maybeSingle();
                
              if (gameError) {
                console.error('Error refreshing game data:', gameError);
                toast.error('Error refreshing game data');
                dispatch({ type: 'SET_LOADING', isLoading: false });
                return;
              }
              
              const { data: playersData, error: playersError } = await supabase
                .from('players')
                .select('*')
                .eq('game_id', state.gameId);
                
              if (playersError) {
                console.error('Error refreshing players data:', playersError);
                toast.error('Error refreshing players data');
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
                
                console.log('Game state refreshed successfully');
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
                
                dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
                console.log('Players refreshed successfully:', mappedPlayers.length);
              }
              
              toast.success('Game refreshed successfully');
            } catch (error) {
              console.error('Error in refreshGameState:', error);
              toast.error('Failed to refresh game');
            } finally {
              dispatch({ type: 'SET_LOADING', isLoading: false });
            }
          };
          
          // Call the function
          fetchData();
        };
        
        // Execute the fetch
        fetchGameDataFn();
      };
      
      await fetchGameData();
    } catch (error) {
      console.error('Error refreshing game state:', error);
      toast.error('Failed to refresh the game. Please try again.');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  return {
    state,
    createGame: (playerName: string) => createGame(dispatch, playerName, state.playerId, navigate),
    joinGame: (gameId: string, playerName: string) => joinGame(dispatch, gameId, playerName, state.playerId, navigate),
    startGame: () => startGame(dispatch, state),
    selectFaceUpCard: (cardIndex: number | number[]) => selectFaceUpCard(dispatch, state, cardIndex),
    selectMultipleFaceUpCards: (cardIndices: number[]) => selectMultipleFaceUpCards(dispatch, state, cardIndices),
    completeSetup: () => completeSetup(dispatch, state),
    playCard: (cardIndex: number | number[]) => playCard(dispatch, state, cardIndex),
    drawCard: () => drawCard(dispatch, state),
    pickupPile: () => pickupPile(dispatch, state),
    resetGame: () => resetGame(dispatch, state),
    addTestPlayer: (playerName: string) => addTestPlayer(dispatch, state, playerName),
    invitePlayer: (email: string) => invitePlayer(dispatch, state, email),
    triggerAITurn: () => handleAIPlayerTurn(dispatch, state),
    refreshGameState: refreshGameState
  };
};

export default useGameContext;
