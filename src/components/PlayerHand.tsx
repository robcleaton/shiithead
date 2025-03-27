
import { useState, useEffect } from 'react';
import Card from './Card';
import { CardValue } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Check, Play } from 'lucide-react';

interface PlayerHandProps {
  cards: CardValue[];
  isActive: boolean;
  onPlayCard: (index: number | number[]) => void;
  onPlayMultipleCards?: (indices: number[]) => void;
  onSelectMultipleCards?: (indices: number[]) => void;
  isSetupPhase?: boolean;
  maxSelections?: number;
}

const PlayerHand = ({ 
  cards, 
  isActive, 
  onPlayCard, 
  onPlayMultipleCards,
  onSelectMultipleCards, 
  isSetupPhase = false, 
  maxSelections = 3 
}: PlayerHandProps) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  // Reset selected indices when cards or isActive changes
  useEffect(() => {
    setSelectedIndices([]);
  }, [cards, isActive]);
  
  const cardArray = Array.isArray(cards) ? cards : [];
  
  const handleSelectCard = (index: number) => {
    setSelectedIndices(prevIndices => {
      if (prevIndices.includes(index)) {
        return prevIndices.filter(i => i !== index);
      } else {
        if (!isSetupPhase && prevIndices.length > 0) {
          const firstSelectedCard = cardArray[prevIndices[0]];
          const currentCard = cardArray[index];
          
          if (firstSelectedCard.rank !== currentCard.rank) {
            return prevIndices;
          }
        }
        
        if (isSetupPhase && prevIndices.length >= maxSelections) {
          return prevIndices;
        }
        
        return [...prevIndices, index];
      }
    });
  };
  
  const handlePlaySelected = () => {
    if (isSetupPhase && onSelectMultipleCards && selectedIndices.length > 0) {
      onSelectMultipleCards(selectedIndices);
      setSelectedIndices([]);
    } 
    else if (!isSetupPhase && selectedIndices.length === 1) {
      onPlayCard(selectedIndices[0]);
      setSelectedIndices([]);
    }
    else if (!isSetupPhase && selectedIndices.length > 1) {
      onPlayCard(selectedIndices);
      setSelectedIndices([]);
    }
  };
  
  const areSelectionsValid = () => {
    if (selectedIndices.length === 0) return false;
    if (isSetupPhase) return selectedIndices.length <= maxSelections;
    
    if (selectedIndices.length === 1) return true;
    
    const firstRank = cardArray[selectedIndices[0]]?.rank;
    return selectedIndices.every(index => cardArray[index]?.rank === firstRank);
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
              <div className="flex justify-center">
                {cardArray.map((card, index) => (
                  <div 
                    key={`${card.suit}-${card.rank}-${index}`} 
                    className="relative mx-1"
                    style={{ 
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
                ))}
              </div>
            )}
          </div>
        </div>
        
        {isActive && selectedIndices.length > 0 && areSelectionsValid() && (
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
                  Play {selectedIndices.length > 1 ? `${selectedIndices.length} Cards` : 'Card'}
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
