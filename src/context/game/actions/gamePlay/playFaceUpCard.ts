
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { validateSingleCardPlay } from './cardValidation';
import { processBurnConditions } from './burnPileUtils';
import { determineNextPlayer, generateGameStatusMessage } from './cardHandlingUtils';

export const playFaceUpCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number
): Promise<void> => {
  const player = state.players.find(p => p.id === state.playerId);
  if (!player) return;
  
  if (cardIndex < 0 || cardIndex >= player.faceUpCards.length) {
    toast.error("Invalid face up card selection");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Cannot play face up cards if the player still has cards in hand
  if (player.hand.length > 0) {
    toast.error("You must play all cards in your hand first!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  const cardToPlay = player.faceUpCards[cardIndex];
  
  // Check if this is a valid play
  if (state.pile.length > 0) {
    const topCard = state.pile[state.pile.length - 1];
    
    // Special exception for 3's
    if (topCard.rank === '3' && cardToPlay.rank !== '3') {
      toast.error("You must play a 3 or pick up the pile!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const validation = validateSingleCardPlay(cardToPlay, topCard);
    if (!validation.valid) {
      toast.error(validation.errorMessage);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
  }
  
  // Process burn conditions
  const { updatedPile, shouldGetAnotherTurn, burnMessage } = processBurnConditions(state, [cardToPlay]);
  
  // Update player's face up cards
  const updatedFaceUpCards = [...player.faceUpCards];
  updatedFaceUpCards.splice(cardIndex, 1);
  
  // Determine next player
  const nextPlayerId = determineNextPlayer(state, player, [cardToPlay], shouldGetAnotherTurn);
  
  // Generate game status
  const { gameOver, statusMessage } = generateGameStatusMessage(
    player, 
    player.hand, 
    updatedFaceUpCards, 
    state
  );
  
  // Update player state
  const { error: playerError } = await supabase
    .from('players')
    .update({ face_up_cards: updatedFaceUpCards })
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
  } else if (cardToPlay.rank === '2') {
    toast.success(`${player.name} played a 2 - they get another turn!`);
  } else if (cardToPlay.rank === '3') {
    toast.success(`${player.name} played a 3 - next player must pick up the pile or play a 3!`);
  } else if (cardToPlay.rank === '7') {
    toast.success(`${player.name} played a 7 - the next player must play a card of rank lower than 7 or another 7!`);
  } else if (cardToPlay.rank === '8') {
    toast.success(`${player.name} played an 8 - this card is invisible, the next player can play any card!`);
  } else {
    toast.success(`${player.name} played a ${cardToPlay.rank} from their face up cards!`);
  }
  
  if (gameOver) {
    toast.success(`${player.name} has won the game!`);
  } else if (statusMessage) {
    toast.info(statusMessage);
  }
};
