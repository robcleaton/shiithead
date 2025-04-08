
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { GameState, CardValue } from '@/types/game';
import { Dispatch } from 'react';
import { GameAction } from '@/types/game';
import { generateId } from '@/utils/gameUtils';
import { jsonToCardValues } from '@/utils/gameUtils';

export const addTestPlayer = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  playerName: string
) => {
  if (!state.gameId || state.gameStarted) {
    toast.error("Cannot add test players after game has started");
    return;
  }
  
  try {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
    const existingNames = state.players.map(p => p.name);
    if (existingNames.includes(playerName)) {
      toast.error("A player with this name already exists");
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    
    const testPlayerId = `ai-${generateId()}`;
    
    const { error: playerError } = await supabase
      .from('players')
      .insert([{
        id: testPlayerId,
        name: playerName,
        game_id: state.gameId,
        is_host: false,
        hand: [],
        face_down_cards: [],
        face_up_cards: [],
        is_active: true,
        is_ready: false
      }]);
      
    if (playerError) throw playerError;
    
    dispatch({ type: 'ADD_TEST_PLAYER', playerName });
    dispatch({ type: 'SET_LOADING', isLoading: false });
    toast.success(`Added AI player: ${playerName}`);
    
    setTimeout(() => {
      autoSelectAIPlayerCards(dispatch, state, testPlayerId);
    }, 1500);
  } catch (error) {
    console.error('Error adding test player:', error);
    toast.error('Failed to add test player');
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }
};

export const autoSelectAIPlayerCards = async (
  dispatch: Dispatch<GameAction>,
  state: GameState,
  aiPlayerId: string
) => {
  try {
    const { data: playerData, error: playerFetchError } = await supabase
      .from('players')
      .select('*')
      .eq('id', aiPlayerId)
      .eq('game_id', state.gameId)
      .maybeSingle();
      
    if (playerFetchError || !playerData) {
      console.error('Error fetching AI player data:', playerFetchError);
      return;
    }
    
    const hand = jsonToCardValues(playerData.hand);
    
    if (!hand || hand.length === 0) {
      console.log('AI player has no cards to select');
      return;
    }
    
    const rankOrder: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    
    const sortedHand = [...hand].sort((a, b) => 
      rankOrder[b.rank] - rankOrder[a.rank]
    );
    
    const selectedCards = sortedHand.slice(0, 3);
    const remainingCards = sortedHand.slice(3);
    
    console.log('AI player selected cards:', selectedCards);
    
    const { error: updateError } = await supabase
      .from('players')
      .update({
        hand: remainingCards,
        face_up_cards: selectedCards,
        is_ready: true
      })
      .eq('id', aiPlayerId)
      .eq('game_id', state.gameId);
      
    if (updateError) {
      console.error('Error updating AI player cards:', updateError);
      return;
    }
    
    toast.success(`${playerData.name} is ready to play!`);
  } catch (error) {
    console.error('Error in AI card selection:', error);
  }
};
