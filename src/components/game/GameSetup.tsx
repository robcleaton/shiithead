
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
  console.log('Player face up cards:', player.faceUpCards);
  console.log('Player is ready:', player.isReady);

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  // Calculate remaining selections needed
  const remainingSelectionsNeeded = 3 - (player.faceUpCards?.length || 0);

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <div className="flex flex-col gap-8 items-center">
        <div className="text-center mb-4">
          <h2 className="text-4xl mb-2 font-tusker">Setup Your Cards</h2>
          <p className="text-shithead-foreground/80">
            Select 3 cards from your hand to place face-up on your 3 face-down cards
          </p>
          <div className="mt-4 flex justify-center gap-1 flex-wrap">
            {players.map(p => (
              <div key={p.id} className={`px-3 py-1 rounded-full text-xs font-medium ${p.isReady ? 'bg-green-200/20 text-green-100' : 'bg-gray-200 text-gray-600'}`}>
                {p.name} {p.isReady ? '✓' : '...'}
              </div>
            ))}
          </div>
        </div>

        {/* Card layout container with relative positioning */}
        <div className="relative w-full flex justify-center">
          {/* Face Down Cards - positioned at the bottom layer */}
          <div className="flex justify-center gap-4 z-0">
            {player.faceDownCards && player.faceDownCards.length > 0 ? (
              player.faceDownCards.map((_, index) => (
                <div
                  key={index}
                  className="w-14 h-20 bg-shithead-card-back bg-card-texture rounded-lg shadow-md border border-gray-800/20"
                />
              ))
            ) : (
              <div className="text-center p-4 text-gray-200">
                No face-down cards available
              </div>
            )}
          </div>
          
          {/* Face Up Cards - positioned with negative margin to overlay */}
          <div className="flex justify-center gap-4 absolute top-0 left-0 right-0 mt-3 z-10">
            {player.faceUpCards && player.faceUpCards.length > 0 ? (
              player.faceUpCards.map((card, index) => (
                <div
                  key={`${card.suit}-${card.rank}-${index}`}
                  className="w-14 h-20 bg-white rounded-lg shadow flex items-center justify-center border border-gray-200"
                >
                  <div className={`text-2xl ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                    {card.rank}
                    <span className="text-xl">
                      {getSuitSymbol(card.suit)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <></>
            )}
            
            {/* Empty placeholders for remaining cards */}
            {remainingSelectionsNeeded > 0 && Array(remainingSelectionsNeeded).fill(0).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-14 h-20 bg-gray-100/70 backdrop-blur-sm rounded-lg border border-dashed border-gray-300 flex items-center justify-center"
              >
                <span className="text-gray-400 text-xs">Select</span>
              </div>
            ))}
          </div>
        </div>

        {/* Display remaining selections needed if not ready */}
        {!player.isReady && remainingSelectionsNeeded > 0 && (
          <div className="my-2 text-center">
            <span className="bg-shithead-primary text-white px-3 py-1 rounded-full text-sm font-medium">
              Select {remainingSelectionsNeeded} more card{remainingSelectionsNeeded !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Player Hand */}
        <div className="w-full max-w-3xl mt-4">
          {player.hand && player.hand.length > 0 ? (
            <PlayerHand
              cards={player.hand}
              isActive={true} // Always active during setup phase
              onPlayCard={(index) => selectFaceUpCard(index)}
              onSelectMultipleCards={(indices) => selectMultipleFaceUpCards(indices)}
              isSetupPhase={true}
              maxSelections={remainingSelectionsNeeded}
            />
          ) : (
            <div className="text-center p-4 text-gray-200">
              No cards in hand. Please try refreshing the page.
            </div>
          )}
        </div>

        {player.isReady && (
          <div className="mt-4 flex flex-col items-center">
            <p className="text-center text-green-100 mb-2">You've selected all your face-up cards</p>
            {isHost && (
              <Button
                onClick={completeSetup}
                className="bg-shithead-primary hover:bg-shithead-primary/90"
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
