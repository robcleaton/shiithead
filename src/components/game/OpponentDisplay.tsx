
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
      
      <div className="flex justify-center mb-2">
        {opponent.faceDownCards.map((_, index) => (
          <div 
            key={`fd-${index}`}
            className="w-10 h-14 -ml-4 first:ml-0 bg-karma-card-back bg-card-texture rounded-md shadow-sm border border-gray-800/20"
          />
        ))}
      </div>
      
      <div className="flex justify-center mb-4">
        {opponent.faceUpCards.map((card, index) => (
          <div 
            key={`fu-${index}`}
            className="w-10 h-14 -ml-4 first:ml-0 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center"
          >
            <div className={`text-sm ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
              {card.rank}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center">
        {opponent.hand.length > 0 && (
          <div className="flex items-center justify-center relative">
            {opponent.hand.map((_, index) => {
              // Calculate spacing based on card count
              const totalWidth = Math.min(opponent.hand.length * 20, 220);
              const spacing = opponent.hand.length <= 1 ? 0 : totalWidth / (opponent.hand.length - 1);
              const leftPosition = opponent.hand.length <= 1 ? 0 : index * spacing - (totalWidth / 2);
              
              return (
                <div 
                  key={index}
                  className="absolute w-10 h-14 bg-karma-card-back bg-card-texture rounded-md shadow-sm border border-gray-800/20"
                  style={{ 
                    left: `${leftPosition}px`,
                    transform: `rotate(${(index - Math.floor(opponent.hand.length / 2)) * 3}deg)`
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OpponentDisplay;
