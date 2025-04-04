
import { Player } from '@/types/game';
import OpponentDisplay from './OpponentDisplay';
import GameTable from '@/components/GameTable';
import PlayerArea from './PlayerArea';
import { CardValue } from '@/types/game';
import { Button } from '@/components/ui/button';
import useGame from '@/hooks/useGame';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';

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
  refreshGame?: () => void;
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
  isLoading = false,
  refreshGame
}: ActiveGameProps) => {
  const { pickupPile, refreshGameState } = useGame();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const player = players.find(p => p.id === playerId);
  const [lastActionTime, setLastActionTime] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  // Log important state information for debugging
  useEffect(() => {
    console.log(`ActiveGame rendered - Current player: ${currentPlayerId} (${currentPlayer?.name || 'Unknown'})`);
    console.log(`Current player is self: ${currentPlayerId === playerId}`);
    
    // Update last action time on player changes
    setLastActionTime(Date.now());
  }, [currentPlayerId, currentPlayer, playerId, players]);

  // Setup inactivity detector
  useEffect(() => {
    // Check for long periods of inactivity
    const inactivityCheck = setInterval(() => {
      const inactiveTime = Date.now() - lastActionTime;
      
      // If game has been inactive for over 2 minutes, show a refresh suggestion
      if (inactiveTime > 120000 && currentPlayerId && !isLoading) {
        toast.info(
          "Game seems inactive. Click 'Refresh Game' if you think something's wrong.",
          { duration: 5000, id: "inactivity-warning" }
        );
      }
    }, 30000);
    
    return () => clearInterval(inactivityCheck);
  }, [lastActionTime, currentPlayerId, isLoading]);

  if (!player) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Error: Player not found</h2>
        <p className="mb-4">There was a problem loading your player data.</p>
        <Button onClick={refreshGameState}>Refresh Game</Button>
      </div>
    );
  }

  // Determine if a 3 is on top of the pile
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const isThreeOnTop = topCard?.rank === '3';

  // Function to handle picking up the pile
  const handlePickUpPile = () => {
    pickupPile();
    setLastActionTime(Date.now());
  };

  // Handle game refresh with loading state
  const handleRefreshGame = async () => {
    setRefreshing(true);
    toast.info("Refreshing game state for all players...");
    
    try {
      if (refreshGame) {
        refreshGame();
      } else {
        refreshGameState();
      }
      
      // Set a timeout to ensure we don't get stuck in refreshing state
      setTimeout(() => {
        setRefreshing(false);
      }, 5000);
    } catch (error) {
      console.error("Error refreshing game:", error);
      setRefreshing(false);
      toast.error("Failed to refresh game. Please try again.");
    }
  };

  // Update last action time when player makes a move
  const handlePlayCard = (cardIndex: number | number[]) => {
    setLastActionTime(Date.now());
    playCard(cardIndex);
  };

  // Update last action time when player draws a card
  const handleDrawCard = () => {
    setLastActionTime(Date.now());
    drawCard();
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
          onDrawCard={handleDrawCard}
          onPickupPile={handlePickUpPile}
          currentPlayer={currentPlayer?.name || 'Unknown'}
          isCurrentPlayer={currentPlayerId === playerId}
          mustPickUpPileOrPlayThree={isThreeOnTop}
          isLoading={isLoading}
        />

        <PlayerArea 
          player={player} 
          isActive={currentPlayerId === playerId}
          onPlayCard={handlePlayCard}
        />
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={handleRefreshGame}
            className="text-xs flex items-center gap-1"
            disabled={isLoading || refreshing}
          >
            {(isLoading || refreshing) ? 
              <Loader2 className="h-3 w-3 animate-spin" /> : 
              <RefreshCw className="h-3 w-3" />
            }
            Game stuck? Click to refresh all players
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveGame;
