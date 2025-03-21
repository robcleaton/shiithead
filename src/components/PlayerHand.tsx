
import { useState } from 'react';
import Card from './Card';
import { CardValue } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Check, Play } from 'lucide-react';

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
        // During gameplay, only allow single selection
        if (!isSetupPhase) {
          return [index];
        }
        // During setup, add index if under max limit
        if (prevIndices.length < maxSelections) {
          return [...prevIndices, index];
        }
        return prevIndices;
      }
    });
  };
  
  const handlePlaySelected = () => {
    // For setup phase with multiple selections
    if (isSetupPhase && onSelectMultipleCards && selectedIndices.length > 0) {
      onSelectMultipleCards(selectedIndices);
      setSelectedIndices([]);
    } 
    // For regular gameplay with single card play
    else if (!isSetupPhase && selectedIndices.length === 1) {
      onPlayCard(selectedIndices[0]);
      setSelectedIndices([]);
    }
  };
  
  // Calculate fan angle based on number of cards
  const calculateFanAngle = (totalCards: number, index: number) => {
    if (totalCards <= 1) return 0;
    
    const maxAngle = Math.min(30, 60 / totalCards); // Limit maximum angle
    const centerIndex = (totalCards - 1) / 2;
    return (index - centerIndex) * maxAngle;
  };
  
  return (
    <div className="relative">
      <div className={`p-4 rounded-xl ${isActive ? 'bg-karma-primary/10 border border-karma-primary/30' : 'bg-transparent'} transition-all duration-300`}>
        <div className="mb-3 text-center">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${isActive ? 'bg-karma-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
            {isActive ? 'Your Turn' : 'Waiting...'}
          </span>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="relative flex justify-center h-44 w-full">
            {!cardArray || cardArray.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                No cards available
              </div>
            ) : (
              cardArray.map((card, index) => {
                const angle = calculateFanAngle(cardArray.length, index);
                const offsetX = Math.sin(angle * Math.PI / 180) * 30;
                const offsetY = Math.abs(angle) * 0.5;
                
                return (
                  <div 
                    key={`${card.suit}-${card.rank}-${index}`} 
                    className="absolute"
                    style={{ 
                      transform: `translateX(${offsetX}px) translateY(${offsetY}px) rotate(${angle}deg)`,
                      transformOrigin: 'bottom center',
                      zIndex: index,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Card 
                      card={card} 
                      index={index} 
                      isPlayable={isActive}
                      onPlay={isSetupPhase || !isActive ? undefined : () => handleSelectCard(index)}
                      onSelect={() => handleSelectCard(index)}
                      delay={index}
                      isSelected={selectedIndices.includes(index)}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Show Play button when there are selections */}
        {isActive && selectedIndices.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handlePlaySelected}
              className="bg-karma-primary hover:bg-karma-primary/90"
            >
              {isSetupPhase ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Play Selected Cards ({selectedIndices.length}/{maxSelections})
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play Card
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHand;
