
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { validateCardPlay, updateGameState } from './cardPlayUtils';

export const playFaceDownCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number
): Promise<void> => {
  const player = state.players.find(p => p.id === state.playerId);
  if (!player) return;
  
  const topCard = state.pile.length > 0 ? state.pile[state.pile.length - 1] : undefined;
  
  // Face down cards have special validation logic, as they're revealed when played
  const validation = validateCardPlay(
    player,
    cardIndex,
    'faceDown',
    topCard,
    () => ({ valid: true }), // No validation for face down cards until they're revealed
    dispatch
  );
  
  if (!validation.isValid) return;
  
  const cardToPlay = validation.cardToPlay!;
  const updatedFaceDownCards = validation.updatedCards!;
  
  // Special handling for face down cards when a 3 is on top
  if (topCard && topCard.rank === '3' && cardToPlay.rank !== '3') {
    toast.error("You drew a " + cardToPlay.rank + " of " + cardToPlay.suit + " but needed a 3. Pick up the pile!");
    
    // Pick up the pile as a penalty and add the revealed card
    const updatedHand = [...state.pile, cardToPlay];
    
    const { error: playerError } = await supabase
      .from('players')
      .update({ 
        hand: updatedHand,
        face_down_cards: updatedFaceDownCards
      })
      .eq('id', player.id)
      .eq('game_id', state.gameId);
      
    if (playerError) throw playerError;
    
    // Clear the pile
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        pile: [],
        current_player_id: state.players[(state.players.findIndex(p => p.id === state.currentPlayerId) + 1) % state.players.length].id
      })
      .eq('id', state.gameId);
      
    if (gameError) throw gameError;
    
    toast.info(`${player.name} picked up the pile as a penalty!`);
    dispatch({ type: 'SET_LOADING', isLoading: false });
    return;
  }
  
  // Update game state
  await updateGameState(
    dispatch,
    state,
    player,
    cardToPlay,
    null,
    updatedFaceDownCards,
    'faceDown'
  );
};
