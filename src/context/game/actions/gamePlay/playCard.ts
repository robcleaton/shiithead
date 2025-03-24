
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { validateSingleCardPlay, validateMultipleCardsPlay } from './cardValidation';

export const playCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number | number[]
) => {
  if (state.currentPlayerId !== state.playerId) {
    toast.error("It's not your turn!");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    const cardIndices = Array.isArray(cardIndex) ? cardIndex : [cardIndex];
    
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    
    const cards = sortedIndices.map(index => player.hand[index]);
    const firstCardRank = cards[0]?.rank;
    const allSameRank = cards.every(card => card.rank === firstCardRank);
    
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
    
    const cardsToPlay = cardIndices.map(index => player.hand[index]);
    
    const updatedHand = [...player.hand];
    for (const index of sortedIndices) {
      updatedHand.splice(index, 1);
    }
    
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
    
    // Implemented 10 as a burn card - clear the pile and only add the 10s played
    const isBurnCard = cardsToPlay.some(card => card.rank === '10');
    if (isBurnCard) {
      // Only the 10s go to the pile - it's a fresh pile after a burn
      updatedPile = cardsToPlay;
      toast.success(`${player.name} played a 10 - the pile has been burned! ${player.name} gets another turn.`);
    } else {
      updatedPile = [...state.pile, ...cardsToPlay];
    }
    
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    let nextPlayerId = state.currentPlayerId;
    
    // If it's a 2 or 10, the current player gets another turn
    if (!cardsToPlay.some(card => card.rank === '2' || card.rank === '10')) {
      const nextIndex = (currentPlayerIndex + 1) % state.players.length;
      nextPlayerId = state.players[nextIndex].id;
    }
    
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
    
    if (cardsToPlay.length > 1) {
      toast.success(`${player.name} played ${cardsToPlay.length} ${cardsToPlay[0].rank}s!`);
    } else {
      if (cardsToPlay[0].rank === '2') {
        toast.success(`${player.name} played a 2 - they get another turn!`);
      } else if (cardsToPlay[0].rank === '3') {
        toast.success(`${player.name} played a 3 - next player must pick up the pile or play a 3!`);
      } else if (cardsToPlay[0].rank === '7') {
        toast.success(`${player.name} played a 7 - the next player must play a card of rank lower than 7!`);
      }
      // The 10 toast is now handled above, where the burn card logic is implemented
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
