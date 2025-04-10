
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue, Player } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { processBurnConditions } from './burnPileUtils';
import { determineNextPlayer, generateGameStatusMessage } from './cardHandlingUtils';

// Helper to handle the case when face down cards need to be moved to hand
const handleFaceDownToHandTransfer = (
  player: Player,
  updatedHand: CardValue[],
  updatedFaceUpCards: CardValue[] | null,
  updatedFaceDownCards: CardValue[] | null,
  cardPlayedFromType: string
): {
  updatedHand: CardValue[];
  updatedFaceDownCards: CardValue[] | null;
  statusMessage?: string;
} => {
  // If player's hand is empty, face up cards are empty, and they have face down cards
  if (cardPlayedFromType === 'faceUp' && updatedHand.length === 0 && 
     (updatedFaceUpCards === null || updatedFaceUpCards.length === 0) && 
     (updatedFaceDownCards !== null ? updatedFaceDownCards.length > 0 : player.faceDownCards.length > 0)) {
    
    const faceDownCardsToMove = updatedFaceDownCards || [...player.faceDownCards];
    
    console.log(`Moving ${faceDownCardsToMove.length} face down cards to hand after playing face up card`);
    
    return {
      updatedHand: [...faceDownCardsToMove],
      updatedFaceDownCards: [],
      statusMessage: `${player.name}'s face down cards have been moved to their hand`
    };
  }
  
  return { updatedHand, updatedFaceDownCards };
};

// Helper to draw cards after playing from hand
const handleDrawFromDeck = (
  updatedHand: CardValue[],
  updatedDeck: CardValue[],
  cardPlayedFromType: string
): {
  updatedHand: CardValue[];
  updatedDeck: CardValue[];
  drewCard?: boolean;
} => {
  // If player's hand is below 3 cards and deck is not empty, draw a card
  if (cardPlayedFromType === 'hand' && updatedHand.length < 3 && updatedDeck.length > 0) {
    const drawnCard = updatedDeck.pop()!;
    updatedHand.push(drawnCard);
    console.log(`Drew card after playing from hand: ${drawnCard.rank} of ${drawnCard.suit}, deck now has ${updatedDeck.length} cards`);
    return { updatedHand, updatedDeck, drewCard: true };
  }
  
  return { updatedHand, updatedDeck };
};

// Helper to update local state
const updateLocalState = (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  player: Player,
  updatedHand: CardValue[],
  updatedFaceUpCards: CardValue[] | null,
  updatedFaceDownCards: CardValue[] | null,
  updatedPile: CardValue[],
  updatedDeck: CardValue[],
  nextPlayerId: string
): void => {
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
  
  // Update game state in local state
  dispatch({
    type: 'SET_GAME_STATE',
    gameState: {
      pile: updatedPile,
      deck: updatedDeck,
      currentPlayerId: nextPlayerId
    }
  });
};

// Helper to update database state
const updateDatabaseState = async (
  state: GameState,
  player: Player,
  updatedHand: CardValue[],
  updatedFaceUpCards: CardValue[] | null,
  updatedFaceDownCards: CardValue[] | null,
  updatedPile: CardValue[],
  updatedDeck: CardValue[],
  nextPlayerId: string,
  gameOver: boolean
): Promise<void> => {
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
  
  // Update game state
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
};

// Helper to show appropriate toast messages
const showCardPlayMessages = (
  player: Player,
  cardToPlay: CardValue,
  burnMessage: string | null,
  cardPlayedFromType: string,
  gameOver: boolean,
  statusMessage: string | null
): void => {
  // Display messages based on card played
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
  // First, add the card to the pile before processing burn conditions
  let newPile = [...state.pile, cardToPlay];
  
  // Process burn conditions
  const { updatedPile, shouldGetAnotherTurn, burnMessage } = processBurnConditions(state, [cardToPlay], newPile);
  
  // Determine next player
  const nextPlayerId = determineNextPlayer(state, player, [cardToPlay], shouldGetAnotherTurn);
  
  // Create a copy of the deck for potential drawing
  const updatedDeck = [...state.deck];
  
  // Check if we need to move face down cards to hand
  let updatedHand = [...player.hand];
  
  // Handle face down cards to hand transfer if needed
  const transferResult = handleFaceDownToHandTransfer(
    player,
    updatedHand,
    updatedFaceUpCards,
    updatedFaceDownCards,
    cardPlayedFromType
  );
  
  updatedHand = transferResult.updatedHand;
  let faceDownCardsToUpdate = transferResult.updatedFaceDownCards;
  let statusMessage = transferResult.statusMessage;
  
  // Handle drawing cards from deck if needed
  const drawResult = handleDrawFromDeck(updatedHand, updatedDeck, cardPlayedFromType);
  updatedHand = drawResult.updatedHand;
  const finalUpdatedDeck = drawResult.updatedDeck;
  
  // Generate game status
  const gameStatusResult = generateGameStatusMessage(
    player,
    updatedHand, 
    updatedFaceUpCards || player.faceUpCards,
    faceDownCardsToUpdate || player.faceDownCards,
    { deck: finalUpdatedDeck }
  );
  
  const { gameOver, statusMessage: gameStatusMessage } = gameStatusResult;
  statusMessage = statusMessage || gameStatusMessage;
  
  // Update local state
  updateLocalState(
    dispatch,
    state,
    player,
    updatedHand,
    updatedFaceUpCards,
    faceDownCardsToUpdate,
    updatedPile,
    finalUpdatedDeck,
    nextPlayerId
  );
  
  // Update database state
  await updateDatabaseState(
    state,
    player,
    updatedHand,
    updatedFaceUpCards,
    faceDownCardsToUpdate,
    updatedPile,
    finalUpdatedDeck,
    nextPlayerId,
    gameOver
  );
  
  // Show appropriate messages
  showCardPlayMessages(player, cardToPlay, burnMessage, cardPlayedFromType, gameOver, statusMessage);
};

