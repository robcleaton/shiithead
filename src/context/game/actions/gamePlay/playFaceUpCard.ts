
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { validateSingleCardPlay } from './cardValidation';

export const playFaceUpCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  faceUpIndex: number
): Promise<void> => {
  const player = state.players.find(p => p.id === state.playerId);
  if (!player) return;
  
  if (faceUpIndex >= player.faceUpCards.length) {
    toast.error("Invalid face up card selection");
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Get the card from face up cards
  const cardToPlay = player.faceUpCards[faceUpIndex];
  
  // Validate the play
  if (state.pile.length > 0) {
    const topCard = state.pile[state.pile.length - 1];
    
    // Special case: if top card is a 3, only a 3 can be played
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
  
  // Remove card from face up cards
  const updatedFaceUpCards = [...player.faceUpCards];
  updatedFaceUpCards.splice(faceUpIndex, 1);
  
  // Update Supabase
  const { error: playerError } = await supabase
    .from('players')
    .update({ face_up_cards: updatedFaceUpCards })
    .eq('id', player.id)
    .eq('game_id', state.gameId);
    
  if (playerError) throw playerError;
  
  let updatedPile: CardValue[] = [];
  
  const isBurnCard = cardToPlay.rank === '10';
  if (isBurnCard) {
    updatedPile = [];
    toast.success(`${player.name} played a 10 - the discard pile has been completely emptied! ${player.name} gets another turn.`);
  } else {
    updatedPile = [...state.pile, cardToPlay];
  }
  
  // Determine next player
  const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
  let nextPlayerId = state.currentPlayerId;
  
  if (cardToPlay.rank !== '2' && cardToPlay.rank !== '10') {
    const nextIndex = (currentPlayerIndex + 1) % state.players.length;
    nextPlayerId = state.players[nextIndex].id;
  }
  
  // Check if game is over (no cards left)
  const gameOver = player.hand.length === 0 && updatedFaceUpCards.length === 0 && player.faceDownCards.length === 0;
  
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
    toast.success(`${player.name} played a 2 from their face up cards - they get another turn!`);
  } else if (cardToPlay.rank === '3') {
    toast.success(`${player.name} played a 3 from their face up cards - next player must pick up the pile or play a 3!`);
  } else if (cardToPlay.rank === '7') {
    toast.success(`${player.name} played a 7 from their face up cards - the next player must play a card of rank lower than 7 or another 7!`);
  } else if (cardToPlay.rank === '10') {
    toast.success(`${player.name} played a 10 from their face up cards - the entire discard pile has been removed from the game! ${player.name} gets another turn.`);
  } else {
    toast.success(`${player.name} played ${cardToPlay.rank} of ${cardToPlay.suit} from their face up cards!`);
  }
  
  if (gameOver) {
    toast.success(`${player.name} has won the game!`);
  } else if (updatedFaceUpCards.length === 0 && player.faceDownCards.length === 1) {
    toast.info(`${player.name} is down to their last card!`);
  }
};
