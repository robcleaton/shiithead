
import { motion } from 'framer-motion';
import Card from './Card';
import { CardValue } from '@/context/GameContext';

interface PlayerHandProps {
  cards: CardValue[];
  isActive: boolean;
  onPlayCard: (index: number) => void;
}

const PlayerHand = ({ cards, isActive, onPlayCard }: PlayerHandProps) => {
  // Add console log to help debug
  console.log('PlayerHand rendering with cards:', cards);
  
  return (
    <motion.div
      className="relative"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`p-4 rounded-xl ${isActive ? 'bg-karma-primary/10 border border-karma-primary/30' : 'bg-transparent'} transition-all duration-300`}>
        <div className="mb-2 text-center">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${isActive ? 'bg-karma-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
            {isActive ? 'Your Turn' : 'Waiting...'}
          </span>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex items-center" style={{ marginLeft: `${cards && cards.length > 0 ? `-${Math.min(cards.length * 8, 40)}px` : '0'}` }}>
            {!cards || cards.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                No cards available
              </div>
            ) : (
              cards.map((card, index) => (
                <div 
                  key={`${card.suit}-${card.rank}-${index}`} 
                  className="ml-4 first:ml-0 transform transition-transform hover:z-10"
                  style={{ marginLeft: `-${Math.min(cards.length * 3, 20)}px` }}
                >
                  <Card 
                    card={card} 
                    index={index} 
                    isPlayable={isActive}
                    onPlay={() => onPlayCard(index)}
                    delay={index}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerHand;
