
import { motion } from 'framer-motion';
import { UserRoundCheck, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Player } from '@/types/game';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import useGame from '@/hooks/useGame';

// Generate consistent colors based on player name
const generateAvatarColor = (name: string): string => {
  // Array of bold, vibrant background colors for avatars
  const colors = [
    'bg-purple-500',    // Primary Purple
    'bg-indigo-500',    // Indigo
    'bg-blue-500',      // Blue
    'bg-green-500',     // Green
    'bg-yellow-500',    // Yellow
    'bg-orange-500',    // Orange
    'bg-pink-500',      // Pink
    'bg-red-500',       // Red
    'bg-teal-500',      // Teal
  ];
  
  // Simple hash function to get consistent index from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use absolute value and modulo to get a valid index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
}

const PlayerList = ({ players, currentPlayerId }: PlayerListProps) => {
  const [renderedPlayers, setRenderedPlayers] = useState<Player[]>([]);
  const { state, removePlayer } = useGame();
  
  // Update rendered players whenever the players prop changes
  useEffect(() => {
    console.log('PlayerList received players update:', players);
    
    if (players && players.length > 0) {
      // Check if current player is still in the list
      const currentPlayerStillInGame = players.some(p => p.id === currentPlayerId);
      
      if (!currentPlayerStillInGame && currentPlayerId) {
        console.log('Current player no longer in game list - they were removed');
        
        // We should be redirected by the usePlayerUpdates hook
        // This is a fallback in case that doesn't happen
        setTimeout(() => {
          console.log('Fallback redirect triggered');
          window.location.href = '/';
        }, 1000);
      }
      
      setRenderedPlayers(players);
    } else if (currentPlayerId) {
      // We have a player ID but no players, check if we've been removed
      console.log('No players returned but we have a player ID - possible removal');
      
      // We should be redirected by the usePlayerUpdates hook
      // This is a fallback in case that doesn't happen
      setTimeout(() => {
        console.log('No players fallback redirect triggered');
        window.location.href = '/';
      }, 1000);
    }
  }, [players, currentPlayerId]);

  // Handle player removal
  const handleRemovePlayer = async (playerId: string) => {
    if (playerId !== currentPlayerId && state.isHost) {
      console.log(`Host is removing player: ${playerId}`);
      await removePlayer(playerId);
    }
  };

  return (
    <ul className="space-y-2">
      {renderedPlayers.length === 0 ? (
        <li className="flex items-center justify-center p-4 text-gray-500 italic">
          No players have joined yet
        </li>
      ) : (
        renderedPlayers.map((player, index) => (
          <motion.li
            key={player.id}
            className="flex items-center gap-3 bg-white/40 p-3 rounded-lg shadow-sm border border-gray-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Avatar className={`h-12 w-12 text-white ${generateAvatarColor(player.name)}`}>
              <AvatarFallback className="text-xl uppercase">{player.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{player.name}</span>
            
            {/* Status indicators */}
            <div className="ml-auto flex items-center gap-2">
              {player.id === currentPlayerId && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <UserRoundCheck className="w-3 h-3" /> You
                </span>
              )}
              {player.isHost && (
                <span className="text-xs bg-shithead-secondary px-2 py-0.5 rounded-full">Host</span>
              )}
              
              {/* Remove player button (only visible to host and not for current player) */}
              {state.isHost && player.id !== currentPlayerId && !state.gameStarted && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemovePlayer(player.id)}
                  title="Remove player"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.li>
        ))
      )}
    </ul>
  );
};

export default PlayerList;
