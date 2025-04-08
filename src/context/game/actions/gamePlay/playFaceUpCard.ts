
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { validateSingleCardPlay } from './cardValidation';
import { validateCardPlay } from './cardValidationUtils';
import { updateGameState } from './updateGameStateUtils';

export const playFaceUpCard = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  cardIndex: number
): Promise<void> => {
  const player = state.players.find(p => p.id === state.playerId);
  if (!player) return;
  
  const topCard = state.pile.length > 0 ? state.pile[state.pile.length - 1] : undefined;
  
  // Validate the card play
  const validation = validateCardPlay(
    player,
    cardIndex,
    'faceUp',
    topCard,
    validateSingleCardPlay,
    dispatch
  );
  
  if (!validation.isValid) return;
  
  // Check if this is the last face up card and player has face down cards
  const isLastFaceUpCard = player.faceUpCards.length === 1;
  const hasFaceDownCards = player.faceDownCards.length > 0;
  
  // Update game state
  await updateGameState(
    dispatch,
    state,
    player,
    validation.cardToPlay!,
    validation.updatedCards!,
    isLastFaceUpCard && hasFaceDownCards ? [] : null,
    'faceUp'
  );
};
