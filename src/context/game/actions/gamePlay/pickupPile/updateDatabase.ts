
import { supabase } from "@/integrations/supabase/client";
import { CardValue } from '@/types/game';

export const updateDatabase = async (
  playerId: string,
  gameId: string,
  finalHand: CardValue[],
  nextPlayerId: string
): Promise<void> => {
  // 1. Update the player's hand in the database
  const { error: playerError } = await supabase
    .from('players')
    .update({ hand: finalHand })
    .eq('id', playerId)
    .eq('game_id', gameId);
    
  if (playerError) {
    console.error('Error updating player hand:', playerError);
    throw playerError;
  }
  
  // 2. Clear the pile and update next player in database
  const { error: gameError } = await supabase
    .from('games')
    .update({ 
      pile: [],
      current_player_id: nextPlayerId
    })
    .eq('id', gameId);
    
  if (gameError) {
    console.error('Error updating game state:', gameError);
    throw gameError;
  }
};
