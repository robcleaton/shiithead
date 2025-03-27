
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { processBurnConditions } from './burnPileUtils';
import { determineNextPlayer, generateGameStatusMessage } from './cardHandlingUtils';

export const playFaceDownCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number
): Promise<void> => {
  const player = state.players.find(p => p.id === state.playerId);
  if (!player) return;
  
  if (cardIndex < 0 || cardIndex >= player.faceDownCards.length) {
    toast.error("Invalid face down card selection");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Cannot play face down cards if the player still has cards in hand
  if (player.hand.length > 0) {
    toast.error("You must play all cards in your hand first!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Cannot play face down cards if the player still has face up cards
  if (player.faceUpCards.length > 0) {
    toast.error("You must play all your face up cards first!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  const cardToPlay = player.faceDownCards[cardIndex];
  const updatedFaceDownCards = [...player.faceDownCards];
  updatedFaceDownCards.splice(cardIndex, 1);
  
  // Check if this is a valid play
  if (state.pile.length > 0) {
    const topCard = state.pile[state.pile.length - 1];
    
    // Special exception for 3's
    if (topCard.rank === '3' && cardToPlay.rank !== '3') {
      toast.error("You drew a " + cardToPlay.rank + " of " + cardToPlay.suit + " but needed a 3. Pick up the pile!");
      
      // Pick up the pile as a penalty and add the revealed card
      const updatedHand = [...state.pile, cardToPlay];
      
      const { error: playerError } = await supabase
        .from('players')
        .update({ 
          hand: updatedHand,
          face_down_cards: updatedFaceDownCards
        })
        .eq('id', player.id)
        .eq('game_id', state.gameId);
        
      if (playerError) throw playerError;
      
      // Clear the pile
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          pile: [],
          current_player_id: state.players[(state.players.findIndex(p => p.id === state.currentPlayerId) + 1) % state.players.length].id
        })
        .eq('id', state.gameId);
        
      if (gameError) throw gameError;
      
      toast.info(`${player.name} picked up the pile as a penalty!`);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
  }
  
  // Process burn conditions
  const { updatedPile, shouldGetAnotherTurn, burnMessage } = processBurnConditions(state, [cardToPlay]);
  
  // Determine next player
  const nextPlayerId = determineNextPlayer(state, player, [cardToPlay], shouldGetAnotherTurn);
  
  // Generate game status
  const { gameOver, statusMessage } = generateGameStatusMessage(
    player, 
    player.hand, 
    player.faceUpCards, 
    state
  );
  
  // Update player state
  const { error: playerError } = await supabase
    .from('players')
    .update({ face_down_cards: updatedFaceDownCards })
    .eq('id', player.id)
    .eq('game_id', state.gameId);
    
  if (playerError) throw playerError;
  
  // Update game state
  const { error: gameError } = await supabase
    .from('games')
    .update({ 
      pile: updatedPile,
      current_player_id: nextPlayerId,
      ended: gameOver
    })
    .eq('id', state.gameId);
    
  if (gameError) throw gameError;
  
  if (burnMessage) {
    toast.success(`${player.name} ${burnMessage} ${player.name} gets another turn.`);
  } else {
    toast.success(`${player.name} played a face down ${cardToPlay.rank} of ${cardToPlay.suit}!`);
  }
  
  if (gameOver) {
    toast.success(`${player.name} has won the game!`);
  } else if (statusMessage) {
    toast.info(statusMessage);
  }
};
