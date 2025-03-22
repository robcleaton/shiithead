
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue, Rank } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

export const playCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number
) => {
  if (state.currentPlayerId !== state.playerId) {
    toast.error("It's not your turn!");
    return;
  }
  
  try {
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    const cardToPlay = player.hand[cardIndex];
    
    if (state.pile.length > 0) {
      const topCard = state.pile[state.pile.length - 1];
      
      const specialCards = ['2', '3', '7', '8', '10'];
      const cardRank = cardToPlay.rank;
      const rankValues: Record<Rank, number> = {
        'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, 
        '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
      };
      
      if (topCard.rank === '7' && !specialCards.includes(cardRank) && rankValues[cardRank] > 7) {
        toast.error("After a 7 is played, you must play a card of rank 7 or lower!");
        return;
      }
      else if (cardToPlay.rank === '10' && topCard.rank === '7') {
        toast.error("Cannot play a 10 on top of a 7!");
        return;
      }
      else if (!specialCards.includes(cardRank) && cardRank !== topCard.rank) {
        toast.error("Invalid move! Card must match the rank of the top card or be a special card (2, 3, 7, 8, 10).");
        return;
      }
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const updatedHand = [...player.hand];
    updatedHand.splice(cardIndex, 1);
    
    const cardsToDrawCount = Math.max(0, 3 - updatedHand.length);
    const updatedDeck = [...state.deck];
    const drawnCards = [];
    
    for (let i = 0; i < cardsToDrawCount && updatedDeck.length > 0; i++) {
      drawnCards.push(updatedDeck.pop()!);
    }
    
    const finalHand = [...updatedHand, ...drawnCards];
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: finalHand })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    let updatedPile: CardValue[] = [];
    if (cardToPlay.rank === '10') {
      updatedPile = [cardToPlay];
    } else {
      updatedPile = [...state.pile, cardToPlay];
    }
    
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    
    let nextIndex = currentPlayerIndex;
    
    if (cardToPlay.rank === '2') {
      nextIndex = currentPlayerIndex;
    } else if (cardToPlay.rank === '10') {
      nextIndex = currentPlayerIndex;
    } else {
      nextIndex = (currentPlayerIndex + 1) % state.players.length;
    }
    
    const nextPlayerId = state.players[nextIndex].id;
    
    const gameOver = finalHand.length === 0 && player.faceUpCards.length === 0 && player.faceDownCards.length === 0;
    
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
    
    if (cardToPlay.rank === '2') {
      toast.success(`${player.name} played a 2 - they get another turn!`);
    } else if (cardToPlay.rank === '7') {
      toast.success(`${player.name} played a 7 - the next player must play a card of rank 7 or lower!`);
    } else if (cardToPlay.rank === '10') {
      toast.success(`${player.name} played a 10 - the pile has been burned! ${player.name} gets another turn.`);
    }
    
    if (gameOver) {
      toast.success(`${player.name} has won the game!`);
    } else if (finalHand.length === 0 && player.faceUpCards.length === 0 && player.faceDownCards.length === 1) {
      toast.info(`${player.name} is down to their last card!`);
    }
    
    if (drawnCards.length > 0 && updatedDeck.length === 0) {
      toast.info('Deck is now empty!');
    } else if (drawnCards.length > 0) {
      toast.info(`Drew ${drawnCards.length} card${drawnCards.length > 1 ? 's' : ''} from the deck`);
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error playing card:', error);
    toast.error('Failed to play card');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

export const drawCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  if (state.currentPlayerId !== state.playerId) {
    toast.error("It's not your turn!");
    return;
  }
  
  if (state.deck.length === 0) {
    toast.error("No cards left in the deck!");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const updatedDeck = [...state.deck];
    const card = updatedDeck.pop()!;
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    const updatedHand = [...player.hand, card];
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    const nextIndex = (playerIndex + 1) % state.players.length;
    const nextPlayerId = state.players[nextIndex].id;
    
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        deck: updatedDeck,
        current_player_id: nextPlayerId
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error drawing card:', error);
    toast.error('Failed to draw card');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
