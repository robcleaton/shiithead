
import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '@/hooks/useGame';
import RainingLogos from './RainingLogos';

interface GameOverProps {
  players: Player[];
  resetGame: () => void;
}

const GameOver = ({ players, resetGame }: GameOverProps) => {
  const { state } = useGame();
  
  // Find the winner more explicitly - player with no cards left
  const winner = players.find(p => 
    p.hand.length === 0 && 
    p.faceUpCards.length === 0 && 
    p.faceDownCards.length === 0
  );
  
  // Find the current player more explicitly
  const currentPlayer = players.find(p => p.id === state.playerId);

  // Force explicit boolean value for isWinner to prevent undefined/null issues
  const isWinner = !!(winner && currentPlayer && winner.id === currentPlayer.id);

  console.log('GameOver render - winner:', winner?.name, 'isWinner:', isWinner);
  console.log('Current player:', currentPlayer?.name, 'ID:', currentPlayer?.id);
  console.log('All players:', players.map(p => `${p.name} (${p.id})`).join(', '));

  // Set colors based on win/loss status - with fallback to ensure a color is always applied
  const gradientColors = isWinner
    ? "from-green-400 to-green-600"  // Winner gets green
    : "from-red-400 to-red-600";     // Loser gets red

  return (
    <motion.div
      className={`fixed inset-0 min-h-screen flex items-center justify-center p-3 bg-gradient-to-br ${gradientColors}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Add the raining logos effect */}
      <RainingLogos isWinner={isWinner} count={isWinner ? 30 : 15} />
      
      <motion.div
        className="text-center p-8 rounded-xl max-w-md w-full bg-white relative z-20"
        initial={{ y: 20, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h1
          className="text-3xl font-bold text-shithead-primary mb-4 font-tusker"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {isWinner ? "You win Shithead!" : "You lose Shithead"}
        </motion.h1>

        <motion.div
          className="my-6 py-4 bg-shithead-secondary/50 rounded-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-lg mb-1">Winner</p>
          <p className="text-2xl font-bold font-tusker">{winner?.name || 'Unknown'}</p>
        </motion.div>

        <motion.div
          className="my-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <p className="text-lg">
            {isWinner ? "Congratulations, you won!" : "Better luck next time!"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Button
            onClick={resetGame}
            className={`w-full ${isWinner ? "bg-shithead-primary hover:bg-shithead-primary/90" : "bg-red-500 hover:bg-red-600"} mt-4`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default GameOver;
