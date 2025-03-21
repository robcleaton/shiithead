
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, Player, CardValue } from '@/types/game';
import { createDeck, generateId, jsonToCardValues } from '@/utils/gameUtils';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { NavigateFunction } from 'react-router-dom';

export const createGame = async (
  dispatch: Dispatch<GameAction>,
  playerName: string,
  playerId: string,
  navigate: NavigateFunction
) => {
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    const gameId = generateId();
    
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

export const joinGame = async (
  dispatch: Dispatch<GameAction>,
  gameId: string,
  playerName: string,
  playerId: string,
  navigate: NavigateFunction
) => {
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
      .eq('id', playerId)
      .eq('game_id', gameId)
      .maybeSingle();
    
    if (existingPlayer) {
      const { error: updateError } = await supabase
        .from('players')
        .update({ name: playerName })
        .eq('id', playerId)
        .eq('game_id', gameId);
        
      if (updateError) throw updateError;
    } else {
      const { error: playerError } = await supabase
        .from('players')
        .insert([{
          id: playerId,
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

export const startGame = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
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

export const selectFaceUpCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number
) => {
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

export const selectMultipleFaceUpCards = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndices: number[]
) => {
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

export const completeSetup = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
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

export const playCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number
) => {
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
      
      const specialCards = ['2', '3', '7', '8', '10'];
      const cardRank = cardToPlay.rank;
      const rankValues: Record<Rank, number> = {
        'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, 
        '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
      };
      
      if (topCard.rank === '7' && !specialCards.includes(cardRank) && rankValues[cardRank] > 7) {
        toast.error("After a 7 is played, you must play a card of rank 7 or lower!");
        return;
      }
      else if (cardToPlay.rank === '10' && topCard.rank === '7') {
        toast.error("Cannot play a 10 on top of a 7!");
        return;
      }
      else if (!specialCards.includes(cardRank) && cardRank !== topCard.rank) {
        toast.error("Invalid move! Card must match the rank of the top card or be a special card (2, 3, 7, 8, 10).");
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
    
    let updatedPile: CardValue[] = [];
    if (cardToPlay.rank === '10') {
      updatedPile = [cardToPlay];
    } else {
      updatedPile = [...state.pile, cardToPlay];
    }
    
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    
    let nextIndex = currentPlayerIndex;
    
    if (cardToPlay.rank === '2') {
      nextIndex = currentPlayerIndex;
    } else if (cardToPlay.rank === '10') {
      nextIndex = currentPlayerIndex;
    } else {
      nextIndex = (currentPlayerIndex + 1) % state.players.length;
    }
    
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
    
    if (cardToPlay.rank === '2') {
      toast.success(`${player.name} played a 2 - they get another turn!`);
    } else if (cardToPlay.rank === '7') {
      toast.success(`${player.name} played a 7 - the next player must play a card of rank 7 or lower!`);
    } else if (cardToPlay.rank === '10') {
      toast.success(`${player.name} played a 10 - the pile has been burned! ${player.name} gets another turn.`);
    }
    
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

export const drawCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
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

export const resetGame = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
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

export const addTestPlayer = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  playerName: string
) => {
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
        face_up_cards: [],
        is_active: true,
        is_ready: false
      }]);
      
    if (playerError) throw playerError;
    
    dispatch({ type: 'ADD_TEST_PLAYER', playerName });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Added test player: ${playerName}`);
  } catch (error) {
    console.error('Error adding test player:', error);
    toast.error('Failed to add test player');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

export const invitePlayer = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  email: string
) => {
  if (!state.gameId) {
    toast.error("No active game to invite players to");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const inviteLink = `${window.location.origin}/join/${state.gameId}`;
    
    console.log(`Sending invite to ${email} with link: ${inviteLink}`);
    
    dispatch({ type: 'INVITE_PLAYER', email });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Invitation sent to ${email}`);
  } catch (error) {
    console.error('Error inviting player:', error);
    toast.error('Failed to send invitation');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
