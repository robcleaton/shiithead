
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardValue = { suit: Suit; rank: Rank };

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  hand: CardValue[];
  isActive: boolean;
}

export interface GameState {
  players: Player[];
  deck: CardValue[];
  pile: CardValue[];
  currentPlayerId: string | null;
  gameStarted: boolean;
  gameOver: boolean;
  gameId: string | null;
  playerId: string;
  currentPlayerName: string;
  isHost: boolean;
}

type GameAction =
  | { type: 'CREATE_GAME'; gameId: string; playerName: string }
  | { type: 'JOIN_GAME'; gameId: string; playerName: string }
  | { type: 'START_GAME' }
  | { type: 'DEAL_CARDS' }
  | { type: 'PLAY_CARD'; cardIndex: number }
  | { type: 'DRAW_CARD' }
  | { type: 'NEXT_TURN' }
  | { type: 'END_GAME'; winnerId: string }
  | { type: 'RESET_GAME' }
  | { type: 'INVITE_PLAYER'; email: string };

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create a shuffled deck
const createDeck = (): CardValue[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: CardValue[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  // Shuffle deck using Fisher-Yates algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

const initialState: GameState = {
  players: [],
  deck: [],
  pile: [],
  currentPlayerId: null,
  gameStarted: false,
  gameOver: false,
  gameId: null,
  playerId: generateId(),
  currentPlayerName: '',
  isHost: false
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'CREATE_GAME': {
      const playerId = state.playerId;
      return {
        ...state,
        gameId: action.gameId,
        players: [{ id: playerId, name: action.playerName, isHost: true, hand: [], isActive: true }],
        currentPlayerName: action.playerName,
        isHost: true
      };
    }
    case 'JOIN_GAME': {
      const playerId = state.playerId;
      return {
        ...state,
        gameId: action.gameId,
        players: [...state.players, { id: playerId, name: action.playerName, isHost: false, hand: [], isActive: true }],
        currentPlayerName: action.playerName
      };
    }
    case 'START_GAME': {
      const deck = createDeck();
      const firstPlayerId = state.players[0].id;
      return {
        ...state,
        deck,
        gameStarted: true,
        currentPlayerId: firstPlayerId
      };
    }
    case 'DEAL_CARDS': {
      const { deck, players } = state;
      const updatedDeck = [...deck];
      const updatedPlayers = players.map(player => {
        const hand = [];
        for (let i = 0; i < 7; i++) {
          if (updatedDeck.length > 0) {
            hand.push(updatedDeck.pop()!);
          }
        }
        return { ...player, hand };
      });

      const firstCard = updatedDeck.pop();
      const pile = firstCard ? [firstCard] : [];

      return {
        ...state,
        deck: updatedDeck,
        players: updatedPlayers,
        pile
      };
    }
    case 'PLAY_CARD': {
      const { players, currentPlayerId, pile } = state;
      const playerIndex = players.findIndex(p => p.id === currentPlayerId);
      
      if (playerIndex === -1) return state;
      
      const player = players[playerIndex];
      const cardToPlay = player.hand[action.cardIndex];
      
      // Check if card can be played (same suit or rank as top card)
      const topCard = pile[pile.length - 1];
      if (topCard && cardToPlay.rank !== topCard.rank && cardToPlay.suit !== topCard.suit) {
        toast.error("Invalid move! Card must match suit or rank of the top card.");
        return state;
      }
      
      const updatedHand = [...player.hand];
      updatedHand.splice(action.cardIndex, 1);
      
      const updatedPlayers = [...players];
      updatedPlayers[playerIndex] = { ...player, hand: updatedHand };
      
      return {
        ...state,
        players: updatedPlayers,
        pile: [...pile, cardToPlay]
      };
    }
    case 'DRAW_CARD': {
      const { deck, players, currentPlayerId } = state;
      if (deck.length === 0) return state;
      
      const updatedDeck = [...deck];
      const card = updatedDeck.pop()!;
      
      const playerIndex = players.findIndex(p => p.id === currentPlayerId);
      if (playerIndex === -1) return state;
      
      const player = players[playerIndex];
      const updatedPlayers = [...players];
      updatedPlayers[playerIndex] = { 
        ...player, 
        hand: [...player.hand, card] 
      };
      
      return {
        ...state,
        players: updatedPlayers,
        deck: updatedDeck
      };
    }
    case 'NEXT_TURN': {
      const { players, currentPlayerId } = state;
      const currentIndex = players.findIndex(p => p.id === currentPlayerId);
      const nextIndex = (currentIndex + 1) % players.length;
      
      return {
        ...state,
        currentPlayerId: players[nextIndex].id
      };
    }
    case 'END_GAME': {
      return {
        ...state,
        gameOver: true
      };
    }
    case 'RESET_GAME': {
      return {
        ...initialState,
        playerId: state.playerId
      };
    }
    case 'INVITE_PLAYER': {
      // In a real app, this would trigger sending an email
      // For now, we'll just simulate it
      return state;
    }
    default:
      return state;
  }
};

interface GameContextType {
  state: GameState;
  createGame: (playerName: string) => void;
  joinGame: (gameId: string, playerName: string) => void;
  startGame: () => void;
  playCard: (cardIndex: number) => void;
  drawCard: () => void;
  nextTurn: () => void;
  resetGame: () => void;
  invitePlayer: (email: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const createGame = (playerName: string) => {
    const gameId = generateId();
    dispatch({ type: 'CREATE_GAME', gameId, playerName });
    toast.success(`Game created! Share the game ID: ${gameId}`);
  };

  const joinGame = (gameId: string, playerName: string) => {
    dispatch({ type: 'JOIN_GAME', gameId, playerName });
    toast.success(`Joined game as ${playerName}`);
  };

  const startGame = () => {
    dispatch({ type: 'START_GAME' });
    dispatch({ type: 'DEAL_CARDS' });
    toast.success('Game started!');
  };

  const playCard = (cardIndex: number) => {
    if (state.currentPlayerId !== state.playerId) {
      toast.error("It's not your turn!");
      return;
    }
    
    dispatch({ type: 'PLAY_CARD', cardIndex });
    
    // Check for win condition
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (currentPlayer && currentPlayer.hand.length === 1) {
      toast.success(`${currentPlayer.name} has only one card left!`);
    } else if (currentPlayer && currentPlayer.hand.length === 0) {
      dispatch({ type: 'END_GAME', winnerId: currentPlayer.id });
      toast.success(`${currentPlayer.name} has won the game!`);
      return;
    }
    
    dispatch({ type: 'NEXT_TURN' });
  };

  const drawCard = () => {
    if (state.currentPlayerId !== state.playerId) {
      toast.error("It's not your turn!");
      return;
    }
    
    if (state.deck.length === 0) {
      toast.error("No cards left in the deck!");
      return;
    }
    
    dispatch({ type: 'DRAW_CARD' });
    dispatch({ type: 'NEXT_TURN' });
  };

  const nextTurn = () => {
    dispatch({ type: 'NEXT_TURN' });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
    toast.info('Game has been reset');
  };

  const invitePlayer = (email: string) => {
    // In a real implementation, this would send an actual email
    // For now, we'll just show a success message
    const inviteLink = `${window.location.origin}/join/${state.gameId}`;
    
    // Simulate email sending
    dispatch({ type: 'INVITE_PLAYER', email });
    
    toast.success(`Invitation sent to ${email}!`);
    console.log(`Invitation link: ${inviteLink} would be sent to ${email}`);
  };

  // For demo purposes, let's add mock players
  useEffect(() => {
    if (state.gameId && state.players.length === 1) {
      joinGame(state.gameId, 'AI Player');
    }
  }, [state.gameId]);

  return (
    <GameContext.Provider
      value={{
        state,
        createGame,
        joinGame,
        startGame,
        playCard,
        drawCard,
        nextTurn,
        resetGame,
        invitePlayer
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
