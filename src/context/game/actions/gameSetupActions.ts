
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { createDeck, generateId } from '@/utils/gameUtils';
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
