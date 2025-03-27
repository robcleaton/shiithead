
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { validateSingleCardPlay, validateMultipleCardsPlay } from './cardValidation';

// Helper function to check if there are 4 cards of the same rank in the pile
const checkForFourOfAKind = (pile: CardValue[], newCards: CardValue[]): boolean => {
  if (pile.length + newCards.length < 4) return false;
  
  // Create a map to count occurrences of each rank in the combined pile
  const rankCounts = new Map<string, number>();
  
  // Count ranks in the existing pile
  pile.forEach(card => {
    const count = rankCounts.get(card.rank) || 0;
    rankCounts.set(card.rank, count + 1);
  });
  
  // Count ranks in the new cards being played
  newCards.forEach(card => {
    const count = rankCounts.get(card.rank) || 0;
    rankCounts.set(card.rank, count + 1);
  });
  
  // Check if any rank has exactly 4 cards
  for (const [rank, count] of rankCounts.entries()) {
    if (count === 4) {
      return true;
    }
  }
  
  return false;
};

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
  if (sortedIndices.some(index => index < 0 || index >= player.hand.length)) {
    toast.error("Invalid card selection");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Extract the cards to be played
  const cardsToPlay = sortedIndices.map(index => player.hand[index]);
  const firstCardRank = cardsToPlay[0]?.rank;
  const allSameRank = cardsToPlay.every(card => card.rank === firstCardRank);
  
  if (!allSameRank) {
    toast.error("All cards must have the same rank!");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  if (state.pile.length > 0) {
    const topCard = state.pile[state.pile.length - 1];
    
    if (topCard.rank === '3' && firstCardRank !== '3') {
      toast.error("You must play a 3 or pick up the pile!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
  }
  
  if (sortedIndices.length === 1) {
    const cardToPlay = player.hand[sortedIndices[0]];
    
    if (state.pile.length > 0) {
      const topCard = state.pile[state.pile.length - 1];
      const validation = validateSingleCardPlay(cardToPlay, topCard);
      
      if (!validation.valid) {
        toast.error(validation.errorMessage);
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    }
  } else {
    const cardToPlay = player.hand[sortedIndices[0]];
    
    if (state.pile.length > 0) {
      const topCard = state.pile[state.pile.length - 1];
      const validation = validateMultipleCardsPlay(cardToPlay, topCard);
      
      if (!validation.valid) {
        toast.error(validation.errorMessage);
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    }
  }
  
  // Create a new hand array, removing the played cards
  const updatedHand = [...player.hand];
  for (const index of sortedIndices) {
    updatedHand.splice(index, 1);
  }
  
  // Check for moving face-up cards to hand when hand is empty and deck is empty
  let finalHand = [...updatedHand];
  let updatedFaceUpCards = [...player.faceUpCards];
  
  if (finalHand.length === 0 && state.deck.length === 0 && player.faceUpCards.length > 0) {
    // Move face-up cards to hand
    finalHand = [...player.faceUpCards];
    updatedFaceUpCards = [];
    toast.info(`${player.name}'s face-up cards have been moved to their hand`);
  } else {
    // Draw cards from the deck if needed
    const cardsToDrawCount = Math.max(0, 3 - updatedHand.length);
    const updatedDeck = [...state.deck];
    const drawnCards = [];
    
    for (let i = 0; i < cardsToDrawCount && updatedDeck.length > 0; i++) {
      drawnCards.push(updatedDeck.pop()!);
    }
    
    finalHand = [...updatedHand, ...drawnCards];
  }
  
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
  
  let updatedPile: CardValue[] = [];
  let shouldGetAnotherTurn = false;
  
  // Check for burn conditions
  const isBurnCard = cardsToPlay.some(card => card.rank === '10');
  const isFourOfAKind = checkForFourOfAKind(state.pile, cardsToPlay);
  
  if (isBurnCard || isFourOfAKind) {
    updatedPile = [];
    shouldGetAnotherTurn = true;
    
    if (isBurnCard) {
      toast.success(`${player.name} played a 10 - the discard pile has been completely emptied! ${player.name} gets another turn.`);
    } else if (isFourOfAKind) {
      toast.success(`Four of a kind! ${player.name} has completed a set of 4 ${cardsToPlay[0].rank}s - the discard pile has been burned! ${player.name} gets another turn.`);
    }
  } else {
    updatedPile = [...state.pile, ...cardsToPlay];
  }
  
  const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
  let nextPlayerId = state.currentPlayerId;
  
  if (!shouldGetAnotherTurn && !cardsToPlay.some(card => card.rank === '2')) {
    const nextIndex = (currentPlayerIndex + 1) % state.players.length;
    nextPlayerId = state.players[nextIndex].id;
  }
  
  const gameOver = finalHand.length === 0 && updatedFaceUpCards.length === 0 && player.faceDownCards.length === 0;
  
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
  
  if (cardsToPlay.length > 1) {
    toast.success(`${player.name} played ${cardsToPlay.length} ${cardsToPlay[0].rank}s!`);
  } else {
    if (cardsToPlay[0].rank === '2') {
      toast.success(`${player.name} played a 2 - they get another turn!`);
    } else if (cardsToPlay[0].rank === '3') {
      toast.success(`${player.name} played a 3 - next player must pick up the pile or play a 3!`);
    } else if (cardsToPlay[0].rank === '7') {
      toast.success(`${player.name} played a 7 - the next player must play a card of rank lower than 7 or another 7!`);
    } else if (cardsToPlay[0].rank === '8') {
      toast.success(`${player.name} played an 8 - this card is invisible, the next player can play any card!`);
    } else if (cardsToPlay[0].rank === '10') {
      toast.success(`${player.name} played a 10 - the entire discard pile has been removed from the game! ${player.name} gets another turn.`);
    }
  }
  
  if (gameOver) {
    toast.success(`${player.name} has won the game!`);
  } else if (finalHand.length === 0 && updatedFaceUpCards.length === 0 && player.faceDownCards.length === 1) {
    toast.info(`${player.name} is down to their last card!`);
  }
  
  if (finalHand.length === 0 && state.deck.length === 0 && player.faceUpCards.length === 0 && player.faceDownCards.length > 0) {
    toast.info(`${player.name} must now play their face-down cards!`);
  }
};
