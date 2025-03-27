
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { 
  validateSameRank, 
  validateCardIndices, 
  validatePlayAgainstPile 
} from './handCardsValidation';
import { 
  processPlayerHand, 
  determineNextPlayer, 
  generateCardPlayMessage,
  generateGameStatusMessage
} from './cardHandlingUtils';
import { processBurnConditions } from './burnPileUtils';

export const playHandCards = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndices: number[]
): Promise<void> => {
  const player = state.players.find(p => p.id === state.playerId);
  if (!player) return;
  
  // Important: Sort indices in descending order to avoid shifting issues when removing cards
  const sortedIndices = [...cardIndices].sort((a, b) => b - a);
  
  // Make sure we're working with valid indices
  if (!validateCardIndices(sortedIndices, player.hand.length)) {
    toast.error("Invalid card selection");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Extract the cards to be played
  const cardsToPlay = sortedIndices.map(index => player.hand[index]);
  
  // Validate cards are all the same rank
  if (!validateSameRank(cardsToPlay)) {
    toast.error("All cards must have the same rank!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Validate play against the top card on the pile
  if (!validatePlayAgainstPile(cardsToPlay, state.pile)) {
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Process player's hand after playing cards
  const { finalHand, updatedFaceUpCards } = processPlayerHand(player, sortedIndices, state);
  
  // Update player's hand in the database
  const { error: playerError } = await supabase
    .from('players')
    .update({ 
      hand: finalHand,
      face_up_cards: updatedFaceUpCards
    })
    .eq('id', player.id)
    .eq('game_id', state.gameId);
    
  if (playerError) throw playerError;
  
  // First add cards to the pile then process burn conditions
  const newPile = [...state.pile, ...cardsToPlay];
  
  // Process burn conditions and update the pile
  const { updatedPile, shouldGetAnotherTurn, burnMessage, cardsBurned } = processBurnConditions(state, cardsToPlay, newPile);
  
  // Determine the next player
  const nextPlayerId = determineNextPlayer(state, player, cardsToPlay, shouldGetAnotherTurn);
  
  // Generate game status messages
  const { gameOver, statusMessage } = generateGameStatusMessage(player, finalHand, updatedFaceUpCards, state);
  
  // Update game state in database
  const { error: gameError } = await supabase
    .from('games')
    .update({ 
      pile: updatedPile,
      current_player_id: nextPlayerId,
      ended: gameOver,
      deck: state.deck
    })
    .eq('id', state.gameId);
    
  if (gameError) throw gameError;
  
  // Display card play message
  toast.success(generateCardPlayMessage(player.name, cardsToPlay, burnMessage));
  
  // Display game status message
  if (statusMessage) {
    if (gameOver) {
      toast.success(statusMessage);
    } else {
      toast.info(statusMessage);
    }
  }
};
