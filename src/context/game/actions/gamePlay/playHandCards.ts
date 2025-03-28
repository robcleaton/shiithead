
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
  
  // Process player's hand after playing cards, including drawing new cards
  const { finalHand, updatedFaceUpCards, updatedFaceDownCards, updatedDeck } = processPlayerHand(player, sortedIndices, state);
  
  console.log(`After processing player hand: deck has ${updatedDeck.length} cards left`);
  console.log(`Player hand status: hand=${finalHand.length}, faceUp=${updatedFaceUpCards.length}, faceDown=${updatedFaceDownCards.length}`);
  
  // First update the local state to ensure UI updates immediately
  // Update the player's hand in the local state
  const updatedPlayers = [...state.players];
  const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
  if (playerIndex !== -1) {
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: finalHand,
      faceUpCards: updatedFaceUpCards,
      faceDownCards: updatedFaceDownCards
    };
    
    dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
  }
  
  // Update deck in local state
  dispatch({
    type: 'SET_GAME_STATE',
    gameState: {
      deck: updatedDeck
    }
  });
  
  // Check if the pile was empty before adding the card
  const wasEmptyPile = state.pile.length === 0;
  
  // First add cards to the pile then process burn conditions
  const newPile = [...state.pile, ...cardsToPlay];
  
  // Process burn conditions and update the pile
  const { updatedPile, shouldGetAnotherTurn, burnMessage, cardsBurned } = processBurnConditions(state, cardsToPlay, newPile);
  
  // Determine the next player
  const nextPlayerId = determineNextPlayer(state, player, cardsToPlay, shouldGetAnotherTurn, wasEmptyPile);
  
  // Update pile in local state
  dispatch({
    type: 'SET_GAME_STATE',
    gameState: {
      pile: updatedPile,
      currentPlayerId: nextPlayerId
    }
  });
  
  // Generate game status messages
  const { gameOver, statusMessage } = generateGameStatusMessage(player, finalHand, updatedFaceUpCards, updatedFaceDownCards, state);
  
  // Update game state in database
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
  
  // Display card play message
  toast.success(generateCardPlayMessage(player.name, cardsToPlay, burnMessage, wasEmptyPile));
  
  // Display game status message
  if (statusMessage) {
    if (gameOver) {
      toast.success(statusMessage);
    } else {
      toast.info(statusMessage);
    }
  }
};
