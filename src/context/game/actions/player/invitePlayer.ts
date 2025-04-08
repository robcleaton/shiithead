
import { toast } from 'sonner';
import { GameState } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';

export const invitePlayer = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  email: string
) => {
  if (!state.gameId) {
    toast.error("No active game to invite players to");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const inviteLink = `${window.location.origin}/join/${state.gameId}`;
    
    console.log(`Sending invite to ${email} with link: ${inviteLink}`);
    
    dispatch({ type: 'INVITE_PLAYER', email });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Invitation sent to ${email}`);
  } catch (error) {
    console.error('Error inviting player:', error);
    toast.error('Failed to send invitation');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};
