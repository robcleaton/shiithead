
import { Player } from '@/types/game';
import PlayerHand from '@/components/PlayerHand';
import Card from '@/components/Card';
import { useState, useEffect } from 'react';
import { CardValue } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

interface PlayerAreaProps {
  player: Player;
  isActive: boolean;
  onPlayCard: (cardIndex: number | number[]) => void;
}

const PlayerArea = ({ player, isActive, onPlayCard }: PlayerAreaProps) => {
  const [selectedFaceUpCardIndex, setSelectedFaceUpCardIndex] = useState<number | null>(null);
  const [selectedFaceDownCardIndex, setSelectedFaceDownCardIndex] = useState<number | null>(null);
  
  // Reset selections when cards or active state changes
  useEffect(() => {
    setSelectedFaceUpCardIndex(null);
    setSelectedFaceDownCardIndex(null);
  }, [player.hand, player.faceUpCards, player.faceDownCards, isActive]);
  
  // Check if hand and face up cards are empty
  const isHandEmpty = player.hand.length === 0;
  const isFaceUpEmpty = player.faceUpCards.length === 0;
  const isFaceDownEmpty = player.faceDownCards.length === 0;
  
  // Check if player has no cards left
  const hasNoCardsLeft = isHandEmpty && isFaceUpEmpty && isFaceDownEmpty;
  
  // Handle face up card selection
  const handleSelectFaceUpCard = (index: number) => {
    if (!isHandEmpty || !isActive) return;
    
    if (selectedFaceUpCardIndex === index) {
      setSelectedFaceUpCardIndex(null);
    } else {
      setSelectedFaceUpCardIndex(index);
      // Reset face down selection when selecting face up
      setSelectedFaceDownCardIndex(null);
    }
  };
  
  // Handle face down card selection
  const handleSelectFaceDownCard = (index: number) => {
    if (!isHandEmpty || !isFaceUpEmpty || !isActive) return;
    
    if (selectedFaceDownCardIndex === index) {
      setSelectedFaceDownCardIndex(null);
    } else {
      setSelectedFaceDownCardIndex(index);
      // Reset face up selection when selecting face down
      setSelectedFaceUpCardIndex(null);
    }
  };
  
  // Handle playing a face up card
  const handlePlayFaceUpCard = () => {
    if (selectedFaceUpCardIndex !== null) {
      // We'll use negative indices to indicate face up cards
      onPlayCard(-(selectedFaceUpCardIndex + 1));
      setSelectedFaceUpCardIndex(null);
    }
  };
  
  // Handle playing a face down card
  const handlePlayFaceDownCard = () => {
    if (selectedFaceDownCardIndex !== null) {
      // We'll use large negative indices to indicate face down cards (e.g. -1000 and below)
      onPlayCard(-(selectedFaceDownCardIndex + 1000));
      setSelectedFaceDownCardIndex(null);
    }
  };
  
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };
  
  return (
    <div className={`w-full max-w-3xl ${hasNoCardsLeft ? 'bg-green-100 p-4 rounded-lg border border-green-300' : ''}`}>
      {hasNoCardsLeft && (
        <div className="text-center mb-4 text-green-700 font-medium">
          Player has no cards left!
        </div>
      )}
      
      <div className="flex justify-center gap-1 mb-6">
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Face Down</div>
          <div className="flex gap-2">
            {player.faceDownCards.map((_, index) => (
              <div 
                key={index}
                onClick={() => handleSelectFaceDownCard(index)}
                className={`w-14 h-20 bg-karma-card-back bg-card-texture rounded-lg shadow-md border border-gray-800/20
                  ${isHandEmpty && isFaceUpEmpty && isActive ? 'cursor-pointer hover:scale-105' : ''}
                  ${selectedFaceDownCardIndex === index ? 'ring-4 ring-karma-primary scale-105' : ''}`}
              />
            ))}
          </div>
        </div>
        
        <div className="flex flex-col items-center ml-6">
          <div className="text-xs text-gray-500 mb-1">Face Up</div>
          <div className="flex gap-2">
            {player.faceUpCards.map((card, index) => (
              <div 
                key={`fu-${index}`}
                onClick={() => handleSelectFaceUpCard(index)}
                className={`w-14 h-20 bg-white rounded-lg shadow-sm border transition-all 
                  ${selectedFaceUpCardIndex === index ? 'ring-4 ring-karma-primary scale-105' : 'border-gray-200'} 
                  ${isHandEmpty && isActive ? 'cursor-pointer hover:scale-105' : ''}
                  flex items-center justify-center`}
              >
                <div className={`text-lg ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                  {card.rank}
                  <span className="text-lg">
                    {getSuitSymbol(card.suit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Show play button for face up cards when hand is empty */}
      {isHandEmpty && isActive && selectedFaceUpCardIndex !== null && (
        <div className="flex justify-center mb-4">
          <Button
            onClick={handlePlayFaceUpCard}
            className="bg-karma-primary hover:bg-karma-primary/90"
          >
            <Play className="w-4 h-4 mr-2" />
            Play Face Up Card
          </Button>
        </div>
      )}
      
      {/* Show play button for face down cards when hand and face up cards are empty */}
      {isHandEmpty && isFaceUpEmpty && isActive && selectedFaceDownCardIndex !== null && (
        <div className="flex justify-center mb-4">
          <Button
            onClick={handlePlayFaceDownCard}
            className="bg-karma-primary hover:bg-karma-primary/90"
          >
            <Play className="w-4 h-4 mr-2" />
            Play Face Down Card
          </Button>
        </div>
      )}
      
      <PlayerHand
        cards={player.hand}
        isActive={isActive}
        onPlayCard={onPlayCard}
      />
    </div>
  );
};

export default PlayerArea;
