
import { useReducer, useEffect } from 'react';
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
} from '@/context/game/actions/gamePlay';

import {
  selectFaceUpCard,
  selectMultipleFaceUpCards,
  addTestPlayer,
  invitePlayer
} from '@/context/game/actions/playerActions';

import { useGameSubscriptions } from './useGameSubscriptions';
import { useFetchGameData } from './useFetchGameData';
import { getSavedGameSession, saveGameSession, clearGameSession } from '@/utils/sessionStorage';

const useGameContext = () => {
  // Initialize state with saved session if available
  const savedSession = getSavedGameSession();
  const initialStateWithSession = {
    ...initialState,
    gameId: savedSession.gameId || null,
    playerId: savedSession.playerId || initialState.playerId,
    currentPlayerName: savedSession.playerName || ''
  };

  const [state, dispatch] = useReducer(gameReducer, initialStateWithSession);
  const navigate = useNavigate();
  
  // Set up real-time subscriptions
  const { updateGameStateRef } = useGameSubscriptions(state.gameId, state.playerId, dispatch);
  
  // Fetch initial game data
  useFetchGameData(state.gameId, state.playerId, dispatch);

  // Update the game state ref whenever state changes
  useEffect(() => {
    updateGameStateRef(state);
  }, [state, updateGameStateRef]);

  // Save game session data when it changes
  useEffect(() => {
    if (state.gameId && state.playerId && state.currentPlayerName) {
      saveGameSession(state.gameId, state.playerId, state.currentPlayerName);
    } else if (!state.gameId && !state.gameOver) {
      clearGameSession();
    }
  }, [state.gameId, state.playerId, state.currentPlayerName, state.gameOver]);

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
    resetGame: () => {
      clearGameSession();
      resetGame(dispatch, state);
    },
    addTestPlayer: (playerName: string) => addTestPlayer(dispatch, state, playerName),
    invitePlayer: (email: string) => invitePlayer(dispatch, state, email),
    triggerAITurn: () => handleAIPlayerTurn(dispatch, state)
  };
};

export default useGameContext;
