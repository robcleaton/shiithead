
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { Check } from 'lucide-react';
import PlayerHand from '@/components/PlayerHand';

interface GameSetupProps {
  player: Player;
  players: Player[];
  isHost: boolean;
  completeSetup: () => void;
  selectFaceUpCard: (cardIndex: number | number[]) => void;
  selectMultipleFaceUpCards: (cardIndices: number[]) => void;
  onOpenRules: () => void;
}

const GameSetup = ({
  player,
  players,
  isHost,
  completeSetup,
  selectFaceUpCard,
  selectMultipleFaceUpCards,
  onOpenRules
}: GameSetupProps) => {
  console.log('Rendering setup phase UI with player:', player);
  console.log('Player hand:', player.hand);
  
  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <div className="flex flex-col gap-8 items-center">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold mb-2">Setup Your Cards</h2>
          <p className="text-karma-foreground/80">
            Select 3 cards from your hand to place face-up on your 3 face-down cards
          </p>
          <div className="mt-4 flex justify-center gap-1 flex-wrap">
            {players.map(p => (
              <div key={p.id} className={`px-3 py-1 rounded-full text-xs font-medium ${p.isReady ? 'bg-green-500/20 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {p.name} {p.isReady ? '✓' : '...'}
              </div>
            ))}
          </div>
        </div>

        {/* Face Down Cards */}
        <div className="flex justify-center gap-4">
          {player.faceDownCards && player.faceDownCards.length > 0 ? (
            player.faceDownCards.map((_, index) => (
              <div 
                key={index}
                className="w-14 h-20 bg-karma-card-back bg-card-texture rounded-lg shadow-md border border-gray-800/20"
              />
            ))
          ) : (
            <div className="text-center p-4 text-gray-500">
              No face-down cards available
            </div>
          )}
        </div>

        {/* Face Up Cards */}
        <div className="flex justify-center gap-4 mt-2">
          {player.faceUpCards && player.faceUpCards.length > 0 ? (
            player.faceUpCards.map((card, index) => (
              <div 
                key={`${card.suit}-${card.rank}-${index}`}
                className="w-14 h-20 bg-white rounded-lg shadow flex items-center justify-center border border-gray-200"
              >
                <div className={`text-2xl ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                  {card.rank}
                  {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                </div>
              </div>
            ))
          ) : (
            Array(3 - (player.faceUpCards ? player.faceUpCards.length : 0)).fill(0).map((_, i) => (
              <div 
                key={`empty-${i}`}
                className="w-14 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center"
              >
                <span className="text-gray-400 text-xs">Select</span>
              </div>
            ))
          )}
        </div>

        {/* Player Hand */}
        <div className="w-full max-w-3xl mt-8">
          {player.hand && player.hand.length > 0 ? (
            <PlayerHand
              cards={player.hand}
              isActive={true}
              onPlayCard={(index) => selectFaceUpCard(index)}
              onSelectMultipleCards={(indices) => selectMultipleFaceUpCards(indices)}
              isSetupPhase={true}
              maxSelections={3 - (player.faceUpCards?.length || 0)}
            />
          ) : (
            <div className="text-center p-4 text-gray-500">
              No cards in hand. Please try refreshing the page.
            </div>
          )}
        </div>

        {player.isReady && (
          <div className="mt-4">
            <p className="text-center text-green-600 mb-2">You've selected all your face-up cards</p>
            {isHost && (
              <Button 
                onClick={completeSetup}
                className="bg-karma-primary hover:bg-karma-primary/90"
                disabled={!players.every(p => p.isReady)}
              >
                <Check className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSetup;
