
import React from 'react';

interface DeckDisplayProps {
  deckCount: number;
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ deckCount }) => {
  return (
    <div className="flex flex-col items-center mb-4">
      <div className="text-xs bg-shithead-primary text-white px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
        {deckCount} card{deckCount !== 1 ? 's' : ''} left
      </div>
    </div>
  );
};

export default DeckDisplay;
