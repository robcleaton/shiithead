
import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '@/hooks/useGame';

interface GameOverProps {
  players: Player[];
  resetGame: () => void;
}

const GameOver = ({ players, resetGame }: GameOverProps) => {
  const { state } = useGame();
  const winner = players.find(p => p.hand.length === 0 && p.faceUpCards.length === 0 && p.faceDownCards.length === 0);
  const currentPlayer = players.find(p => p.id === state.playerId);
  
  // Determine if current player is the winner
  const isWinner = winner && currentPlayer && winner.id === currentPlayer.id;
  
  // Set colors based on win/loss status
  const gradientColors = isWinner 
    ? "from-green-400 to-green-600"  // Winner gets green
    : "from-red-400 to-red-600";     // Loser gets red
  
  return (
    <motion.div 
      className={`fixed inset-0 min-h-screen flex items-center justify-center bg-gradient-to-br ${gradientColors}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-center glass-card p-8 rounded-xl max-w-md w-full bg-white/80"
        initial={{ y: 20, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-shithead-primary mb-4"
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
          <p className="text-2xl font-bold">{winner?.name || 'Unknown'}</p>
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
