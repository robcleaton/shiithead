
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { pickupPile } from './pickupPile';

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
  
  if (state.pile.length > 0) {
    const topCard = state.pile[state.pile.length - 1];
    
    if (topCard.rank === '3') {
      await pickupPile(dispatch, state);
      return;
    }
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    // Create a copy of the deck to avoid mutation
    const updatedDeck = [...state.deck];
    const card = updatedDeck.pop()!;
    
    console.log(`Drawing card: ${card.rank} of ${card.suit}`);
    console.log(`Cards left in deck BEFORE update: ${state.deck.length}`);
    console.log(`Cards left in deck AFTER update: ${updatedDeck.length}`);
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    const updatedHand = [...player.hand, card];
    
    const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    const nextIndex = (playerIndex + 1) % state.players.length;
    const nextPlayerId = state.players[nextIndex].id;
    
    // Update the local player state immediately
    const updatedPlayers = [...state.players];
    const localPlayerIndex = updatedPlayers.findIndex(p => p.id === player.id);
    if (localPlayerIndex !== -1) {
      updatedPlayers[localPlayerIndex] = {
        ...updatedPlayers[localPlayerIndex],
        hand: updatedHand
      };
      dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
    }
    
    // Update the local state immediately to reflect changes
    dispatch({
      type: 'SET_GAME_STATE',
      gameState: {
        deck: updatedDeck,
        currentPlayerId: nextPlayerId
      }
    });
    
    // Then update the database (this might take a moment)
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        deck: updatedDeck,
        current_player_id: nextPlayerId
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    // Then update the player's hand
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    toast.info(`${player.name} drew a card.`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error drawing card:', error);
    toast.error('Failed to draw card');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
