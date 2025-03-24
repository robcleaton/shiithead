import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue, Rank, Player } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

const rankValues: Record<Rank, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, 
  '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
};

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
        
        const specialCards = ['2', '3', '7', '8', '10'];
        const cardRank = cardToPlay.rank;
        
        if (topCard.rank === '2') {
          console.log("Any card can be played on a 2");
        }
        else if (topCard.rank === '7' && !specialCards.includes(cardRank) && rankValues[cardRank] > 7) {
          toast.error("After a 7 is played, you must play a card of rank 7 or lower!");
          dispatch({ type: 'SET_LOADING', isLoading: false });
          return;
        }
        else if (cardToPlay.rank === '10' && topCard.rank === '7') {
          toast.error("Cannot play a 10 on top of a 7!");
          dispatch({ type: 'SET_LOADING', isLoading: false });
          return;
        }
        else if (!specialCards.includes(cardRank) && cardRank !== topCard.rank) {
          if (rankValues[cardRank] <= rankValues[topCard.rank]) {
            toast.error("Invalid move! Card must be higher ranked than the top card or be a special card (2, 3, 7, 8, 10).");
            dispatch({ type: 'SET_LOADING', isLoading: false });
            return;
          }
        }
      }
    } else {
      const cardToPlay = player.hand[sortedIndices[0]];
      
      if (state.pile.length > 0) {
        const topCard = state.pile[state.pile.length - 1];
        
        if (topCard.rank === '2') {
          console.log("Any card can be played on a 2");
        }
        else if (topCard.rank === '7' && cardToPlay.rank !== '7' && cardToPlay.rank !== '2' && cardToPlay.rank !== '3' && cardToPlay.rank !== '8' && rankValues[cardToPlay.rank] > 7) {
          toast.error("After a 7 is played, you must play a card of rank 7 or lower, or a special card!");
          dispatch({ type: 'SET_LOADING', isLoading: false });
          return;
        }
        else if (cardToPlay.rank !== '2' && cardToPlay.rank !== '3' && cardToPlay.rank !== '8' && cardToPlay.rank !== '10' && cardToPlay.rank !== topCard.rank) {
          toast.error("When playing multiple cards, they must match the top card's rank or be special cards.");
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
    
    if (cardsToPlay.some(card => card.rank === '10')) {
      updatedPile = cardsToPlay;
    } else {
      updatedPile = [...state.pile, ...cardsToPlay];
    }
    
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    let nextIndex = currentPlayerIndex;
    
    if (cardsToPlay.some(card => card.rank === '2' || card.rank === '10')) {
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
    
    if (cardsToPlay.length > 1) {
      toast.success(`${player.name} played ${cardsToPlay.length} ${cardsToPlay[0].rank}s!`);
    } else {
      if (cardsToPlay[0].rank === '2') {
        toast.success(`${player.name} played a 2 - they get another turn!`);
      } else if (cardsToPlay[0].rank === '3') {
        toast.success(`${player.name} played a 3 - next player must pick up the pile or play a 3!`);
      } else if (cardsToPlay[0].rank === '7') {
        toast.success(`${player.name} played a 7 - the next player must play a card of rank 7 or lower!`);
      } else if (cardsToPlay[0].rank === '10') {
        toast.success(`${player.name} played a 10 - the pile has been burned! ${player.name} gets another turn.`);
      }
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
  
  if (state.pile.length > 0) {
    const topCard = state.pile[state.pile.length - 1];
    
    if (topCard.rank === '3') {
      await pickupPile(dispatch, state);
      return;
    }
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
    
    toast.info(`${player.name} drew a card.`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error drawing card:', error);
    toast.error('Failed to draw card');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

export const pickupPile = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  if (state.currentPlayerId !== state.playerId) {
    toast.error("It's not your turn!");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const player = state.players.find(p => p.id === state.playerId);
    if (!player) return;
    
    const updatedHand = [...player.hand, ...state.pile];
    
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
        pile: [],
        current_player_id: nextPlayerId
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    toast.info(`${player.name} picked up the pile (${state.pile.length} cards).`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error picking up pile:', error);
    toast.error('Failed to pick up pile');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

export const isAIPlayer = (player: Player): boolean => {
  return player.name.includes('Test') || player.name.includes('AI');
};

export const handleAIPlayerTurn = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  try {
    if (!state.currentPlayerId) return;
    
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || !isAIPlayer(currentPlayer)) return;
    
    console.log(`AI player ${currentPlayer.name} is taking their turn`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const topCard = state.pile.length > 0 ? state.pile[state.pile.length - 1] : null;
    
    const specialCards = ['2', '3', '7', '8', '10'];
    
    if (topCard?.rank === '3') {
      const threeIndices = currentPlayer.hand
        .map((card, index) => card.rank === '3' ? index : -1)
        .filter(index => index !== -1);
      
      if (threeIndices.length > 0) {
        await playCard(dispatch, state, threeIndices[0]);
      } else {
        await pickupPile(dispatch, state);
      }
      return;
    }
    
    if (topCard?.rank === '7') {
      const validCards = currentPlayer.hand
        .map((card, index) => {
          if (['2', '3', '8'].includes(card.rank) || rankValues[card.rank] <= 7) {
            return { card, index, value: rankValues[card.rank] };
          }
          return null;
        })
        .filter(item => item !== null) as { card: CardValue, index: number, value: number }[];
      
      if (validCards.length > 0) {
        validCards.sort((a, b) => b.value - a.value);
        await playCard(dispatch, state, validCards[0].index);
        return;
      }
      
      await drawCard(dispatch, state);
      return;
    }
    
    const tenIndices = currentPlayer.hand
      .map((card, index) => card.rank === '10' ? index : -1)
      .filter(index => index !== -1);
    
    if (tenIndices.length > 0) {
      await playCard(dispatch, state, tenIndices[0]);
      return;
    }
    
    const twoIndices = currentPlayer.hand
      .map((card, index) => card.rank === '2' ? index : -1)
      .filter(index => index !== -1);
    
    if (twoIndices.length > 0) {
      await playCard(dispatch, state, twoIndices[0]);
      return;
    }
    
    if (topCard) {
      const sevenRestriction = topCard.rank === '7';
      
      const playableCards = currentPlayer.hand.map((card, index) => {
        if (specialCards.includes(card.rank)) {
          return { card, index, value: rankValues[card.rank] };
        }
        
        if (sevenRestriction) {
          if (rankValues[card.rank] <= rankValues['7']) {
            return { card, index, value: rankValues[card.rank] };
          }
        } else if (rankValues[card.rank] > rankValues[topCard.rank]) {
          return { card, index, value: rankValues[card.rank] };
        }
        
        return null;
      }).filter(item => item !== null) as { card: CardValue, index: number, value: number }[];
      
      playableCards.sort((a, b) => b.value - a.value);
      
      if (playableCards.length > 0) {
        await playCard(dispatch, state, playableCards[0].index);
        return;
      }
    } else {
      if (currentPlayer.hand.length > 0) {
        const sortedHand = [...currentPlayer.hand]
          .map((card, index) => ({ card, index, value: rankValues[card.rank] }))
          .sort((a, b) => b.value - a.value);
        
        await playCard(dispatch, state, sortedHand[0].index);
        return;
      }
    }
    
    await drawCard(dispatch, state);
    
  } catch (error) {
    console.error('Error in AI player turn:', error);
    const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    const nextIndex = (playerIndex + 1) % state.players.length;
    const nextPlayerId = state.players[nextIndex].id;
    
    try {
      await supabase
        .from('games')
        .update({ current_player_id: nextPlayerId })
        .eq('id', state.gameId);
    } catch (err) {
      console.error('Error moving to next player after AI error:', err);
    }
  }
};
