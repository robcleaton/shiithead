
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { generateId } from '@/utils/gameUtils';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { isAIPlayer } from './gamePlay/aiPlayerActions';

export const selectFaceUpCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number | number[]
) => {
  if (Array.isArray(cardIndex)) {
    // Handle array of indices by calling selectMultipleFaceUpCards
    return selectMultipleFaceUpCards(dispatch, state, cardIndex);
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    const cardToMove = player.hand[cardIndex];
    
    if (!cardToMove) {
      toast.error('Invalid card selection');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    if (player.faceUpCards.length >= 3) {
      toast.error('You already have 3 face-up cards');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const updatedHand = [...player.hand];
    updatedHand.splice(cardIndex, 1);
    
    const updatedFaceUpCards = [...player.faceUpCards, cardToMove];
    
    const { error } = await supabase
      .from('players')
      .update({
        hand: updatedHand,
        face_up_cards: updatedFaceUpCards,
        is_ready: updatedFaceUpCards.length === 3
      })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (error) throw error;
    
    dispatch({ type: 'SELECT_FACE_UP_CARD', cardIndex });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    
    if (updatedFaceUpCards.length === 3) {
      toast.success('You are ready to start!');
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
    
    const testPlayerId = `ai-${generateId()}`;
    
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
    toast.success(`Added AI player: ${playerName}`);
    
    setTimeout(() => {
      autoSelectAIPlayerCards(dispatch, state, testPlayerId);
    }, 1500);
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

export const removePlayer = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  playerId: string
) => {
  if (!state.gameId || state.gameStarted || !state.isHost) {
    toast.error("Only the host can remove players before the game starts");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const playerToRemove = state.players.find(p => p.id === playerId);
    if (!playerToRemove) {
      toast.error("Player not found");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Delete the player from the database - this will trigger real-time updates
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)
      .eq('game_id', state.gameId);
      
    if (error) throw error;
    
    // We don't need to manually dispatch REMOVE_PLAYER action here
    // as the real-time subscription will handle it for all clients
    
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Removed ${playerToRemove.name} from the game`);
    
  } catch (error) {
    console.error('Error removing player:', error);
    toast.error('Failed to remove player');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

const autoSelectAIPlayerCards = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  aiPlayerId: string
) => {
  try {
    const { data: playerData, error: playerFetchError } = await supabase
      .from('players')
      .select('*')
      .eq('id', aiPlayerId)
      .eq('game_id', state.gameId)
      .maybeSingle();
      
    if (playerFetchError || !playerData) {
      console.error('Error fetching AI player data:', playerFetchError);
      return;
    }
    
    const hand = playerData.hand as CardValue[];
    
    if (!hand || hand.length === 0) {
      console.log('AI player has no cards to select');
      return;
    }
    
    const rankOrder: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    
    const sortedHand = [...hand].sort((a, b) => 
      rankOrder[b.rank] - rankOrder[a.rank]
    );
    
    const selectedCards = sortedHand.slice(0, 3);
    const remainingCards = sortedHand.slice(3);
    
    console.log('AI player selected cards:', selectedCards);
    
    const { error: updateError } = await supabase
      .from('players')
      .update({
        hand: remainingCards,
        face_up_cards: selectedCards,
        is_ready: true
      })
      .eq('id', aiPlayerId)
      .eq('game_id', state.gameId);
      
    if (updateError) {
      console.error('Error updating AI player cards:', updateError);
      return;
    }
    
    toast.success(`${playerData.name} is ready to play!`);
  } catch (error) {
    console.error('Error in AI card selection:', error);
  }
};
