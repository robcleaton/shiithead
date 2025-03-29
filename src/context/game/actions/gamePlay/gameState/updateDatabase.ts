
import { supabase } from "@/integrations/supabase/client";
import { GameState, Player, CardValue } from '@/types/game';

// Function to update the database with game changes
export const updateDatabase = async (
  state: GameState,
  player: Player,
  updatedHand: CardValue[],
  updatedFaceUpCards: CardValue[] | null,
  updatedFaceDownCards: CardValue[] | null,
  updatedPile: CardValue[],
  updatedDeck: CardValue[],
  nextPlayerId: string,
  gameOver: boolean
): Promise<void> => {
  // Prepare player update payload
  const playerUpdatePayload: any = {};
  
  // Always update the hand if we've modified it
  if (updatedHand !== player.hand) {
    playerUpdatePayload.hand = updatedHand;
  }
  
  if (updatedFaceUpCards !== null) {
    playerUpdatePayload.face_up_cards = updatedFaceUpCards;
  }
  
  if (updatedFaceDownCards !== null) {
    playerUpdatePayload.face_down_cards = updatedFaceDownCards;
  }
  
  // Only update if there are changes
  if (Object.keys(playerUpdatePayload).length > 0) {
    // Update player state
    const { error: playerError } = await supabase
      .from('players')
      .update(playerUpdatePayload)
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
  }
  
  // Update game state
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
};
