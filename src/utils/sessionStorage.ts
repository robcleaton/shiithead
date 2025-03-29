
/**
 * Utility functions for managing game session data in local storage
 */

// Keys used for storage
const GAME_ID_KEY = 'shitheadGame_id';
const PLAYER_ID_KEY = 'shitheadPlayer_id';
const PLAYER_NAME_KEY = 'shitheadPlayer_name';

// Save game session data
export const saveGameSession = (gameId: string, playerId: string, playerName: string): void => {
  localStorage.setItem(GAME_ID_KEY, gameId);
  localStorage.setItem(PLAYER_ID_KEY, playerId);
  localStorage.setItem(PLAYER_NAME_KEY, playerName);
};

// Clear game session data
export const clearGameSession = (): void => {
  localStorage.removeItem(GAME_ID_KEY);
  localStorage.removeItem(PLAYER_ID_KEY);
  localStorage.removeItem(PLAYER_NAME_KEY);
};

// Get saved game session data
export const getSavedGameSession = (): { 
  gameId: string | null, 
  playerId: string | null,
  playerName: string | null
} => {
  return {
    gameId: localStorage.getItem(GAME_ID_KEY),
    playerId: localStorage.getItem(PLAYER_ID_KEY),
    playerName: localStorage.getItem(PLAYER_NAME_KEY)
  };
};

// Check if there's a saved game session
export const hasSavedGameSession = (): boolean => {
  const { gameId, playerId } = getSavedGameSession();
  return !!gameId && !!playerId;
};
