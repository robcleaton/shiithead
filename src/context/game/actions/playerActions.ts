
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { generateId } from '@/utils/gameUtils';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

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
    const selectedCards = [];
    
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
