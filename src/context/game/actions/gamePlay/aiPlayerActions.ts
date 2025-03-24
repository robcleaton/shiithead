
import { GameState, CardValue, Player } from '@/types/game';
import { Dispatch } from 'react';
import { playCard } from './playCard';
import { drawCard } from './drawCard';
import { getCardRankValue } from './utils';

// Helper function to identify AI players
export const isAIPlayer = (playerId: string) => {
  return playerId.startsWith('ai-');
};

const findBestCard = (player: Player, topCard: CardValue | null): number | null => {
  if (!player || !player.hand || !topCard) return null;
  
  // If pile is empty or top card is a special card (2, 7, 10, etc), play any card
  if (topCard.rank === '2' || topCard.rank === '10') {
    return 0; // Play the first card in hand
  }

  // Look for cards of same rank as the top card (pairs, triples, etc.)
  const sameRankCards = player.hand
    .map((card, index) => ({ card, index }))
    .filter(item => item.card.rank === topCard.rank);
  
  if (sameRankCards.length > 0) {
    return sameRankCards[0].index;
  }

  // Look for special cards that can be played on any card
  const specialCards = player.hand
    .map((card, index) => ({ card, index }))
    .filter(item => ['2', '10'].includes(item.card.rank));
  
  if (specialCards.length > 0) {
    return specialCards[0].index;
  }

  // Look for cards with higher rank
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

  // No playable card found
  return null;
};

// Check if the card is a 7 or lower
const isSevenOrLower = (card: CardValue): boolean => {
  const rankValue = getCardRankValue(card.rank);
  return rankValue <= getCardRankValue('7');
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
    
    if (aiPlayer.hand.length > 0) {
      const bestCardIndex = findBestCard(aiPlayer, topCard);
      
      if (bestCardIndex !== null) {
        playCard(dispatch, state, bestCardIndex);
        return;
      }
    } 
    else if (aiPlayer.faceUpCards.length > 0) {
      // Play face up cards if hand is empty
      playCard(dispatch, state, 0);
      return;
    } 
    else if (aiPlayer.faceDownCards.length > 0) {
      // Play face down cards if both hand and face up cards are empty
      playCard(dispatch, state, 0);
      return;
    }
    
    // If AI couldn't play a card, draw from the deck
    drawCard(dispatch, state);
  }, 1500); // 1.5 second delay for AI actions
};
