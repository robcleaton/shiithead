
import { GameState, GameAction } from '@/types/game';

export const gameStateReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    
    case 'SET_GAME_STATE':
      console.log('SET_GAME_STATE action:', action.gameState);
      if (action.gameState.deck) {
        console.log(`Setting deck: ${action.gameState.deck.length} cards`);
      }
      return { ...state, ...action.gameState };
    
    case 'END_GAME':
      return {
        ...state,
        gameOver: true
      };
    
    case 'RESET_GAME':
      return {
        ...state,
        deck: [],
        pile: [],
        gameStarted: false,
        gameOver: false,
        setupPhase: false,
        currentPlayerId: null,
        players: state.players.map(player => ({
          ...player,
          hand: [],
          faceDownCards: [],
          faceUpCards: [],
          isReady: false
        }))
      };
    
    default:
      return state;
  }
};
