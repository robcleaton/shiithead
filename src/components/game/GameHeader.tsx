
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameHeaderProps {
  onResetGame: () => void;
}

const GameHeader = ({ onResetGame }: GameHeaderProps) => {
  return (
    <motion.div 
      className="flex justify-end items-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm("Are you sure you want to reset the game?")) {
              onResetGame();
            }
          }}
          className="flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </Button>
      </div>
    </motion.div>
  );
};

export default GameHeader;
