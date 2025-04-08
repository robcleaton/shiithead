import { motion, AnimatePresence } from 'framer-motion';
import { UserRoundCheck, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Player } from '@/types/game';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import useGame from '@/hooks/useGame';

const generateAvatarColor = (name: string): string => {
  const colors = [
    'bg-purple-500',
    'bg-indigo-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-red-500',
    'bg-teal-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
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
  
  useEffect(() => {
    console.log('PlayerList received players update:', players);
    setRenderedPlayers(players);
  }, [players]);

  const handleRemovePlayer = async (playerId: string) => {
    if (playerId !== currentPlayerId && state.isHost) {
      console.log(`Host is removing player: ${playerId}`);
      
      const playerToRemove = players.find(p => p.id === playerId);
      
      setRenderedPlayers(prev => prev.filter(p => p.id !== playerId));
      
      await removePlayer(playerId);
      
      if (playerToRemove) {
        console.log(`Removed ${playerToRemove.name} from the game`);
      }
    }
  };

  return (
    <ul className="space-y-2">
      {renderedPlayers.length === 0 ? (
        <li className="flex items-center justify-center p-4 text-gray-500 italic">
          No players have joined yet
        </li>
      ) : (
        <AnimatePresence>
          {renderedPlayers.map((player) => (
            <motion.li
              key={player.id}
              className="flex items-center gap-3 bg-white/40 p-3 rounded-lg shadow-sm border border-gray-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar className={`h-12 w-12 text-white ${generateAvatarColor(player.name)}`}>
                <AvatarFallback className="text-xl uppercase">{player.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{player.name}</span>
              
              <div className="ml-auto flex items-center gap-2">
                {player.id === currentPlayerId && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <UserRoundCheck className="w-3 h-3" /> You
                  </span>
                )}
                {player.isHost && (
                  <span className="text-xs bg-shithead-secondary px-2 py-0.5 rounded-full">Host</span>
                )}
                
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
          ))}
        </AnimatePresence>
      )}
    </ul>
  );
};

export default PlayerList;
