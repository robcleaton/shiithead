
import { GameState, GameAction } from '@/types/game';
import { initialState } from './initialState';
import { gameStateReducer } from './slices/gameStateReducer';
import { playerReducer } from './slices/playerReducer';
import { gameSetupReducer } from './slices/gameSetupReducer';
import { gamePlayReducer } from './slices/gamePlayReducer';

export { initialState } from './initialState';

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  // Check if this is a reset action, handle it immediately
  if (action.type === 'RESET_GAME') {
    console.log('Resetting game state');
    return { ...initialState, playerId: state.playerId };
  }
  
  // Handle game state actions
  if (
    action.type === 'SET_LOADING' ||
    action.type === 'SET_GAME_STATE' ||
    action.type === 'END_GAME'
  ) {
    return gameStateReducer(state, action);
  }
  
  // Handle player-related actions
  if (
    action.type === 'SET_PLAYERS' ||
    action.type === 'REMOVE_PLAYER' ||
    action.type === 'INVITE_PLAYER' ||
    action.type === 'ADD_TEST_PLAYER'
  ) {
    return playerReducer(state, action);
  }
  
  // Handle game setup actions
  if (
    action.type === 'CREATE_GAME' ||
    action.type === 'JOIN_GAME' ||
    action.type === 'START_GAME' || 
    action.type === 'DEAL_CARDS' ||
    action.type === 'SELECT_FACE_UP_CARD' ||
    action.type === 'SELECT_MULTIPLE_FACE_UP_CARDS' ||
    action.type === 'COMPLETE_SETUP'
  ) {
    return gameSetupReducer(state, action);
  }
  
  // Handle gameplay actions
  if (
    action.type === 'PLAY_CARD' ||
    action.type === 'DRAW_CARD' ||
    action.type === 'NEXT_TURN'
  ) {
    return gamePlayReducer(state, action);
  }
  
  // Default case
  return state;
};
