
import { motion } from 'framer-motion';
import Card from './Card';
import { CardValue } from '@/context/GameContext';
import { Button } from '@/components/ui/button';

interface GameTableProps {
  pile: CardValue[];
  deckCount: number;
  onDrawCard: () => void;
  currentPlayer: string;
}

const GameTable = ({ pile, deckCount, onDrawCard, currentPlayer }: GameTableProps) => {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : undefined;

  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-6 rounded-xl bg-karma-muted/60 border border-karma-border shadow-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-4">
        <motion.span 
          className="px-4 py-1 bg-karma-secondary text-karma-foreground rounded-full text-sm font-medium"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Current Player: {currentPlayer}
        </motion.span>
      </div>
      
      <div className="flex justify-center items-center gap-20 my-8">
        {/* Draw Pile */}
        <motion.div 
          className="relative flex flex-col items-center"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative w-24 h-36">
            {Array.from({ length: Math.min(deckCount, 5) }).map((_, i) => (
              <div 
                key={`deck-${i}`} 
                className="absolute playing-card bg-karma-card-back bg-card-texture"
                style={{ 
                  transform: `translateY(${-i * 2}px) translateX(${-i * 2}px) rotate(${-i * 1}deg)`,
                  zIndex: 5 - i
                }}
              />
            ))}
          </div>
          <span className="mt-3 text-sm font-medium bg-karma-primary/10 px-2 py-1 rounded text-karma-primary">
            Deck: {deckCount} cards
          </span>
          <Button
            onClick={onDrawCard}
            className="mt-2 bg-karma-primary hover:bg-karma-primary/90 text-white"
            size="sm"
          >
            Draw Card
          </Button>
        </motion.div>
        
        {/* Discard Pile */}
        <motion.div 
          className="relative flex flex-col items-center"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative w-24 h-36">
            {pile.slice(-5).map((card, i, arr) => (
              <motion.div 
                key={`pile-${i}`}
                className="absolute"
                initial={{ 
                  rotate: 0, 
                  scale: 0.9, 
                  opacity: 0,
                  x: -100,
                  y: -50
                }}
                animate={{ 
                  rotate: (i - arr.length + 1) * 5, 
                  scale: 1, 
                  opacity: 1,
                  x: 0,
                  y: 0,
                  zIndex: i
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 20 
                }}
              >
                <Card card={card} index={i} />
              </motion.div>
            ))}
          </div>
          <span className="mt-3 text-sm font-medium bg-karma-primary/10 px-2 py-1 rounded text-karma-primary">
            Pile: {pile.length} cards
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GameTable;
