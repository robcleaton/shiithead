
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  hand: CardValue[];
  faceDownCards: CardValue[];
  faceUpCards: CardValue[];
  isActive: boolean;
  isReady: boolean;
  gameId?: string;
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
  isLoading: boolean;
  setupPhase: boolean;
}

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardValue = { suit: Suit; rank: Rank };

export type GameAction =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_GAME_STATE'; gameState: Partial<GameState> }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'CREATE_GAME'; gameId: string; playerName: string }
  | { type: 'JOIN_GAME'; gameId: string; playerName: string }
  | { type: 'START_GAME' }
  | { type: 'DEAL_CARDS' }
  | { type: 'SELECT_FACE_UP_CARD'; cardIndex: number }
  | { type: 'SELECT_MULTIPLE_FACE_UP_CARDS'; cardIndices: number[] }
  | { type: 'COMPLETE_SETUP' }
  | { type: 'PLAY_CARD'; cardIndex: number }
  | { type: 'DRAW_CARD' }
  | { type: 'NEXT_TURN' }
  | { type: 'END_GAME'; winnerId: string }
  | { type: 'RESET_GAME' }
  | { type: 'INVITE_PLAYER'; email: string }
  | { type: 'ADD_TEST_PLAYER'; playerName: string };
