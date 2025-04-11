
import React from 'react';
import { CardValue } from '@/types/game';
import Card from '@/components/Card';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface PileDisplayProps {
  pile: CardValue[];
}

const PileDisplay: React.FC<PileDisplayProps> = ({ pile }) => {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const sameRankCount = pile.length > 0
    ? pile.filter(card => card.rank === topCard?.rank).length
    : 0;

  const isTenOnTop = topCard?.rank === '10';
  const isEightOnTop = topCard?.rank === '8';

  // Find the first non-8 card below the top card
  const findCardBelowEight = (): CardValue | null => {
    if (!isEightOnTop || pile.length <= 1) return null;

    // Start from the second-to-last card (index pile.length - 2)
    for (let i = pile.length - 2; i >= 0; i--) {
      if (pile[i].rank !== '8') {
        return pile[i];
      }
    }
    return null;
  };

  const cardBelowEight = findCardBelowEight();

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs bg-shithead-primary text-white px-2 py-0.5 rounded-full font-medium whitespace-nowrap mb-1">
        {pile.length} card{pile.length !== 1 ? 's' : ''} discarded
      </div>

      <div className="discard-cards-pile p-8">
        <div className="relative mt-2">
          {isTenOnTop && (
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 text-xs text-shithead-foreground/70 text-center">
              <span className="font-medium text-orange-500 flex items-center justify-center">
                <Flame className="h-3 w-3 mr-1" /> Burned
              </span>
            </div>
          )}

          {topCard ? (
            <div className="relative">
              {sameRankCount > 1 && (
                Array.from({ length: Math.min(3, sameRankCount - 1) }).map((_, index) => (
                  <div
                    key={`pile-card-${index}`}
                    className="absolute"
                    style={{
                      top: `${-3 - index * 2}px`,
                      left: `${-3 - index * 2}px`,
                      transform: `scale(1.25) rotate(${(index - 1) * -3}deg)`,
                      zIndex: 3 - index
                    }}
                  >
                    <Card
                      card={topCard}
                      index={index}
                      isPlayable={false}
                      sizeClass="pile-card"
                      disableHover={true}
                    />
                  </div>
                ))
              )}

              <div className={cn(
                "transform scale-125",
                isTenOnTop ? 'ring-2 ring-orange-500' : '',
                isEightOnTop ? 'opacity-70' : ''
              )}>
                <Card
                  card={topCard}
                  index={0}
                  isPlayable={false}
                  sizeClass="pile-card"
                  disableHover={true}
                />
              </div>

              {sameRankCount > 1 && (
                <div className="absolute bottom-0 right-0 translate-x-2 translate-y-6 z-10">
                  <span className="text-xs bg-shithead-primary text-white rounded-full px-2 py-0.5 font-medium border border-shithead-border/20">
                    {sameRankCount}
                  </span>
                </div>
              )}

              {isEightOnTop && cardBelowEight && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="text-xs bg-blue-500 text-white rounded-full px-2 py-0.5 font-medium border border-blue-600/20 whitespace-nowrap">
                    Playing on {cardBelowEight.rank}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="playing-card playing-card-lg rounded-lg border border-dashed border-gray-300 flex items-center justify-center shadow-none">
              <span className="text-gray-400 text-xs">Empty</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PileDisplay;
