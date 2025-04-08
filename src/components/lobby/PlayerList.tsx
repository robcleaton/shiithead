
import { motion } from 'framer-motion';
import { UserRoundCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Player } from '@/types/game';
import { useEffect, useState } from 'react';

// Create a function to generate consistent colors based on player name
const generateAvatarColor = (name: string): string => {
  // Array of pleasing background colors for avatars
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
  
  // Add a safety mechanism to ensure players are properly rendered
  useEffect(() => {
    console.log('PlayerList received players:', players);
    
    if (players && players.length > 0) {
      setRenderedPlayers(players);
    } else {
      // If we have a current player but no players list, at least show the current player
      if (currentPlayerId) {
        const fallbackPlayer: Player = {
          id: currentPlayerId,
          name: 'You',
          isHost: true,
          hand: [],
          faceDownCards: [],
          faceUpCards: [],
          isActive: true,
          isReady: false,
          gameId: ''
        };
        
        setRenderedPlayers([fallbackPlayer]);
        console.warn('Using fallback player data since no players were received');
      }
    }
  }, [players, currentPlayerId]);

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
            <Avatar className={`h-8 w-8 text-white ${generateAvatarColor(player.name)}`}>
              <AvatarFallback>{player.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{player.name}</span>
            {player.id === currentPlayerId && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <UserRoundCheck className="w-3 h-3" /> You
              </span>
            )}
            {player.isHost && (
              <span className="ml-auto text-xs bg-shithead-secondary px-2 py-0.5 rounded-full">Host</span>
            )}
          </motion.li>
        ))
      )}
    </ul>
  );
};

export default PlayerList;
