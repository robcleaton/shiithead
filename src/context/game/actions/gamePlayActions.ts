
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue, Rank, Player } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

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
    
    // Handle both single card and multiple cards
    const cardIndices = Array.isArray(cardIndex) ? cardIndex : [cardIndex];
    
    // Sort indices in descending order to remove cards correctly
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    
    // Verify all cards have the same rank
    const cards = sortedIndices.map(index => player.hand[index]);
    const firstCardRank = cards[0]?.rank;
    const allSameRank = cards.every(card => card.rank === firstCardRank);
    
    if (!allSameRank) {
      toast.error("All cards must have the same rank!");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Check if there's a 3 on top and the player isn't playing a 3
    if (state.pile.length > 0) {
      const topCard = state.pile[state.pile.length - 1];
      
      if (topCard.rank === '3' && firstCardRank !== '3') {
        toast.error("You must play a 3 or pick up the pile!");
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    }
    
    // For a single card, check against the top card
    if (sortedIndices.length === 1) {
      const cardToPlay = player.hand[sortedIndices[0]];
      
      if (state.pile.length > 0) {
        const topCard = state.pile[state.pile.length - 1];
        
        const specialCards = ['2', '3', '7', '8', '10'];
        const cardRank = cardToPlay.rank;
        const rankValues: Record<Rank, number> = {
          'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, 
          '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
        };
        
        // Special case for 2: any card can be played on it
        if (topCard.rank === '2') {
          // Allow any card to be played on a 2
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
          // Check if the card being played is higher ranked than the top card
          // This now properly handles Ace as the highest card since we defined rankValues with A=14
          if (rankValues[cardRank] <= rankValues[topCard.rank]) {
            toast.error("Invalid move! Card must be higher ranked than the top card or be a special card (2, 3, 7, 8, 10).");
            dispatch({ type: 'SET_LOADING', isLoading: false });
            return;
          }
        }
      }
    } else {
      // For multiple cards, check against the top card
      const cardToPlay = player.hand[sortedIndices[0]];
      
      if (state.pile.length > 0) {
        const topCard = state.pile[state.pile.length - 1];
        
        // Special case for 2: any card can be played on it
        if (topCard.rank === '2') {
          // Allow any card to be played on a 2
          console.log("Any card can be played on a 2");
        }
        else if (cardToPlay.rank !== '2' && cardToPlay.rank !== '3' && cardToPlay.rank !== '8' && cardToPlay.rank !== '10' && cardToPlay.rank !== topCard.rank) {
          toast.error("When playing multiple cards, they must match the top card's rank or be special cards.");
          dispatch({ type: 'SET_LOADING', isLoading: false });
          return;
        }
      }
    }
    
    // Get the cards to play
    const cardsToPlay = cardIndices.map(index => player.hand[index]);
    
    // Remove the cards from the player's hand
    const updatedHand = [...player.hand];
    for (const index of sortedIndices) {
      updatedHand.splice(index, 1);
    }
    
    // Draw cards to bring hand up to 3 if possible
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
    
    // Update the pile based on the cards played
    let updatedPile: CardValue[] = [];
    
    // If any card is a 10, the pile is completely removed (burned)
    // Only the played 10 cards are added to form a new pile
    if (cardsToPlay.some(card => card.rank === '10')) {
      // The pile is completely burned (removed from the game)
      // Only the cards just played will start a new pile
      updatedPile = cardsToPlay;
    } else {
      updatedPile = [...state.pile, ...cardsToPlay];
    }
    
    // Determine the next player
    const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
    let nextIndex = currentPlayerIndex;
    
    // If any card is a 2 or 10, current player gets another turn
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
    
    // Show appropriate messages based on the cards played
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
  
  // Check if there's a 3 on top and the player isn't playing a 3
  if (state.pile.length > 0) {
    const topCard = state.pile[state.pile.length - 1];
    
    if (topCard.rank === '3') {
      // Instead of drawing a card, pickup the pile
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

// New function to handle picking up the pile (when a 3 is on top)
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
    
    // Add the pile to the player's hand
    const updatedHand = [...player.hand, ...state.pile];
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ hand: updatedHand })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    // Move to the next player
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

// New function to determine if a player is an AI player (test player)
export const isAIPlayer = (player: Player): boolean => {
  // We consider test players as AI players - they were added via the addTestPlayer function
  // This is a simple heuristic - we're assuming any player that was added as a test
  // should be controlled by AI
  return player.name.includes('Test') || player.name.includes('AI');
};

// AI logic to select and play cards on its turn
export const handleAIPlayerTurn = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  try {
    if (!state.currentPlayerId) return;
    
    const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
    if (!currentPlayer || !isAIPlayer(currentPlayer)) return;
    
    console.log(`AI player ${currentPlayer.name} is taking their turn`);
    
    // Add a small delay to make the AI turn more natural
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get the top card of the pile
    const topCard = state.pile.length > 0 ? state.pile[state.pile.length - 1] : null;
    
    // Create a ranking system for cards
    const rankValues: Record<Rank, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, 
      '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    
    // Special cards have unique effects
    const specialCards = ['2', '3', '7', '8', '10'];
    
    // First, check if there's a 3 on top - must play a 3 or pick up pile
    if (topCard?.rank === '3') {
      // Find any 3s in hand
      const threeIndices = currentPlayer.hand
        .map((card, index) => card.rank === '3' ? index : -1)
        .filter(index => index !== -1);
      
      if (threeIndices.length > 0) {
        // Play a 3
        await playCard(dispatch, state, threeIndices[0]);
      } else {
        // Must pick up the pile
        await pickupPile(dispatch, state);
      }
      return;
    }
    
    // Look for special cards to play strategically
    // First try to play a 10 (clears the pile)
    const tenIndices = currentPlayer.hand
      .map((card, index) => card.rank === '10' ? index : -1)
      .filter(index => index !== -1);
    
    if (tenIndices.length > 0) {
      await playCard(dispatch, state, tenIndices[0]);
      return;
    }
    
    // If no 10, look for a 2 (gives another turn)
    const twoIndices = currentPlayer.hand
      .map((card, index) => card.rank === '2' ? index : -1)
      .filter(index => index !== -1);
    
    if (twoIndices.length > 0) {
      await playCard(dispatch, state, twoIndices[0]);
      return;
    }
    
    // For regular play, find valid cards to play based on top card
    if (topCard) {
      // After a 7, can only play 7 or lower
      const sevenRestriction = topCard.rank === '7';
      
      // Find valid cards to play
      const playableCards = currentPlayer.hand.map((card, index) => {
        if (specialCards.includes(card.rank)) {
          return { card, index, value: rankValues[card.rank] };
        }
        
        if (sevenRestriction) {
          // After a 7, can only play 7 or lower (except special cards)
          if (rankValues[card.rank] <= 7) {
            return { card, index, value: rankValues[card.rank] };
          }
        } else if (rankValues[card.rank] > rankValues[topCard.rank]) {
          // Otherwise card must be higher rank
          return { card, index, value: rankValues[card.rank] };
        }
        
        return null;
      }).filter(item => item !== null) as { card: CardValue, index: number, value: number }[];
      
      // Sort by rank (highest first)
      playableCards.sort((a, b) => b.value - a.value);
      
      if (playableCards.length > 0) {
        // Play the highest valid card
        await playCard(dispatch, state, playableCards[0].index);
        return;
      }
    } else {
      // No cards in the pile yet, play the highest card
      if (currentPlayer.hand.length > 0) {
        const sortedHand = [...currentPlayer.hand]
          .map((card, index) => ({ card, index, value: rankValues[card.rank] }))
          .sort((a, b) => b.value - a.value);
        
        await playCard(dispatch, state, sortedHand[0].index);
        return;
      }
    }
    
    // If no playable cards, draw a card
    await drawCard(dispatch, state);
    
  } catch (error) {
    console.error('Error in AI player turn:', error);
    // Move to next player if there's an error
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
