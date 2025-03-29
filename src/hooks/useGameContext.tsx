
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
} from '@/context/game/actions/gamePlay';

import {
  selectFaceUpCard,
  selectMultipleFaceUpCards,
  addTestPlayer,
  invitePlayer
} from '@/context/game/actions/playerActions';

import { useGameSubscriptions } from './useGameSubscriptions';
import { useFetchGameData } from './useFetchGameData';
import { GameState } from '@/types/game';

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
    triggerAITurn: () => handleAIPlayerTurn(dispatch, state)
  };
};

export default useGameContext;
