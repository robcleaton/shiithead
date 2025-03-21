import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { Json } from '@/integrations/supabase/types';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardValue = { suit: Suit; rank: Rank };

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

type GameAction =
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

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDeck = (): CardValue[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'];
  const deck: CardValue[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

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
  isHost: false,
  isLoading: false,
  setupPhase: false
};

const GameContext = createContext<ReturnType<typeof useGameContext> | undefined>(undefined);

const gameReducer = (state: GameState, action: GameAction): GameState => {
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

const jsonToCardValues = (json: Json | null): CardValue[] => {
  if (!json) return [];
  
  try {
    if (Array.isArray(json)) {
      return json.map(card => {
        if (typeof card === 'object' && card !== null && 'suit' in card && 'rank' in card) {
          return {
            suit: card.suit as Suit,
            rank: card.rank as Rank
          };
        }
        throw new Error('Invalid card format');
      });
    }
    return [];
  } catch (error) {
    console.error('Error converting JSON to CardValue[]:', error);
    return [];
  }
};

const useGameContext = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!state.gameId) return;
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const gameChannel = supabase
      .channel('game_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${state.gameId}`
      }, async (payload) => {
        console.log('Game update:', payload);
        
        if (payload.eventType === 'UPDATE') {
          const { data: gameData } = await supabase
            .from('games')
            .select('*')
            .eq('id', state.gameId)
            .single();
            
          if (gameData) {
            dispatch({ 
              type: 'SET_GAME_STATE', 
              gameState: {
                gameStarted: gameData.started,
                gameOver: gameData.ended,
                currentPlayerId: gameData.current_player_id,
                deck: jsonToCardValues(gameData.deck),
                pile: jsonToCardValues(gameData.pile),
                setupPhase: gameData.setup_phase
              }
            });
          }
        }
      })
      .subscribe();
      
    const playersChannel = supabase
      .channel('player_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${state.gameId}`
      }, async (payload) => {
        console.log('Players update:', payload);
        
        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', state.gameId);
          
        if (playersData) {
          const mappedPlayers = playersData.map(p => ({
            id: p.id,
            name: p.name,
            isHost: p.is_host,
            hand: jsonToCardValues(p.hand),
            faceDownCards: jsonToCardValues(p.face_down_cards),
            faceUpCards: jsonToCardValues(p.face_up_cards),
            isActive: p.is_active,
            isReady: p.is_ready,
            gameId: p.game_id
          }));
          
          dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
        }
      })
      .subscribe();
    
    const fetchGameData = async () => {
      try {
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', state.gameId)
          .single();
          
        if (gameError) throw gameError;
        
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', state.gameId);
          
        if (playersError) throw playersError;
        
        if (gameData) {
          dispatch({ 
            type: 'SET_GAME_STATE', 
            gameState: {
              gameStarted: gameData.started,
              gameOver: gameData.ended,
              currentPlayerId: gameData.current_player_id,
              deck: jsonToCardValues(gameData.deck),
              pile: jsonToCardValues(gameData.pile),
              setupPhase: gameData.setup_phase
            }
          });
        }
        
        if (playersData) {
          const mappedPlayers = playersData.map(p => ({
            id: p.id,
            name: p.name,
            isHost: p.is_host,
            hand: jsonToCardValues(p.hand),
            faceDownCards: jsonToCardValues(p.face_down_cards),
            faceUpCards: jsonToCardValues(p.face_up_cards),
            isActive: p.is_active,
            isReady: p.is_ready,
            gameId: p.game_id
          }));
          
          const currentPlayer = playersData.find(p => p.id === state.playerId);
          if (currentPlayer) {
            dispatch({ 
              type: 'SET_GAME_STATE', 
              gameState: {
                isHost: currentPlayer.is_host,
                currentPlayerName: currentPlayer.name
              }
            });
          }
          
          dispatch({ type: 'SET_PLAYERS', players: mappedPlayers });
        }
        
        dispatch({ type: 'SET_LOADING', isLoading: false });
      } catch (error) {
        console.error('Error fetching game data:', error);
        toast.error('Error loading game data');
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    };
    
    fetchGameData();
    
    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(playersChannel);
    };
  }, [state.gameId]);

  const startGame = async () => {
    if (state.players.length < 2) {
      toast.error("You need at least 2 players to start the game");
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      console.log('Starting game with players:', state.players);
      
      const deck = createDeck();
      console.log('Created deck with', deck.length, 'cards');
      
      const hands: Record<string, CardValue[]> = {};
      const faceDownCards: Record<string, CardValue[]> = {};
      const updatedDeck = [...deck];
      
      for (const player of state.players) {
        const faceDown = [];
        for (let i = 0; i < 3; i++) {
          if (updatedDeck.length > 0) {
            faceDown.push(updatedDeck.pop()!);
          }
        }
        faceDownCards[player.id] = faceDown;
        
        const hand = [];
        for (let i = 0; i < 6; i++) {
          if (updatedDeck.length > 0) {
            hand.push(updatedDeck.pop()!);
          }
        }
        hands[player.id] = hand;
        
        console.log(`Dealt ${faceDown.length} face down cards and ${hand.length} hand cards to player ${player.name}`);
      }
      
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          setup_phase: true,
          deck: updatedDeck
        })
        .eq('id', state.gameId);
        
      if (gameError) {
        console.error('Error updating game:', gameError);
        throw gameError;
      }
      
      console.log('Updated game with setup_phase=true and deck');
      
      for (const player of state.players) {
        console.log(`Updating player ${player.name} with cards:`, {
          hand: hands[player.id],
          face_down_cards: faceDownCards[player.id]
        });
        
        const { error: playerError } = await supabase
          .from('players')
          .update({ 
            hand: hands[player.id],
            face_down_cards: faceDownCards[player.id],
            face_up_cards: [],
            is_ready: false
          })
          .eq('id', player.id)
          .eq('game_id', state.gameId);
          
        if (playerError) {
          console.error('Error updating player:', playerError);
          throw playerError;
        }
      }
      
      dispatch({ type: 'SET_GAME_STATE', gameState: { setupPhase: true } });
      dispatch({ type: 'DEAL_CARDS' });
      dispatch({ type: 'SET_LOADING', isLoading: false });
      toast.success('Setup phase started! Select 3 cards to place face-up');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const createGame = async (playerName: string) => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      const gameId = generateId();
      const playerId = state.playerId;
      
      const { error: gameError } = await supabase
        .from('games')
        .insert([{ 
          id: gameId,
          started: false,
          ended: false,
          setup_phase: false
        }]);
        
      if (gameError) throw gameError;
      
      const { error: playerError } = await supabase
        .from('players')
        .insert([{
          id: playerId,
          name: playerName,
          game_id: gameId,
          is_host: true,
          hand: [],
          face_down_cards: [],
          face_up_cards: [],
          is_active: true,
          is_ready: false
        }]);
        
      if (playerError) throw playerError;
      
      dispatch({ type: 'CREATE_GAME', gameId, playerName });
      dispatch({ type: 'SET_LOADING', isLoading: false });
      toast.success(`Game created! Share the game ID: ${gameId}`);
      navigate('/game');
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const joinGame = async (gameId: string, playerName: string) => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (gameError) {
        toast.error('Game not found');
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
      
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('id', state.playerId)
        .eq('game_id', gameId)
        .maybeSingle();
      
      if (existingPlayer) {
        const { error: updateError } = await supabase
          .from('players')
          .update({ name: playerName })
          .eq('id', state.playerId)
          .eq('game_id', gameId);
          
        if (updateError) throw updateError;
      } else {
        const { error: playerError } = await supabase
          .from('players')
          .insert([{
            id: state.playerId,
            name: playerName,
            game_id: gameId,
            is_host: false,
            hand: [],
            face_down_cards: [],
            face_up_cards: [],
            is_active: true,
            is_ready: false
          }]);
          
        if (playerError) throw playerError;
      }
      
      dispatch({ type: 'JOIN_GAME', gameId, playerName });
      dispatch({ type: 'SET_LOADING', isLoading: false });
      toast.success(`Joined game as ${playerName}`);
      navigate('/game');
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error('Failed to join game');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const selectFaceUpCard = async (cardIndex: number) => {
    try {
      const player = state.players.find(p => p.id === state.playerId);
      if (!player) return;
      
      if (player.faceUpCards.length >= 3) {
        toast.error("You've already selected 3 cards to place face-up");
        return;
      }
      
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const cardToMove = player.hand[cardIndex];
      const updatedHand = [...player.hand];
      updatedHand.splice(cardIndex, 1);
      
      const updatedFaceUpCards = [...player.faceUpCards, cardToMove];
      const isReady = updatedFaceUpCards.length === 3;
      
      const { error: playerError } = await supabase
        .from('players')
        .update({ 
          hand: updatedHand,
          face_up_cards: updatedFaceUpCards,
          is_ready: isReady
        })
        .eq('id', player.id)
        .eq('game_id', state.gameId);
        
      if (playerError) throw playerError;
      
      dispatch({ type: 'SELECT_FACE_UP_CARD', cardIndex });
      dispatch({ type: 'SET_LOADING', isLoading: false });
      
      if (isReady) {
        toast.success("You've selected all your face-up cards!");
      }
    } catch (error) {
      console.error('Error selecting face-up card:', error);
      toast.error('Failed to select face-up card');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const selectMultipleFaceUpCards = async (cardIndices: number[]) => {
    try {
      const player = state.players.find(p => p.id === state.playerId);
      if (!player) return;
      
      const maxAllowed = 3 - player.faceUpCards.length;
      if (maxAllowed <= 0) {
        toast.error("You've already selected 3 cards to place face-up");
        return;
      }
      
      if (cardIndices.length > maxAllowed) {
        toast.error(`You can only select ${maxAllowed} more card${maxAllowed !== 1 ? 's' : ''}`);
        return;
      }
      
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const sortedIndices = [...cardIndices].sort((a, b) => b - a);
      
      const updatedHand = [...player.hand];
      const selectedCards: CardValue[] = [];
      
      for (const cardIndex of sortedIndices) {
        if (cardIndex >= 0 && cardIndex < updatedHand.length) {
          const cardToMove = updatedHand[cardIndex];
          selectedCards.push(cardToMove);
          updatedHand.splice(cardIndex, 1);
        }
      }
      
      const updatedFaceUpCards = [...player.faceUpCards, ...selectedCards];
      const isReady = updatedFaceUpCards.length === 3;
      
      const { error: playerError } = await supabase
        .from('players')
        .update({ 
          hand: updatedHand,
          face_up_cards: updatedFaceUpCards,
          is_ready: isReady
        })
        .eq('id', player.id)
        .eq('game_id', state.gameId);
        
      if (playerError) throw playerError;
      
      dispatch({ type: 'SELECT_MULTIPLE_FACE_UP_CARDS', cardIndices: cardIndices });
      dispatch({ type: 'SET_LOADING', isLoading: false });
      
      if (isReady) {
        toast.success("You've selected all your face-up cards!");
      }
    } catch (error) {
      console.error('Error selecting face-up cards:', error);
      toast.error('Failed to select face-up cards');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const completeSetup = async () => {
    const allReady = state.players.every(p => p.isReady);
    
    if (!allReady) {
      toast.error("Not all players have selected their face-up cards");
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const firstPlayerId = state.players[0].id;
      const updatedDeck = [...state.deck];
      
      const emptyPile: CardValue[] = [];
      
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          started: true,
          setup_phase: false,
          current_player_id: firstPlayerId,
          deck: updatedDeck,
          pile: emptyPile
        })
        .eq('id', state.gameId);
        
      if (gameError) throw gameError;
      
      dispatch({ type: 'COMPLETE_SETUP' });
      dispatch({ type: 'SET_LOADING', isLoading: false });
      toast.success('Game started!');
    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to start game');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const playCard = async (cardIndex: number) => {
    if (state.currentPlayerId !== state.playerId) {
      toast.error("It's not your turn!");
      return;
    }
    
    try {
      const player = state.players.find(p => p.id === state.playerId);
      if (!player) return;
      
      const cardToPlay = player.hand[cardIndex];
      
      if (state.pile.length > 0) {
        const topCard = state.pile[state.pile.length - 1];
        if (topCard && cardToPlay.rank !== topCard.rank) {
          toast.error("Invalid move! Card must match the rank of the top card.");
          return;
        }
      }
      
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const updatedHand = [...player.hand];
      updatedHand.splice(cardIndex, 1);
      
      const cardsToDrawCount = Math.max(0, 3 - updatedHand.length);
      const updatedDeck = [...state.deck];
      const drawnCards = [];
      
      for (let i = 0; i < cardsToDrawCount && updatedDeck.length > 0; i++) {
        drawnCards.push(updatedDeck.pop()!);
      }
      
      const finalHand = [...updatedHand, ...drawnCards];
      
      const { error: playerError } = await supabase
        .from('players')
        .update({ hand: finalHand })
        .eq('id', player.id)
        .eq('game_id', state.gameId);
        
      if (playerError) throw playerError;
      
      const updatedPile = [...state.pile, cardToPlay];
      
      const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
      const nextIndex = (currentPlayerIndex + 1) % state.players.length;
      const nextPlayerId = state.players[nextIndex].id;
      
      const gameOver = finalHand.length === 0 && player.faceUpCards.length === 0 && player.faceDownCards.length === 0;
      
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          pile: updatedPile,
          current_player_id: nextPlayerId,
          ended: gameOver,
          deck: updatedDeck
        })
        .eq('id', state.gameId);
        
      if (gameError) throw gameError;
      
      if (gameOver) {
        toast.success(`${player.name} has won the game!`);
      } else if (finalHand.length === 0 && player.faceUpCards.length === 0 && player.faceDownCards.length === 1) {
        toast.info(`${player.name} is down to their last card!`);
      }
      
      if (drawnCards.length > 0 && updatedDeck.length === 0) {
        toast.info('Deck is now empty!');
      } else if (drawnCards.length > 0) {
        toast.info(`Drew ${drawnCards.length} card${drawnCards.length > 1 ? 's' : ''} from the deck`);
      }
      
      dispatch({ type: 'SET_LOADING', isLoading: false });
    } catch (error) {
      console.error('Error playing card:', error);
      toast.error('Failed to play card');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };

  const drawCard = async () => {
    if (state.currentPlayerId !== state.playerId) {
      toast.error("It's not your turn!");
      return;
    }
    
    if (state.deck.length === 0) {
      toast.error("No cards left in the deck!");
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const updatedDeck = [...state.deck];
      const card = updatedDeck.pop()!;
      
      const player = state.players.find(p => p.id === state.playerId);
      if (!player) return;
      
      const updatedHand = [...player.hand, card];
      
      const { error: playerError } = await supabase
        .from('players')
        .update({ hand: updatedHand })
        .eq('id', player.id)
        .eq('game_id', state.gameId);
        
      if (playerError) throw playerError;
      
      const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
      const nextIndex = (playerIndex + 1) % state.players.length;
      const nextPlayerId = state.players[nextIndex].id;
      
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          deck: updatedDeck,
          current_player_id: nextPlayerId
        })
        .eq('id', state.gameId);
        
      if (gameError) throw gameError;
      
      dispatch({ type: 'SET_LOADING', isLoading: false });
    } catch (error) {
      console.error('Error drawing card:', error);
      toast.error('Failed to draw card');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };
  
  const resetGame = async () => {
    try {
      if (!state.gameId) return;
      
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          started: false,
          ended: false,
          setup_phase: false,
          deck: [],
          pile: [],
          current_player_id: null
        })
        .eq('id', state.gameId);
        
      if (gameError) throw gameError;
      
      for (const player of state.players) {
        const { error: playerError } = await supabase
          .from('players')
          .update({ 
            hand: [],
            face_down_cards: [],
            face_up_cards: [],
            is_ready: false
          })
          .eq('id', player.id)
          .eq('game_id', state.gameId);
          
        if (playerError) throw playerError;
      }
      
      dispatch({ type: 'RESET_GAME' });
      dispatch({ type: 'SET_LOADING', isLoading: false });
      toast.success('Game has been reset');
    } catch (error) {
      console.error('Error resetting game:', error);
      toast.error('Failed to reset game');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  };
  
  const addTestPlayer = async (playerName: string) => {
    if (!state.gameId || state.gameStarted) {
      toast.error("Cannot add test players after game has started");
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      
      const existingNames = state.players.map(p => p.name);
      if (existingNames.includes(playerName)) {
        toast.error("A player with this name already exists");
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
      
      const testPlayerId = generateId();
      
      const { error: playerError } = await supabase
        .from('players')
        .insert([{
          id: testPlayerId,
          name: playerName,
          game_id: state.gameId,
          is_host: false,
          hand: [],
          face_down_cards: [],
          face_up
