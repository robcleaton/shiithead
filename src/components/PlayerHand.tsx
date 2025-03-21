
import { useState } from 'react';
import Card from './Card';
import { CardValue } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PlayerHandProps {
  cards: CardValue[];
  isActive: boolean;
  onPlayCard: (index: number) => void;
  onSelectMultipleCards?: (indices: number[]) => void;
  isSetupPhase?: boolean;
  maxSelections?: number;
}

const PlayerHand = ({ 
  cards, 
  isActive, 
  onPlayCard, 
  onSelectMultipleCards, 
  isSetupPhase = false, 
  maxSelections = 3 
}: PlayerHandProps) => {
  // Add state to track selected card indices
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  // Add console log to help debug
  console.log('PlayerHand rendering with cards:', cards);
  console.log('Selected indices:', selectedIndices);
  
  // Ensure cards is always an array, even if undefined or null
  const cardArray = Array.isArray(cards) ? cards : [];
  
  const handleSelectCard = (index: number) => {
    setSelectedIndices(prevIndices => {
      if (prevIndices.includes(index)) {
        // Remove index if already selected
        return prevIndices.filter(i => i !== index);
      } else {
        // Add index if under max limit
        if (prevIndices.length < maxSelections) {
          return [...prevIndices, index];
        }
        return prevIndices;
      }
    });
  };
  
  const handlePlaySelected = () => {
    if (onSelectMultipleCards && selectedIndices.length > 0) {
      onSelectMultipleCards(selectedIndices);
      setSelectedIndices([]);
    }
  };
  
  return (
    <div className="relative">
      <div className={`p-4 rounded-xl ${isActive ? 'bg-karma-primary/10 border border-karma-primary/30' : 'bg-transparent'} transition-all duration-300`}>
        <div className="mb-2 text-center">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${isActive ? 'bg-karma-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
            {isActive ? 'Your Turn' : 'Waiting...'}
          </span>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex flex-wrap justify-center gap-4">
            {!cardArray || cardArray.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                No cards available
              </div>
            ) : (
              cardArray.map((card, index) => (
                <div 
                  key={`${card.suit}-${card.rank}-${index}`} 
                  className="transform transition-transform hover:z-10"
                >
                  <Card 
                    card={card} 
                    index={index} 
                    isPlayable={isActive}
                    onPlay={isSetupPhase ? undefined : () => onPlayCard(index)}
                    delay={index}
                    isSelected={selectedIndices.includes(index)}
                    onSelect={isSetupPhase ? () => handleSelectCard(index) : undefined}
                  />
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Only show the Play button during setup phase if we have selections */}
        {isSetupPhase && isActive && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handlePlaySelected}
              disabled={selectedIndices.length === 0}
              className="bg-karma-primary hover:bg-karma-primary/90"
            >
              <Check className="w-4 h-4 mr-2" />
              Play Selected Cards ({selectedIndices.length}/{maxSelections})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHand;
