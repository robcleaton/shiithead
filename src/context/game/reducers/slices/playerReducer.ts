
import { GameState, GameAction } from '@/types/game';

export const playerReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.players };
    
    case 'REMOVE_PLAYER': {
      console.log(`Removing player with ID: ${action.playerId} from state`);
      return {
        ...state,
        players: state.players.filter(player => player.id !== action.playerId)
      };
    }
    
    case 'INVITE_PLAYER':
      return state;  // No state change in reducer
    
    case 'ADD_TEST_PLAYER':
      return state;  // No state change in reducer
      
    default:
      return state;
  }
};
