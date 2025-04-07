import { useState, useEffect } from 'react';
import Card from './Card';
import { CardValue } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Check, Play } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
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
      <div className={`p-4 rounded-xl ${isActive ? 'bg-shithead-primary/10 border border-shithead-primary/30' : 'bg-transparent'} transition-all duration-300`}>
        <div className="mb-3 text-center">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${isActive ? 'bg-shithead-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
            {isSetupPhase ? 'Select Cards' : (isActive ? 'Your Turn' : 'Waiting...')}
          </span>
        </div>
        
        <ScrollArea className="w-full h-48 pb-4" type="scroll">
          <div className="relative flex items-center justify-center">
            <div className="relative flex justify-center w-max min-w-full px-6">
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
                        isPlayable={isActive || isSetupPhase}
                        onPlay={(isSetupPhase || isActive) ? () => handleSelectCard(index) : undefined}
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
          <ScrollBar orientation="horizontal" className="mt-2" />
        </ScrollArea>
        
        {(isActive || isSetupPhase) && selectedIndices.length > 0 && areSelectionsValid() && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handlePlaySelected}
              className="bg-shithead-primary hover:bg-shithead-primary/90"
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
        
        {isMobile && cardArray.length > 4 && (
          <div className="text-center text-xs text-gray-500 mt-2">
            Swipe to view more cards
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHand;
