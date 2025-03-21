
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
    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-karma-muted/60 border border-karma-border shadow-lg">
      <div className="text-center mb-4">
        <span className="px-4 py-1 bg-karma-secondary text-karma-foreground rounded-full text-sm font-medium">
          Current Player: {currentPlayer}
        </span>
      </div>
      
      <div className="flex justify-center items-center gap-20 my-8">
        {/* Draw Pile */}
        <div className="relative flex flex-col items-center">
          <div className="relative w-24 h-36">
            {Array.from({ length: Math.min(deckCount, 5) }).map((_, i) => (
              <div 
                key={`deck-${i}`} 
                className="absolute playing-card bg-karma-card-back bg-card-texture shadow-md"
                style={{ 
                  transform: `translateY(${-i * 1.5}px) translateX(${-i * 1.5}px) rotate(${-i * 0.5}deg)`,
                  zIndex: 5 - i,
                  boxShadow: `0 ${i * 0.5 + 1}px ${i + 2}px rgba(0,0,0,0.1)`
                }}
              />
            ))}
          </div>
          <span className="mt-3 text-sm font-medium bg-karma-primary/10 px-3 py-1 rounded-full text-karma-primary">
            {deckCount} cards
          </span>
          <Button
            onClick={onDrawCard}
            className="mt-2 bg-karma-primary hover:bg-karma-primary/90 text-white"
            size="sm"
          >
            Draw Card
          </Button>
        </div>
        
        {/* Discard Pile */}
        <div className="relative flex flex-col items-center">
          <div className="relative w-24 h-36">
            {pile.slice(-5).map((card, i, arr) => (
              <div 
                key={`pile-${i}`}
                className="absolute"
                style={{ 
                  transform: `rotate(${(i - arr.length + 1) * 3}deg)`,
                  zIndex: i
                }}
              >
                <Card card={card} index={i} />
              </div>
            ))}
          </div>
          <span className="mt-3 text-sm font-medium bg-karma-primary/10 px-3 py-1 rounded-full text-karma-primary">
            {pile.length} cards
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameTable;
