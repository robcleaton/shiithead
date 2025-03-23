
import { useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { gameReducer, initialState } from '@/context/game/gameReducer';
import { jsonToCardValues } from '@/utils/gameUtils';
import { 
  createGame,
  joinGame,
  startGame,
  completeSetup,
  resetGame
} from '@/context/game/actions/setup';

import {
  playCard,
  drawCard
} from '@/context/game/actions/gamePlayActions';

import {
  selectFaceUpCard,
  selectMultipleFaceUpCards,
  addTestPlayer,
  invitePlayer
} from '@/context/game/actions/playerActions';

const useGameContext = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!state.gameId) return;
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const gameChannel = supabase
      .channel('game_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${state.gameId}`
      }, async (payload) => {
        console.log('Game update:', payload);
        
        if (payload.eventType === 'UPDATE') {
          const { data: gameData } = await supabase
            .from('games')
            .select('*')
            .eq('id', state.gameId)
            .single();
            
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
        }
      })
      .subscribe();
      
    const playersChannel = supabase
      .channel('player_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${state.gameId}`
      }, async (payload) => {
        console.log('Players update:', payload);
        
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
      })
      .subscribe();
    
    const fetchGameData = async () => {
      try {
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', state.gameId)
          .single();
          
        if (gameError) throw gameError;
        
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', state.gameId);
          
        if (playersError) throw playersError;
        
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
          
          const currentPlayer = playersData.find(p => p.id === state.playerId);
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
        console.error('Error fetching game data:', error);
        toast.error('Error loading game data');
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    };
    
    fetchGameData();
    
    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(playersChannel);
    };
  }, [state.gameId]);

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
    resetGame: () => resetGame(dispatch, state),
    addTestPlayer: (playerName: string) => addTestPlayer(dispatch, state, playerName),
    invitePlayer: (email: string) => invitePlayer(dispatch, state, email)
  };
};

export default useGameContext;
