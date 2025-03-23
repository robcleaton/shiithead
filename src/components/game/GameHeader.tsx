
import { Button } from '@/components/ui/button';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameHeaderProps {
  onOpenRules: () => void;
  onResetGame: () => void;
}

const GameHeader = ({ onOpenRules, onResetGame }: GameHeaderProps) => {
  return (
    <motion.div 
      className="flex justify-between items-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-bold">Shithead Card Game</h1>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenRules}
          className="flex items-center gap-1"
        >
          <HelpCircle className="w-4 h-4" />
          Rules
        </Button>
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
