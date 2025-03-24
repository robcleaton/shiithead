
import { GameState, CardValue, Player } from '@/types/game';
import { Dispatch } from 'react';
import { playCard } from './playCard';
import { drawCard } from './drawCard';
import { getCardRankValue } from './utils';

// Helper function to identify AI players
export const isAIPlayer = (playerId: string) => {
  return playerId.startsWith('ai-') || playerId.includes('Test');
};

const findBestCard = (player: Player, topCard: CardValue | null): number | null => {
  if (!player || !player.hand || !topCard) return null;
  
  // Special case: if playing face down cards, just play the first one
  if (player.hand.length === 0 && player.faceUpCards.length === 0 && player.faceDownCards.length > 0) {
    return 0;
  }
  
  // If playing face up cards
  if (player.hand.length === 0 && player.faceUpCards.length > 0) {
    // Find the best card among face up cards
    const playableFaceUpCards = player.faceUpCards
      .map((card, index) => ({ card, index }))
      .filter(item => {
        // Cards that can be played on any card
        if (item.card.rank === '2' || item.card.rank === '10') return true;
        
        // Check if this card can be played on top card
        if (!topCard) return true;
        
        const itemRankValue = getCardRankValue(item.card.rank);
        const topRankValue = getCardRankValue(topCard.rank);
        
        // Special handling for 7
        if (topCard.rank === '7') {
          return itemRankValue < topRankValue || 
                 item.card.rank === '2' || 
                 item.card.rank === '3' || 
                 item.card.rank === '8';
        }
        
        return itemRankValue >= topRankValue || item.card.rank === topCard.rank;
      });
    
    if (playableFaceUpCards.length > 0) {
      return playableFaceUpCards[0].index;
    }
    
    return 0; // Play the first face up card if nothing else works
  }
  
  // If pile is empty or top card is a special card (2, 10), play any card
  if (!topCard || topCard.rank === '2' || topCard.rank === '10') {
    return 0; // Play the first card in hand
  }

  // Look for cards of same rank as the top card (pairs, triples, etc.)
  const sameRankCards = player.hand
    .map((card, index) => ({ card, index }))
    .filter(item => item.card.rank === topCard.rank);
  
  if (sameRankCards.length > 0) {
    return sameRankCards[0].index;
  }

  // Special case for 7: need to play lower cards
  if (topCard.rank === '7') {
    const lowerRankCards = player.hand
      .map((card, index) => ({ card, index }))
      .filter(item => {
        const itemRankValue = getCardRankValue(item.card.rank);
        const topRankValue = getCardRankValue(topCard.rank);
        return itemRankValue < topRankValue || ['2', '3', '8'].includes(item.card.rank);
      });
    
    if (lowerRankCards.length > 0) {
      // Play the highest of the lower cards
      lowerRankCards.sort((a, b) => 
        getCardRankValue(b.card.rank) - getCardRankValue(a.card.rank)
      );
      return lowerRankCards[0].index;
    }
  }

  // Look for special cards that can be played on any card
  const specialCards = player.hand
    .map((card, index) => ({ card, index }))
    .filter(item => ['2', '3', '8', '10'].includes(item.card.rank));
  
  // Can't play 10 on a 7
  if (topCard.rank === '7') {
    const filteredSpecialCards = specialCards.filter(item => item.card.rank !== '10');
    if (filteredSpecialCards.length > 0) {
      return filteredSpecialCards[0].index;
    }
  } else if (specialCards.length > 0) {
    return specialCards[0].index;
  }

  // Look for cards with higher rank (except after a 7)
  if (topCard.rank !== '7') {
    const higherRankCards = player.hand
      .map((card, index) => ({ card, index }))
      .filter(item => {
        const itemRankValue = getCardRankValue(item.card.rank);
        const topRankValue = getCardRankValue(topCard.rank);
        return itemRankValue >= topRankValue;
      });
    
    if (higherRankCards.length > 0) {
      // Play the lowest card that's still higher than the top card
      higherRankCards.sort((a, b) => 
        getCardRankValue(a.card.rank) - getCardRankValue(b.card.rank)
      );
      return higherRankCards[0].index;
    }
  }

  // No playable card found
  return null;
};

// Check if multiple cards of the same rank can be played
const findMultipleCards = (player: Player, topCard: CardValue | null): number[] | null => {
  if (!player || !player.hand || player.hand.length < 2) return null;
  
  // Group cards by rank
  const cardsByRank: Record<string, number[]> = {};
  
  player.hand.forEach((card, index) => {
    if (!cardsByRank[card.rank]) {
      cardsByRank[card.rank] = [];
    }
    cardsByRank[card.rank].push(index);
  });
  
  // Find groups with more than one card
  const rankGroups = Object.entries(cardsByRank)
    .filter(([_, indices]) => indices.length > 1)
    .sort((a, b) => {
      // Prioritize by group size, then by rank
      if (a[1].length !== b[1].length) {
        return b[1].length - a[1].length; // Larger groups first
      }
      return getCardRankValue(b[0] as any) - getCardRankValue(a[0] as any); // Higher ranks first
    });
  
  if (rankGroups.length === 0) return null;
  
  // If no top card or top card is 2 or 10, play the largest group
  if (!topCard || topCard.rank === '2' || topCard.rank === '10') {
    return rankGroups[0][1];
  }
  
  // Special case for 7: need to play lower cards
  if (topCard.rank === '7') {
    for (const [rank, indices] of rankGroups) {
      const rankValue = getCardRankValue(rank as any);
      const topRankValue = getCardRankValue(topCard.rank);
      
      if (rankValue < topRankValue || rank === '2' || rank === '3' || rank === '8') {
        return indices;
      }
    }
  } else {
    // Find a group that can be played on the top card
    for (const [rank, indices] of rankGroups) {
      const rankValue = getCardRankValue(rank as any);
      const topRankValue = getCardRankValue(topCard.rank);
      
      if (rankValue >= topRankValue || rank === topCard.rank || rank === '2' || rank === '3' || rank === '8' || rank === '10') {
        return indices;
      }
    }
  }
  
  return null;
};

// Handle AI player turn
export const handleAIPlayerTurn = (dispatch: Dispatch<any>, state: GameState) => {
  if (!state.currentPlayerId || !isAIPlayer(state.currentPlayerId)) {
    return;
  }
  
  const aiPlayer = state.players.find(p => p.id === state.currentPlayerId);
  if (!aiPlayer) return;
  
  // Add small delay to make it feel more natural
  setTimeout(() => {
    const topCard = state.pile.length > 0 ? state.pile[state.pile.length - 1] : null;
    
    // Try to play multiple cards of the same rank
    const multipleCardIndices = findMultipleCards(aiPlayer, topCard);
    
    if (multipleCardIndices && multipleCardIndices.length > 1) {
      console.log(`AI player ${aiPlayer.name} is playing multiple cards:`, multipleCardIndices);
      playCard(dispatch, state, multipleCardIndices);
      return;
    }
    
    // Try to play a single card
    if (aiPlayer.hand.length > 0) {
      const bestCardIndex = findBestCard(aiPlayer, topCard);
      
      if (bestCardIndex !== null) {
        console.log(`AI player ${aiPlayer.name} is playing card at index:`, bestCardIndex);
        playCard(dispatch, state, bestCardIndex);
        return;
      }
    } 
    else if (aiPlayer.faceUpCards.length > 0) {
      // Play face up cards if hand is empty
      console.log(`AI player ${aiPlayer.name} is playing from face up cards`);
      playCard(dispatch, state, 0);
      return;
    } 
    else if (aiPlayer.faceDownCards.length > 0) {
      // Play face down cards if both hand and face up cards are empty
      console.log(`AI player ${aiPlayer.name} is playing a face down card`);
      playCard(dispatch, state, 0);
      return;
    }
    
    // If AI couldn't play a card, draw from the deck
    console.log(`AI player ${aiPlayer.name} is drawing a card`);
    drawCard(dispatch, state);
  }, 1500); // 1.5 second delay for AI actions
};
