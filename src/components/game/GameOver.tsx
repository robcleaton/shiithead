
import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameOverProps {
  players: Player[];
  resetGame: () => void;
}

const GameOver = ({ players, resetGame }: GameOverProps) => {
  const winner = players.find(p => p.hand.length === 0 && p.faceUpCards.length === 0 && p.faceDownCards.length === 0);
  
  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-center glass-card p-8 rounded-xl max-w-md w-full"
        initial={{ y: 20, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-karma-primary mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Game Over!
        </motion.h1>
        
        <motion.div
          className="my-6 py-4 bg-karma-secondary/50 rounded-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-lg mb-1">Winner</p>
          <p className="text-2xl font-bold">{winner?.name || 'Unknown'}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Button 
            onClick={resetGame}
            className="w-full bg-karma-primary hover:bg-karma-primary/90 mt-4"
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
