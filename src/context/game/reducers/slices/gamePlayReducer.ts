
import { GameState, GameAction } from '@/types/game';

export const gamePlayReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'PLAY_CARD':
      return state;
    
    case 'DRAW_CARD':
      return state;
    
    case 'NEXT_TURN': {
      const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
      if (currentPlayerIndex === -1) return state;
      
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
      
      return {
        ...state,
        currentPlayerId: state.players[nextPlayerIndex].id
      };
    }
      
    default:
      return state;
  }
};
