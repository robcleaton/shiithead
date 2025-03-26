
import { Player } from '@/types/game';
import { motion } from 'framer-motion';

interface OpponentDisplayProps {
  opponent: Player;
}

const OpponentDisplay = ({ opponent }: OpponentDisplayProps) => {
  return (
    <motion.div 
      className="bg-karma-muted/30 backdrop-blur-sm p-4 rounded-xl border border-karma-border shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-karma-primary rounded-full flex items-center justify-center text-white font-medium">
            {opponent.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{opponent.name}</span>
        </div>
        <span className="text-sm px-2 py-1 bg-karma-secondary/50 rounded-full">
          {opponent.hand.length} cards
        </span>
      </div>
      
      <div className="flex justify-center gap-1 mb-6">
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Face Down</div>
          <div className="flex gap-2">
            {opponent.faceDownCards.map((_, index) => (
              <div 
                key={`fd-${index}`}
                className="w-12 h-16 bg-karma-card-back bg-card-texture rounded-lg shadow-md border border-gray-800/20"
              />
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-center ml-6">
          <div className="text-xs text-gray-500 mb-1">Face Up</div>
          <div className="flex gap-2">
            {opponent.faceUpCards.map((card, index) => (
              <div 
                key={`fu-${index}`}
                className="w-12 h-16 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center"
              >
                <div className={`text-lg ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                  {card.rank}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        {opponent.hand.length > 0 && (
          <div className="flex items-center justify-center">
            {opponent.hand.map((_, index) => (
              <div 
                key={`hand-${index}`}
                className="w-10 h-14 -ml-2 first:ml-0 bg-karma-card-back bg-card-texture rounded-md shadow-sm border border-gray-800/20"
                style={{ transform: 'rotate(0deg)' }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OpponentDisplay;
