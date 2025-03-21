
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

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
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 rounded-lg bg-karma-muted/30 border border-karma-border"
            >
              <h3 className="text-lg font-semibold mb-2 text-karma-primary">Objective</h3>
              <p>Be the first player to get rid of all your cards to win the game!</p>
            </motion.section>
            
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-4 rounded-lg bg-karma-muted/30 border border-karma-border"
            >
              <h3 className="text-lg font-semibold mb-2 text-karma-primary">Setup</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>The game is played with a standard 52-card deck.</li>
                <li>Each player is dealt 6 cards which form their hand, 3 are to be placed face up and used when the deck and their hand is empty.</li>
                <li>Each player also receives 3 face-down cards that remain unknown until played.</li>
                <li>The remaining cards form the draw pile.</li>
                <li>The top card from the draw pile is turned face up to start the discard pile.</li>
              </ul>
            </motion.section>
            
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-4 rounded-lg bg-karma-muted/30 border border-karma-border"
            >
              <h3 className="text-lg font-semibold mb-2 text-karma-primary">Gameplay</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>On your turn, you must play a card that matches the rank of the top card on the discard pile.</li>
                <li>If you cannot play a card, you must draw a card from the draw pile. If the drawn card can be played, you may play it immediately.</li>
                <li>If the draw pile is empty, you skip your turn.</li>
                <li>Play continues clockwise until a player has no cards left.</li>
              </ul>
            </motion.section>
            
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="p-4 rounded-lg bg-karma-muted/30 border border-karma-border"
            >
              <h3 className="text-lg font-semibold mb-2 text-karma-primary">Special Cards</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>2:</strong> Can be placed on any card regardless of rank. The player that lays it has another go and can place any card on top.</li>
                <li><strong>7:</strong> Can be played on any card regardless of rank. After a 7 is played, the next player must play a card of rank 7 or lower.</li>
                <li><strong>8:</strong> Skip the next player's turn.</li>
                <li><strong>10:</strong> Can be played on any card except a 7. It burns the entire discard pile, removing those cards from the game. The player then gets another turn to play any card.</li>
              </ul>
              <p className="mt-2">Aces are high cards (value higher than King) but have no special abilities.</p>
              <p className="mt-2 italic text-sm text-karma-foreground/70">Note: Only the 7 and 10 special card rules are currently implemented in this version of the game.</p>
            </motion.section>
            
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="p-4 rounded-lg bg-karma-muted/30 border border-karma-border"
            >
              <h3 className="text-lg font-semibold mb-2 text-karma-primary">Winning the Game</h3>
              <p>The first player to have no cards left wins the game!</p>
            </motion.section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Rules;
