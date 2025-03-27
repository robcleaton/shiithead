
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

// Helper function to check if there are 4 cards of the same rank in the pile
const checkForFourOfAKind = (pile: CardValue[], newCard: CardValue): boolean => {
  if (pile.length < 3) return false;
  
  // Count how many cards in the pile have the same rank as the new card
  const sameRankCount = pile.filter(card => card.rank === newCard.rank).length;
  
  // If there are exactly 3 cards in the pile with the same rank as the new card
  // (which would make 4 of a kind when the new card is added)
  return sameRankCount === 3;
};

export const playFaceDownCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  faceDownIndex: number
): Promise<void> => {
  const player = state.players.find(p => p.id === state.playerId);
  if (!player) return;
  
  if (faceDownIndex >= player.faceDownCards.length) {
    toast.error("Invalid face down card selection");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Get the card from face down cards
  const cardToPlay = player.faceDownCards[faceDownIndex];
  
  // Remove card from face down cards
  const updatedFaceDownCards = [...player.faceDownCards];
  updatedFaceDownCards.splice(faceDownIndex, 1);
  
  // Update Supabase
  const { error: playerError } = await supabase
    .from('players')
    .update({ face_down_cards: updatedFaceDownCards })
    .eq('id', player.id)
    .eq('game_id', state.gameId);
    
  if (playerError) throw playerError;
  
  let updatedPile: CardValue[] = [];
  let shouldGetAnotherTurn = false;
  
  // Check for burn conditions
  const isBurnCard = cardToPlay.rank === '10';
  const isFourOfAKind = checkForFourOfAKind(state.pile, cardToPlay);
  
  if (isBurnCard || isFourOfAKind) {
    updatedPile = [];
    shouldGetAnotherTurn = true;
    
    if (isBurnCard) {
      toast.success(`${player.name} played a 10 - the discard pile has been completely emptied! ${player.name} gets another turn.`);
    } else if (isFourOfAKind) {
      toast.success(`Four of a kind! ${player.name} has completed a set of 4 ${cardToPlay.rank}s - the discard pile has been burned! ${player.name} gets another turn.`);
    }
  } else {
    updatedPile = [...state.pile, cardToPlay];
  }
  
  // Determine next player
  const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
  let nextPlayerId = state.currentPlayerId;
  
  if (!shouldGetAnotherTurn && cardToPlay.rank !== '2') {
    const nextIndex = (currentPlayerIndex + 1) % state.players.length;
    nextPlayerId = state.players[nextIndex].id;
  }
  
  // Check if game is over (no cards left)
  const gameOver = updatedFaceDownCards.length === 0;
  
  const { error: gameError } = await supabase
    .from('games')
    .update({ 
      pile: updatedPile,
      current_player_id: nextPlayerId,
      ended: gameOver
    })
    .eq('id', state.gameId);
    
  if (gameError) throw gameError;
  
  // Display appropriate message
  if (cardToPlay.rank === '2') {
    toast.success(`${player.name} played a 2 from their face down cards - they get another turn!`);
  } else if (cardToPlay.rank === '3') {
    toast.success(`${player.name} played a 3 from their face down cards - next player must pick up the pile or play a 3!`);
  } else if (cardToPlay.rank === '7') {
    toast.success(`${player.name} played a 7 from their face down cards - the next player must play a card of rank lower than 7 or another 7!`);
  } else if (cardToPlay.rank === '10') {
    toast.success(`${player.name} played a 10 from their face down cards - the entire discard pile has been removed from the game! ${player.name} gets another turn.`);
  } else {
    toast.success(`${player.name} played ${cardToPlay.rank} of ${cardToPlay.suit} from their face down cards!`);
  }
  
  if (gameOver) {
    toast.success(`${player.name} has won the game!`);
  } else if (updatedFaceDownCards.length === 1) {
    toast.info(`${player.name} is down to their last card!`);
  }
};
