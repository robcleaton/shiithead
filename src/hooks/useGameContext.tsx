import { useReducer, useRef } from 'react';
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

const useGameContext = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const navigate = useNavigate();
  
  // Keep a ref to the current state for use in async callbacks
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;
  
  // Set up real-time subscriptions
  useGameSubscriptions(state.gameId, state.playerId, dispatch);
  
  // Fetch initial game data
  useFetchGameData(state.gameId, state.playerId, dispatch);

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
    invitePlayer: (email: string) => invitePlayer(dispatch, state, email),
    triggerAITurn: () => handleAIPlayerTurn(dispatch, state)
  };
};

export default useGameContext;
