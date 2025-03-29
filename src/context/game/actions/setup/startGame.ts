
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { createDeck } from '@/utils/gameUtils';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

export const startGame = async (
  dispatch: Dispatch<GameAction>,
  state: GameState
) => {
  if (state.players.length < 2) {
    toast.error("You need at least 2 players to start the game");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    console.log('Starting game with players:', state.players);
    
    const deck = createDeck();
    console.log('Created deck with', deck.length, 'cards');
    
    const hands: Record<string, CardValue[]> = {};
    const faceDownCards: Record<string, CardValue[]> = {};
    const updatedDeck = [...deck];
    
    for (const player of state.players) {
      const faceDown = [];
      for (let i = 0; i < 3; i++) {
        if (updatedDeck.length > 0) {
          faceDown.push(updatedDeck.pop()!);
        }
      }
      faceDownCards[player.id] = faceDown;
      
      const hand = [];
      for (let i = 0; i < 6; i++) {
        if (updatedDeck.length > 0) {
          hand.push(updatedDeck.pop()!);
        }
      }
      hands[player.id] = hand;
      
      console.log(`Dealt ${faceDown.length} face down cards and ${hand.length} hand cards to player ${player.name}`);
    }
    
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        setup_phase: true,
        deck: updatedDeck
      })
      .eq('id', state.gameId);
      
    if (gameError) {
      console.error('Error updating game:', gameError);
      throw gameError;
    }
    
    console.log('Updated game with setup_phase=true and deck');
    
    for (const player of state.players) {
      console.log(`Updating player ${player.name} with cards:`, {
        hand: hands[player.id],
        face_down_cards: faceDownCards[player.id]
      });
      
      const { error: playerError } = await supabase
        .from('players')
        .update({ 
          hand: hands[player.id],
          face_down_cards: faceDownCards[player.id],
          face_up_cards: [],
          is_ready: false
        })
        .eq('id', player.id)
        .eq('game_id', state.gameId);
        
      if (playerError) {
        console.error('Error updating player:', playerError);
        throw playerError;
      }
    }
    
    dispatch({ type: 'SET_GAME_STATE', gameState: { setupPhase: true } });
    dispatch({ type: 'DEAL_CARDS' });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success('Setup phase started! Select 3 cards to place face-up');
  } catch (error) {
    console.error('Error starting game:', error);
    toast.error('Failed to start game');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
