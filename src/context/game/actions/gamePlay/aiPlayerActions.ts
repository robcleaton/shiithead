import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { validateSingleCardPlay } from './cardValidation';

export const isAIPlayer = (playerId: string): boolean => {
  return playerId.startsWith('ai-');
};

export const handleAIPlayerTurn = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  if (!state.currentPlayerId || !isAIPlayer(state.currentPlayerId)) {
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const aiPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!aiPlayer) return;
    
    console.log(`AI player ${aiPlayer.name} is thinking...`);
    
    // Check if the pile only contains 3s and AI can't play a 3
    if (state.pile.length > 0 && state.pile.every(card => card.rank === '3')) {
      const hasThree = aiPlayer.hand.some(card => card.rank === '3');
      
      if (!hasThree) {
        // AI player doesn't have any 3s, so skip their turn and reset the pile
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
        
        toast.info(`${aiPlayer.name} couldn't play a 3, so the pile has been reset and their turn is skipped.`);
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    }
    
    // First, check if we need to play from hand
    if (aiPlayer.hand.length > 0) {
      // If there's a 3 on top, we must play a 3 or pick up the pile
      if (state.pile.length > 0 && state.pile[state.pile.length - 1].rank === '3') {
        const threeIndices = aiPlayer.hand
          .map((card, index) => card.rank === '3' ? index : -1)
          .filter(index => index !== -1);
        
        if (threeIndices.length > 0) {
          // Play a 3
          await playAICard(dispatch, state, aiPlayer, threeIndices[0]);
          return;
        } else {
          // Pick up the pile
          await pickUpPileAI(dispatch, state, aiPlayer);
          return;
        }
      }
      
      // Try to find a valid card to play
      const topCard = state.pile.length > 0 ? state.pile[state.pile.length - 1] : null;
      
      // First, check for special cards (2, 10) which can be played on anything
      const specialCardIndices = aiPlayer.hand
        .map((card, index) => (card.rank === '2' || card.rank === '10') ? index : -1)
        .filter(index => index !== -1);
      
      if (specialCardIndices.length > 0) {
        // Prefer 10s over 2s
        const tenIndices = specialCardIndices.filter(index => aiPlayer.hand[index].rank === '10');
        if (tenIndices.length > 0) {
          await playAICard(dispatch, state, aiPlayer, tenIndices[0]);
          return;
        }
        
        await playAICard(dispatch, state, aiPlayer, specialCardIndices[0]);
        return;
      }
      
      // Check for other valid cards
      if (topCard) {
        // Try to find multiple cards of the same rank to play together
        const rankCounts: Record<string, number[]> = {};
        
        aiPlayer.hand.forEach((card, index) => {
          if (!rankCounts[card.rank]) {
            rankCounts[card.rank] = [];
          }
          rankCounts[card.rank].push(index);
        });
        
        // Find ranks with multiple cards
        const multipleCardRanks = Object.entries(rankCounts)
          .filter(([_, indices]) => indices.length > 1)
          .sort((a, b) => b[1].length - a[1].length); // Sort by count, descending
        
        // Check if any of these can be played
        for (const [rank, indices] of multipleCardRanks) {
          const cardToPlay = aiPlayer.hand[indices[0]];
          const isValid = validateSingleCardPlay(cardToPlay, topCard).valid;
          
          if (isValid) {
            // Play all cards of this rank
            await playMultipleAICards(dispatch, state, aiPlayer, indices);
            return;
          }
        }
        
        // If no multiples can be played, try single cards
        for (let i = 0; i < aiPlayer.hand.length; i++) {
          const card = aiPlayer.hand[i];
          const isValid = validateSingleCardPlay(card, topCard).valid;
          
          if (isValid) {
            await playAICard(dispatch, state, aiPlayer, i);
            return;
          }
        }
      } else {
        // No cards in pile, play any card (preferably multiples)
        const rankCounts: Record<string, number[]> = {};
        
        aiPlayer.hand.forEach((card, index) => {
          if (!rankCounts[card.rank]) {
            rankCounts[card.rank] = [];
          }
          rankCounts[card.rank].push(index);
        });
        
        // Find ranks with multiple cards
        const multipleCardRanks = Object.entries(rankCounts)
          .filter(([_, indices]) => indices.length > 1)
          .sort((a, b) => b[1].length - a[1].length); // Sort by count, descending
        
        if (multipleCardRanks.length > 0) {
          await playMultipleAICards(dispatch, state, aiPlayer, multipleCardRanks[0][1]);
          return;
        }
        
        // Play the first card
        await playAICard(dispatch, state, aiPlayer, 0);
        return;
      }
    }
    
    // If we get here, we couldn't play a card, so draw
    await drawCardAI(dispatch, state, aiPlayer);
    
  } catch (error) {
    console.error('Error in AI player turn:', error);
    toast.error('Error during AI turn');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

const playAICard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  aiPlayer: any,
  cardIndex: number
) => {
  try {
    const cardToPlay = aiPlayer.hand[cardIndex];
    console.log(`AI player ${aiPlayer.name} is playing ${cardToPlay.rank} of ${cardToPlay.suit}`);
    
    const updatedHand = [...aiPlayer.hand];
    updatedHand.splice(cardIndex, 1);
    
    // Draw cards if needed
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
      .eq('id', aiPlayer.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    let updatedPile: CardValue[] = [];
    
    // 10 is a burn card
    if (cardToPlay.rank === '10') {
      updatedPile = [];
    } else {
      updatedPile = [...state.pile, cardToPlay];
    }
    
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    let nextPlayerId = state.currentPlayerId;
    
    // If it's a 2 or 10, the current player gets another turn
    if (cardToPlay.rank !== '2' && cardToPlay.rank !== '10') {
      const nextIndex = (currentPlayerIndex + 1) % state.players.length;
      nextPlayerId = state.players[nextIndex].id;
    }
    
    const gameOver = finalHand.length === 0 && aiPlayer.faceUpCards.length === 0 && aiPlayer.faceDownCards.length === 0;
    
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
      toast.success(`${aiPlayer.name} played a 2 - they get another turn!`);
    } else if (cardToPlay.rank === '3') {
      toast.success(`${aiPlayer.name} played a 3 - next player must pick up the pile or play a 3!`);
    } else if (cardToPlay.rank === '7') {
      toast.success(`${aiPlayer.name} played a 7 - the next player must play a card of rank lower than 7!`);
    } else if (cardToPlay.rank === '10') {
      toast.success(`${aiPlayer.name} played a 10 - the entire discard pile has been removed from the game! ${aiPlayer.name} gets another turn.`);
    } else {
      toast.success(`${aiPlayer.name} played ${cardToPlay.rank} of ${cardToPlay.suit}`);
    }
    
    if (gameOver) {
      toast.success(`${aiPlayer.name} has won the game!`);
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error playing AI card:', error);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

const playMultipleAICards = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  aiPlayer: any,
  cardIndices: number[]
) => {
  try {
    const cardsToPlay = cardIndices.map(index => aiPlayer.hand[index]);
    console.log(`AI player ${aiPlayer.name} is playing ${cardsToPlay.length} ${cardsToPlay[0].rank}s`);
    
    const updatedHand = [...aiPlayer.hand];
    
    // Remove cards in reverse order to avoid index shifting
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    for (const index of sortedIndices) {
      updatedHand.splice(index, 1);
    }
    
    // Draw cards if needed
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
      .eq('id', aiPlayer.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    let updatedPile: CardValue[] = [];
    
    // 10 is a burn card
    if (cardsToPlay[0].rank === '10') {
      updatedPile = [];
    } else {
      updatedPile = [...state.pile, ...cardsToPlay];
    }
    
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    let nextPlayerId = state.currentPlayerId;
    
    // If it's a 2 or 10, the current player gets another turn
    if (cardsToPlay[0].rank !== '2' && cardsToPlay[0].rank !== '10') {
      const nextIndex = (currentPlayerIndex + 1) % state.players.length;
      nextPlayerId = state.players[nextIndex].id;
    }
    
    const gameOver = finalHand.length === 0 && aiPlayer.faceUpCards.length === 0 && aiPlayer.faceDownCards.length === 0;
    
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
    
    toast.success(`${aiPlayer.name} played ${cardsToPlay.length} ${cardsToPlay[0].rank}s!`);
    
    if (gameOver) {
      toast.success(`${aiPlayer.name} has won the game!`);
    }
    
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error playing multiple AI cards:', error);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

const drawCardAI = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  aiPlayer: any
) => {
  try {
    if (state.deck.length === 0) {
      console.log(`AI player ${aiPlayer.name} can't draw (deck empty)`);
      
      // Skip turn
      const playerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
      const nextIndex = (playerIndex + 1) % state.players.length;
      const nextPlayerId = state.players[nextIndex].id;
      
      const { error: gameError } = await supabase
        .from('games')
        .update({ current_player_id: nextPlayerId })
        .eq('id', state.gameId);
        
      if (gameError) throw gameError;
      
      toast.info(`${aiPlayer.name} skipped their turn (deck is empty).`);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    console.log(`AI player ${aiPlayer.name} is drawing a card`);
    
    const updatedDeck = [...state.deck];
    const drawnCard = updatedDeck.pop();
    
    if (!drawnCard) {
      throw new Error("Failed to draw a card!");
    }
    
    const updatedHand = [...aiPlayer.hand, drawnCard];
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', aiPlayer.id)
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
    
    toast.info(`${aiPlayer.name} drew a card.`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error drawing AI card:', error);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

const pickUpPileAI = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  aiPlayer: any
) => {
  try {
    console.log(`AI player ${aiPlayer.name} is picking up the pile`);
    
    const updatedHand = [...aiPlayer.hand, ...state.pile];
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', aiPlayer.id)
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
    
    toast.info(`${aiPlayer.name} picked up the pile (${state.pile.length} cards).`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  } catch (error) {
    console.error('Error picking up pile for AI:', error);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
