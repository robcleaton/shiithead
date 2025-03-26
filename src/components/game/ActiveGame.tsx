
import { Player } from '@/types/game';
import OpponentDisplay from './OpponentDisplay';
import GameTable from '@/components/GameTable';
import PlayerArea from './PlayerArea';
import { CardValue } from '@/types/game';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useGame } from '@/context/GameContext';

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
  onOpenRules
}: ActiveGameProps) => {
  const { pickupPile } = useGame();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const player = players.find(p => p.id === playerId);

  if (!player) {
    return <div>Error: Player not found</div>;
  }

  // Determine if a 3 is on top of the pile
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const isThreeOnTop = topCard?.rank === '3';
  const mustPickUpPileOrPlayThree = isThreeOnTop;

  // Function to handle picking up the pile
  const handlePickUpPile = () => {
    // Instead of using drawCard, use the dedicated pickupPile function
    pickupPile();
  };

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
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
          onPickupPile={handlePickUpPile}
          currentPlayer={currentPlayer?.name || 'Unknown'}
          isCurrentPlayer={currentPlayerId === playerId}
          mustPickUpPileOrPlayThree={mustPickUpPileOrPlayThree}
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
