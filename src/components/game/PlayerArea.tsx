
import { Player } from '@/types/game';
import PlayerHand from '@/components/PlayerHand';

interface PlayerAreaProps {
  player: Player;
  isActive: boolean;
  onPlayCard: (cardIndex: number | number[]) => void;
}

const PlayerArea = ({ player, isActive, onPlayCard }: PlayerAreaProps) => {
  return (
    <div className="w-full max-w-3xl">
      <div className="flex justify-center gap-1 mb-6">
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Face Down</div>
          <div className="flex gap-2">
            {player.faceDownCards.map((_, index) => (
              <div 
                key={index}
                className="w-12 h-16 bg-karma-card-back bg-card-texture rounded-lg shadow-md border border-gray-800/20"
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
                className="w-12 h-16 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center"
              >
                <div className={`text-lg ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                  {card.rank}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <PlayerHand
        cards={player.hand}
        isActive={isActive}
        onPlayCard={onPlayCard}
      />
    </div>
  );
};

export default PlayerArea;
