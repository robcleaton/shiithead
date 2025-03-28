import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue, Player } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { processBurnConditions } from './burnPileUtils';
import { determineNextPlayer, generateGameStatusMessage } from './cardHandlingUtils';
import { validateSingleCardPlay } from './cardValidation';
import { getEffectiveTopCard } from './utils';

// Shared function to handle updating player and game state after a card is played
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
  
  // First update the local state immediately to reflect changes before database updates
  // Update player's cards in the local state
  const updatedPlayers = [...state.players];
  const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
  if (playerIndex !== -1) {
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: updatedHand,
      faceUpCards: updatedFaceUpCards !== null ? updatedFaceUpCards : player.faceUpCards,
      faceDownCards: updatedFaceDownCards !== null ? updatedFaceDownCards : player.faceDownCards
    };
    
    dispatch({ type: 'SET_PLAYERS', players: updatedPlayers });
  }
  
  // Special case for 3 on empty pile in 2-player game: show the 3 briefly, then clear the pile
  const finalPile = emptyPileSpecialCase ? [] : updatedPile;
  
  // Update game state in local state
  dispatch({
    type: 'SET_GAME_STATE',
    gameState: {
      pile: finalPile,
      deck: updatedDeck,
      currentPlayerId: nextPlayerId
    }
  });
  
  // Prepare player update payload
  const playerUpdatePayload: any = {};
  
  // Always update the hand if we've modified it
  if (updatedHand !== player.hand) {
    playerUpdatePayload.hand = updatedHand;
  }
  
  if (updatedFaceUpCards !== null) {
    playerUpdatePayload.face_up_cards = updatedFaceUpCards;
  }
  
  if (updatedFaceDownCards !== null) {
    playerUpdatePayload.face_down_cards = updatedFaceDownCards;
  }
  
  // Only update if there are changes
  if (Object.keys(playerUpdatePayload).length > 0) {
    // Update player state
    const { error: playerError } = await supabase
      .from('players')
      .update(playerUpdatePayload)
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
  }
  
  // Update game state - using the final pile state (empty for 3 on empty pile in 2-player)
  const { error: gameError } = await supabase
    .from('games')
    .update({ 
      pile: finalPile,
      current_player_id: nextPlayerId,
      ended: gameOver,
      deck: updatedDeck
    })
    .eq('id', state.gameId);
    
  if (gameError) throw gameError;
  
  // Display messages based on card played
  if (burnMessage) {
    toast.success(`${player.name} ${burnMessage} ${player.name} gets another turn.`);
  } else if (cardToPlay.rank === '2') {
    toast.success(`${player.name} played a 2 - they get another turn!`);
  } else if (cardToPlay.rank === '3') {
    if (wasEmptyPile) {
      if (isTwoPlayerGame) {
        toast.success(`${player.name} played a 3 on an empty pile - pile is emptied and ${player.name} gets another turn!`);
      } else {
        toast.success(`${player.name} played a 3 on an empty pile - next player's turn is skipped!`);
      }
    } else {
      toast.success(`${player.name} played a 3 - next player must pick up the pile or play a 3!`);
    }
  } else if (cardToPlay.rank === '7') {
    toast.success(`${player.name} played a 7 - the next player must play a card of rank lower than 7 or another 7!`);
  } else if (cardToPlay.rank === '8') {
    toast.success(`${player.name} played an 8 - this card is invisible, the next player can play any card!`);
  } else {
    let sourceText = '';
    if (cardPlayedFromType === 'faceUp') {
      sourceText = 'from their face up cards';
    } else if (cardPlayedFromType === 'faceDown') {
      sourceText = 'from their face down cards';
    }
    toast.success(`${player.name} played a ${cardToPlay.rank} of ${cardToPlay.suit} ${sourceText}!`);
  }
  
  // Display game status message
  if (gameOver) {
    toast.success(`${player.name} has won the game!`);
  } else if (statusMessage) {
    toast.info(statusMessage);
  }
};

// Shared validation for face up and face down cards
export const validateCardPlay = (
  player: Player,
  cardIndex: number,
  cardType: 'faceUp' | 'faceDown',
  topCard: CardValue | undefined,
  validation: (card: CardValue, topCard: CardValue | undefined) => { valid: boolean; errorMessage?: string },
  dispatch: Dispatch<GameAction>
): {
  isValid: boolean;
  cardToPlay?: CardValue;
  updatedCards?: CardValue[];
} => {
  const cardArray = cardType === 'faceUp' ? player.faceUpCards : player.faceDownCards;
  
  if (cardIndex < 0 || cardIndex >= cardArray.length) {
    toast.error(`Invalid ${cardType === 'faceUp' ? 'face up' : 'face down'} card selection`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return { isValid: false };
  }
  
  // Cannot play these cards if the player still has cards in hand
  if (player.hand.length > 0) {
    toast.error("You must play all cards in your hand first!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return { isValid: false };
  }
  
  // Cannot play face down cards if the player still has face up cards
  if (cardType === 'faceDown' && player.faceUpCards.length > 0) {
    toast.error("You must play all your face up cards first!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return { isValid: false };
  }
  
  const cardToPlay = cardArray[cardIndex];
  const updatedCards = [...cardArray];
  updatedCards.splice(cardIndex, 1);
  
  // Skip validation for face down cards (they're revealed when played)
  if (cardType === 'faceDown') {
    return { isValid: true, cardToPlay, updatedCards };
  }
  
  // Check if this is a valid play for face up cards
  if (topCard) {
    // Get the effective top card (accounting for 8s)
    const effectiveTopCard = getEffectiveTopCard([topCard]); // Fix: Wrap single card in an array
    
    // Special exception for 3's
    if (effectiveTopCard?.rank === '3' && cardToPlay.rank !== '3') {
      toast.error("You must play a 3 or pick up the pile!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return { isValid: false };
    }
    
    const validationResult = validation(cardToPlay, effectiveTopCard);
    if (!validationResult.valid) {
      toast.error(validationResult.errorMessage);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return { isValid: false };
    }
  }
  
  return { isValid: true, cardToPlay, updatedCards };
};
