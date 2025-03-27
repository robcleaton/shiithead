
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { processBurnConditions } from './burnPileUtils';
import { determineNextPlayer, generateGameStatusMessage } from './cardHandlingUtils';

// Shared function to handle updating player and game state after a card is played
export const updateGameState = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  player: {
    id: string;
    name: string;
    hand: CardValue[];
    faceUpCards: CardValue[];
    faceDownCards: CardValue[];
  },
  cardToPlay: CardValue,
  updatedFaceUpCards: CardValue[] | null = null,
  updatedFaceDownCards: CardValue[] | null = null,
  cardPlayedFromType: 'faceUp' | 'faceDown' | 'hand' = 'hand'
): Promise<void> => {
  // Process burn conditions
  const { updatedPile, shouldGetAnotherTurn, burnMessage } = processBurnConditions(state, [cardToPlay]);
  
  // Determine next player
  const nextPlayerId = determineNextPlayer(state, player, [cardToPlay], shouldGetAnotherTurn);
  
  // Generate game status
  const { gameOver, statusMessage } = generateGameStatusMessage(
    player, 
    player.hand, 
    updatedFaceUpCards || player.faceUpCards, 
    state
  );
  
  // Prepare player update payload
  const playerUpdatePayload: any = {};
  
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
      ended: gameOver
    })
    .eq('id', state.gameId);
    
  if (gameError) throw gameError;
  
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

// Shared validation for face up and face down cards
export const validateCardPlay = (
  player: {
    id: string;
    hand: CardValue[];
    faceUpCards: CardValue[];
    faceDownCards: CardValue[];
  },
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
    // Special exception for 3's
    if (topCard.rank === '3' && cardToPlay.rank !== '3') {
      toast.error("You must play a 3 or pick up the pile!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return { isValid: false };
    }
    
    const validationResult = validation(cardToPlay, topCard);
    if (!validationResult.valid) {
      toast.error(validationResult.errorMessage);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return { isValid: false };
    }
  }
  
  return { isValid: true, cardToPlay, updatedCards };
};
