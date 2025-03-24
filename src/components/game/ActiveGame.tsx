
import { Player } from '@/types/game';
import GameHeader from './GameHeader';
import OpponentDisplay from './OpponentDisplay';
import GameTable from '@/components/GameTable';
import PlayerArea from './PlayerArea';
import { CardValue } from '@/types/game';
import { motion } from 'framer-motion';

interface ActiveGameProps {
  players: Player[];
  playerId: string;
  currentPlayerId: string | null;
  pile: CardValue[];
  deck: CardValue[];
  drawCard: () => void;
  playCard: (cardIndex: number | number[]) => void;
  resetGame: () => void;
  onOpenRules: () => void;
}

const ActiveGame = ({
  players,
  playerId,
  currentPlayerId,
  pile,
  deck,
  drawCard,
  playCard,
  resetGame,
  onOpenRules  // We'll keep this in the props even though we won't use it directly
}: ActiveGameProps) => {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const player = players.find(p => p.id === playerId);

  if (!player) {
    return <div>Error: Player not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <GameHeader onResetGame={resetGame} />

      <div className="flex flex-col gap-8 items-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {players
            .filter(p => p.id !== playerId)
            .map(opponent => (
              <OpponentDisplay key={opponent.id} opponent={opponent} />
            ))}
        </div>

        <GameTable 
          pile={pile} 
          deckCount={deck.length} 
          onDrawCard={drawCard}
          currentPlayer={currentPlayer?.name || 'Unknown'}
        />

        <PlayerArea 
          player={player} 
          isActive={currentPlayerId === playerId}
          onPlayCard={playCard}
        />
      </div>
    </div>
  );
};

export default ActiveGame;
