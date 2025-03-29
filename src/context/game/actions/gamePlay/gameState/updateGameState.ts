
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue, Player } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { processBurnConditions } from '../burnPileUtils';
import { determineNextPlayer, generateGameStatusMessage, generateCardPlayMessage } from '../cardHandlingUtils';
import { getEffectiveTopCard } from '../utils';
import { updateLocalState } from './updateLocalState';
import { updateDatabase } from './updateDatabase';
import { displayMessages } from './displayMessages';

// Main function to handle updating player and game state after a card is played
export const updateGameState = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  player: Player,
  cardToPlay: CardValue,
  updatedFaceUpCards: CardValue[] | null = null,
  updatedFaceDownCards: CardValue[] | null = null,
  cardPlayedFromType: 'faceUp' | 'faceDown' | 'hand' = 'hand'
): Promise<void> => {
  // Check if pile was empty before adding card
  const wasEmptyPile = state.pile.length === 0;
  const isThreePlayed = cardToPlay.rank === '3';
  const isTwoPlayerGame = state.players.length === 2;
  
  // Handle the special case for 3 on empty pile
  let newPile = [...state.pile];
  let emptyPileSpecialCase = false;
  
  if (isThreePlayed && wasEmptyPile) {
    if (isTwoPlayerGame) {
      // In a 2-player game, playing a 3 on an empty pile empties the pile and gives the player another turn
      emptyPileSpecialCase = true;
      // Add the 3 to the pile temporarily for display, but we'll clear it later
      newPile = [cardToPlay];
    } else {
      // In a game with more than 2 players, the 3 is added to the pile
      newPile = [...state.pile, cardToPlay];
    }
  } else {
    // Normal case - add the card to the pile
    newPile = [...state.pile, cardToPlay];
  }
  
  // Process burn conditions except for the special case
  const { updatedPile, shouldGetAnotherTurn, burnMessage, cardsBurned } = 
    emptyPileSpecialCase ? 
    { updatedPile: [], shouldGetAnotherTurn: true, burnMessage: null, cardsBurned: false } : 
    processBurnConditions(state, [cardToPlay], newPile);
  
  // Determine next player
  const nextPlayerId = determineNextPlayer(state, player, [cardToPlay], shouldGetAnotherTurn || emptyPileSpecialCase, wasEmptyPile);
  
  // Create a copy of the deck for potential drawing
  const updatedDeck = [...state.deck];
  
  // Check if we need to move face down cards to hand
  let updatedHand = [...player.hand];
  const faceDownCardsToUpdate = updatedFaceDownCards !== null ? updatedFaceDownCards : [...player.faceDownCards];
  
  // If player's hand is empty, face up cards are empty, and they have face down cards
  if (cardPlayedFromType === 'faceUp' && updatedHand.length === 0 && 
     (updatedFaceUpCards === null || updatedFaceUpCards.length === 0) && 
     faceDownCardsToUpdate.length > 0) {
    
    updatedHand = [...faceDownCardsToUpdate];
    // Update face down cards to be empty since we moved them to hand
    if (updatedFaceDownCards === null) {
      updatedFaceDownCards = [];
    } else {
      updatedFaceDownCards = [];
    }
    
    console.log(`Moved ${updatedHand.length} face down cards to hand after playing face up card`);
    toast.info(`${player.name}'s face down cards have been moved to their hand`);
  }
  // If player's hand is below 3 cards and deck is not empty, draw a card
  else if (cardPlayedFromType === 'hand' && updatedHand.length < 3 && updatedDeck.length > 0) {
    const drawnCard = updatedDeck.pop()!;
    updatedHand.push(drawnCard);
    console.log(`Drew card after playing from hand: ${drawnCard.rank} of ${drawnCard.suit}, deck now has ${updatedDeck.length} cards`);
  }
  
  // Generate game status
  const { gameOver, statusMessage } = generateGameStatusMessage(
    player,
    updatedHand, 
    updatedFaceUpCards || player.faceUpCards,
    updatedFaceDownCards || player.faceDownCards,
    { deck: updatedDeck }
  );
  
  // Update player's cards in the local state
  await updateLocalState(
    dispatch, 
    state, 
    player, 
    updatedHand, 
    updatedFaceUpCards, 
    updatedFaceDownCards, 
    updatedPile, 
    updatedDeck, 
    nextPlayerId
  );
  
  // Update database
  await updateDatabase(
    state, 
    player, 
    updatedHand, 
    updatedFaceUpCards, 
    updatedFaceDownCards, 
    updatedPile, 
    updatedDeck, 
    nextPlayerId,
    gameOver
  );
  
  // Display messages based on card played
  displayMessages(
    player, 
    cardToPlay, 
    burnMessage, 
    cardPlayedFromType, 
    wasEmptyPile, 
    gameOver, 
    statusMessage
  );
};
