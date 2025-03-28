
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { createDeck, cardToString, verifyGameCards } from '@/utils/gameUtils';
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
    
    // Use a Set to track which cards have been dealt
    const dealtCardIds = new Set<string>();
    
    // Create objects to store player cards
    const hands: Record<string, CardValue[]> = {};
    const faceDownCards: Record<string, CardValue[]> = {};
    const updatedDeck = [...deck];
    
    let cardsDealt = 0;
    
    // Deal cards to players
    for (const player of state.players) {
      // Deal 3 face down cards first
      const faceDown: CardValue[] = [];
      for (let i = 0; i < 3; i++) {
        if (updatedDeck.length > 0) {
          const card = updatedDeck.pop()!;
          const cardId = cardToString(card);
          
          // Extra check to prevent duplicates
          if (dealtCardIds.has(cardId)) {
            console.error(`Duplicate card detected during deal: ${cardId}`);
            i--; // Try again
            continue;
          }
          
          dealtCardIds.add(cardId);
          faceDown.push({...card}); // Create a new card object
          cardsDealt++;
        }
      }
      faceDownCards[player.id] = faceDown;
      
      // Then deal 6 cards to hand
      const hand: CardValue[] = [];
      for (let i = 0; i < 6 && updatedDeck.length > 0; i++) {
        const card = updatedDeck.pop()!;
        const cardId = cardToString(card);
        
        // Extra check to prevent duplicates
        if (dealtCardIds.has(cardId)) {
          console.error(`Duplicate card detected during deal: ${cardId}`);
          i--; // Try again
          continue;
        }
        
        dealtCardIds.add(cardId);
        hand.push({...card}); // Create a new card object
        cardsDealt++;
      }
      hands[player.id] = hand;
      
      console.log(`Dealt ${faceDown.length} face down cards and ${hand.length} hand cards to player ${player.name}`);
    }
    
    console.log(`Total cards dealt: ${cardsDealt}, remaining in deck: ${updatedDeck.length}`);
    console.log(`Unique card IDs dealt: ${dealtCardIds.size}`);
    
    // Verify no duplicates across all areas
    const allPlayerHands = Object.values(hands);
    const allFaceDownCards = Object.values(faceDownCards);
    const combinedPlayerCards = [...allPlayerHands, ...allFaceDownCards].flat();
    const uniqueCardIdsAfterDeal = new Set(combinedPlayerCards.map(cardToString));
    
    console.log(`Unique cards after deal: ${uniqueCardIdsAfterDeal.size} out of ${combinedPlayerCards.length} total cards`);
    
    if (uniqueCardIdsAfterDeal.size !== combinedPlayerCards.length) {
      console.error('CRITICAL: Duplicate cards detected after dealing!');
      toast.error('Game setup error: duplicate cards detected');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    // Update game in database
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        setup_phase: true,
        deck: updatedDeck
      })
      .eq('id', state.gameId);
      
    if (gameError) {
      console.error('Error updating game:', gameError);
      toast.error('Failed to start game');
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    console.log('Updated game with setup_phase=true and deck');
    
    // Update each player in database
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
        toast.error('Failed to start game');
        dispatch({ type: 'SET_LOADING', isLoading: false });
        return;
      }
    }
    
    // Update local state
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
