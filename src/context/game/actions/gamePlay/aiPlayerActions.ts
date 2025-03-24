
import { supabase } from "@/integrations/supabase/client";
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { isAIPlayer, rankValues } from './utils';
import { playCard } from './playCard';
import { drawCard } from './drawCard';
import { pickupPile } from './pickupPile';

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
          if (['2', '3', '8'].includes(card.rank) || rankValues[card.rank] <= rankValues['7']) {
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
