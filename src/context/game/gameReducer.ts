
import { GameState, GameAction, Player } from '@/types/game';
import { generateId } from '@/utils/gameUtils';

export const initialState: GameState = {
  players: [],
  deck: [],
  pile: [],
  currentPlayerId: null,
  gameStarted: false,
  gameOver: false,
  gameId: null,
  playerId: generateId(),
  currentPlayerName: '',
  isHost: false,
  isLoading: false,
  setupPhase: false
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    
    case 'SET_GAME_STATE':
      return { ...state, ...action.gameState };
    
    case 'SET_PLAYERS':
      return { ...state, players: action.players };
    
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
    
    case 'INVITE_PLAYER':
      return state;
    
    case 'ADD_TEST_PLAYER':
      return state;
      
    default:
      return state;
  }
};
