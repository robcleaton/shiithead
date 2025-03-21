
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RulesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Rules = ({ open, onOpenChange }: RulesProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-karma-primary">Karma Card Game Rules</DialogTitle>
          <DialogDescription>
            Learn how to play the Karma card game
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 text-karma-foreground">
            <section>
              <h3 className="text-lg font-semibold mb-2">Objective</h3>
              <p>Be the first player to get rid of all your cards to win the game!</p>
            </section>
            
            <section>
              <h3 className="text-lg font-semibold mb-2">Setup</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>The game is played with a standard 52-card deck.</li>
                <li>Each player is dealt 7 cards, which form their hand.</li>
                <li>The remaining cards form the draw pile.</li>
                <li>The top card from the draw pile is turned face up to start the discard pile.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-lg font-semibold mb-2">Gameplay</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>On your turn, you must play a card that matches either the rank or suit of the top card on the discard pile.</li>
                <li>If you cannot play a card, you must draw a card from the draw pile. If the drawn card can be played, you may play it immediately.</li>
                <li>If the draw pile is empty, you skip your turn.</li>
                <li>Play continues clockwise until a player has no cards left.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-lg font-semibold mb-2">Special Cards</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>2:</strong> The next player must draw two cards and skip their turn.</li>
                <li><strong>8:</strong> Skip the next player's turn.</li>
                <li><strong>Jack:</strong> Choose a new suit to play.</li>
                <li><strong>Ace:</strong> Any player can play on an Ace, regardless of the normal playing order. If no one plays within 5 seconds, normal play continues.</li>
              </ul>
              <p className="mt-2 italic text-sm text-karma-foreground/70">Note: Special card rules are not implemented in this version of the game.</p>
            </section>
            
            <section>
              <h3 className="text-lg font-semibold mb-2">Winning the Game</h3>
              <p>The first player to have no cards left wins the game!</p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Rules;
