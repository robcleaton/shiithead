
import { GameState, GameAction, CardValue } from '@/types/game';

export const gameSetupReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'CREATE_GAME':
      return {
        ...state,
        gameId: action.gameId,
        currentPlayerName: action.playerName,
        isHost: true,
        players: [
          {
            id: state.playerId,
            name: action.playerName,
            isHost: true,
            hand: [],
            faceDownCards: [],
            faceUpCards: [],
            isActive: true,
            isReady: false,
            gameId: action.gameId
          }
        ]
      };
    
    case 'JOIN_GAME':
      return {
        ...state,
        gameId: action.gameId,
        currentPlayerName: action.playerName
      };
    
    case 'START_GAME':
      return {
        ...state,
        gameStarted: true,
        setupPhase: true
      };
    
    case 'DEAL_CARDS':
      return state;
    
    case 'SELECT_FACE_UP_CARD': {
      const playerIndex = state.players.findIndex(p => p.id === state.playerId);
      if (playerIndex === -1) return state;
      
      const player = state.players[playerIndex];
      
      if (Array.isArray(action.cardIndex)) {
        return state;
      }
      
      const cardToMove = player.hand[action.cardIndex];
      
      const updatedPlayers = [...state.players];
      const updatedHand = [...player.hand];
      updatedHand.splice(action.cardIndex, 1);
      
      const updatedPlayer = {
        ...player,
        hand: updatedHand,
        faceUpCards: [...player.faceUpCards, cardToMove]
      };
      
      updatedPlayers[playerIndex] = updatedPlayer;
      
      return {
        ...state,
        players: updatedPlayers
      };
    }
    
    case 'SELECT_MULTIPLE_FACE_UP_CARDS': {
      const playerIndex = state.players.findIndex(p => p.id === state.playerId);
      if (playerIndex === -1) return state;
      
      const player = state.players[playerIndex];
      
      const sortedIndices = [...action.cardIndices].sort((a, b) => b - a);
      
      const updatedHand = [...player.hand];
      const selectedCards: CardValue[] = [];
      
      for (const cardIndex of sortedIndices) {
        if (cardIndex >= 0 && cardIndex < updatedHand.length) {
          const cardToMove = updatedHand[cardIndex];
          selectedCards.push(cardToMove);
          updatedHand.splice(cardIndex, 1);
        }
      }
      
      const updatedPlayer = {
        ...player,
        hand: updatedHand,
        faceUpCards: [...player.faceUpCards, ...selectedCards]
      };
      
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = updatedPlayer;
      
      return {
        ...state,
        players: updatedPlayers
      };
    }
    
    case 'COMPLETE_SETUP':
      return {
        ...state,
        gameStarted: true,
        setupPhase: false
      };
      
    default:
      return state;
  }
};
