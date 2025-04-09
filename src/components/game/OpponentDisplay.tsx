
import { Player } from '@/types/game';

interface OpponentDisplayProps {
  opponent: Player;
}

const OpponentDisplay = ({ opponent }: OpponentDisplayProps) => {
  // Ensure we're working with arrays, even if they're null/undefined in the opponent object
  const handCards = Array.isArray(opponent.hand) ? opponent.hand : [];
  const faceDownCards = Array.isArray(opponent.faceDownCards) ? opponent.faceDownCards : [];
  const faceUpCards = Array.isArray(opponent.faceUpCards) ? opponent.faceUpCards : [];
  
  const totalCards = handCards.length + faceDownCards.length + faceUpCards.length;
  const hasNoCardsLeft = totalCards === 0;

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
    <div className={`p-4 rounded-lg border-2 ${hasNoCardsLeft ? 'bg-green-100 border-green-300' : 'border-shithead-primary/50 shadow-md'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-tusker uppercase">{opponent.name}</h3>
        {hasNoCardsLeft && (
          <span className="text-sm text-green-700 font-medium">No cards left!</span>
        )}
      </div>

      <div className="flex gap-4">
        <div>
          {/* Removed the "Hand" label */}
          <div className="flex items-center">
            <div className="flex relative">
              {Array.from({ length: Math.min(3, handCards.length) }).map((_, i) => (
                <div
                  key={`hand-${i}`}
                  className="w-8 h-12 bg-shithead-card-back bg-card-texture rounded-lg shadow-sm border border-gray-800/20"
                ></div>
              ))}
            </div>
            {handCards.length === 0 && (
              <span className="text-xs text-gray-500">No cards</span>
            )}
          </div>
        </div>

        <div>
          {/* Removed the "Face Down/Up" label */}
          <div className="flex items-center">
            {/* Card layout with relative positioning */}
            <div className="relative">
              {/* Face down cards - bottom layer */}
              <div className="flex relative z-0">
                {Array.from({ length: Math.min(3, faceDownCards.length) }).map((_, i) => (
                  <div
                    key={`face-down-${i}`}
                    className="w-8 h-12 bg-shithead-card-back bg-card-texture rounded-lg shadow-sm border border-gray-800/20"
                  ></div>
                ))}
                {faceDownCards.length === 0 && (
                  <span className="text-xs text-gray-500">No cards</span>
                )}
              </div>

              {/* Face up cards - top layer, with margin */}
              {faceUpCards.length > 0 && (
                <div className="flex absolute top-0 left-0 mt-1 z-10">
                  {Array.from({ length: Math.min(3, faceUpCards.length) }).map((_, i) => {
                    const card = faceUpCards[i];
                    return (
                      <div
                        key={`face-up-${i}`}
                        className="w-8 h-12 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center"
                      >
                        <div className={`text-xs ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                          {card.rank}
                          <span>{getSuitSymbol(card.suit)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentDisplay;
