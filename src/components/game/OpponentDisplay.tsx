
import { Player } from '@/types/game';

interface OpponentDisplayProps {
  opponent: Player;
}

const OpponentDisplay = ({ opponent }: OpponentDisplayProps) => {
  const totalCards = opponent.hand.length + opponent.faceUpCards.length + opponent.faceDownCards.length;
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
    <div className={`p-4 rounded-lg ${hasNoCardsLeft ? 'bg-green-100 border-green-300' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-tusker uppercase">{opponent.name}</h3>
        {hasNoCardsLeft && (
          <span className="text-sm text-green-700 font-medium">No cards left!</span>
        )}
      </div>

      <div className="flex gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Hand</div>
          <div className="flex items-center">
            <div className="flex -space-x-2 relative">
              {Array.from({ length: Math.min(3, opponent.hand.length) }).map((_, i) => (
                <div
                  key={`hand-${i}`}
                  className="w-8 h-12 bg-shithead-card-back bg-card-texture rounded-lg shadow-sm border border-gray-800/20"
                ></div>
              ))}
            </div>
            {opponent.hand.length === 0 && (
              <span className="text-xs text-gray-500">No cards</span>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-100 mb-1">Face Up</div>
          <div className="flex items-center">
            <div className="flex -space-x-2 relative">
              {Array.from({ length: Math.min(3, opponent.faceUpCards.length) }).map((_, i) => (
                <div
                  key={`face-up-${i}`}
                  className="w-8 h-12 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center"
                >
                  <div className={`text-xs ${opponent.faceUpCards[i].suit === 'hearts' || opponent.faceUpCards[i].suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                    {opponent.faceUpCards[i].rank}
                    <span>{getSuitSymbol(opponent.faceUpCards[i].suit)}</span>
                  </div>
                </div>
              ))}
            </div>
            {opponent.faceUpCards.length === 0 && (
              <span className="text-xs text-gray-500">No cards</span>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-100 mb-1">Face Down</div>
          <div className="flex items-center">
            <div className="flex -space-x-2 relative">
              {Array.from({ length: Math.min(3, opponent.faceDownCards.length) }).map((_, i) => (
                <div
                  key={`face-down-${i}`}
                  className="w-8 h-12 bg-shithead-card-back bg-card-texture rounded-lg shadow-sm border border-gray-800/20"
                ></div>
              ))}
            </div>
            {opponent.faceDownCards.length === 0 && (
              <span className="text-xs text-gray-500">No cards</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentDisplay;
