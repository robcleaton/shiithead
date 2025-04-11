
import { Player } from '@/types/game';
import OpponentDisplay from './OpponentDisplay';
import GameTable from '@/components/GameTable';
import PlayerArea from './PlayerArea';
import { CardValue } from '@/types/game';
import { Button } from '@/components/ui/button';
import useGame from '@/hooks/useGame';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
  isLoading?: boolean;
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
  onOpenRules,
  isLoading = false
}: ActiveGameProps) => {
  const { pickupPile, refreshGameState } = useGame();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const player = players.find(p => p.id === playerId);
  const [turnCheckCount, setTurnCheckCount] = useState(0);
  const lastTurnIdRef = useRef<string | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    if (currentPlayerId !== lastTurnIdRef.current) {
      console.log(`Turn changed from ${lastTurnIdRef.current} to ${currentPlayerId}`);
      setTurnCheckCount(0);
      lastTurnIdRef.current = currentPlayerId;
      return;
    }

    if (currentPlayerId && !isLoading) {
      turnTimerRef.current = setTimeout(() => {
        setTurnCheckCount(prev => prev + 1);
      }, 10000);
    }

    return () => {
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
      }
    };
  }, [currentPlayerId, isLoading, turnCheckCount]);

  useEffect(() => {
    if (turnCheckCount >= 3) {
      console.log(`Game may be stuck - no turn change detected for ~30 seconds`);
      toast.info("Game seems stuck, refreshing state for all players...");
      refreshGameState();
      setTurnCheckCount(0);
    }
  }, [turnCheckCount, refreshGameState]);

  useEffect(() => {
    console.log(`ActiveGame rendered - Current player: ${currentPlayerId} (${currentPlayer?.name || 'Unknown'})`);
    console.log(`Current player is self: ${currentPlayerId === playerId}`);
    
    if (!currentPlayerId && players.length > 0) {
      console.log('Current player ID missing but players exist - refreshing state');
      const timer = setTimeout(() => {
        refreshGameState();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerId, currentPlayer, playerId, players.length, refreshGameState]);

  if (!player) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Error: Player not found</h2>
        <p className="mb-4">There was a problem loading your player data.</p>
        <Button onClick={refreshGameState}>Refresh Game</Button>
      </div>
    );
  }

  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const isThreeOnTop = topCard?.rank === '3';

  const handlePickUpPile = () => {
    pickupPile();
  };

  const handleRefreshGame = () => {
    toast.info("Refreshing game state for all players...");
    refreshGameState();
  };

  console.log(`Current deck count in ActiveGame: ${deck.length}, type: ${typeof deck.length}`);
  console.log(`Is it my turn? ${currentPlayerId === playerId}`);

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <div className="flex flex-col gap-4 items-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {players
            .filter(p => p.id !== playerId)
            .map(opponent => (
              <OpponentDisplay
                key={opponent.id}
                opponent={opponent}
                isCurrentPlayer={opponent.id === currentPlayerId}
              />
            ))}
        </div>

        <GameTable
          pile={pile}
          deckCount={deck.length}
          onDrawCard={drawCard}
          onPickupPile={handlePickUpPile}
          currentPlayer={currentPlayer?.name || 'Unknown'}
          isCurrentPlayer={currentPlayerId === playerId}
          mustPickUpPileOrPlayThree={isThreeOnTop}
          isLoading={isLoading}
        />

        <PlayerArea
          player={player}
          isActive={currentPlayerId === playerId}
          onPlayCard={playCard}
        />

        <div className="mt-4 flex flex-col items-center">
          <div className="text-sm text-gray-500 mb-2">
            {/* Removed the conditional message that showed "Waiting for player to play" */}
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshGame}
            className="text-xs flex items-center gap-1"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            Game stuck? Click to refresh all players
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveGame;
