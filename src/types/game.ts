
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface GameState {
  gameId: string;
  playerId: string;
  isHost: boolean;
  players: Player[];
}
