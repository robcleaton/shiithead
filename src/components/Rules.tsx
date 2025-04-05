
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Card as UICard, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import Card from "@/components/Card";
import { CardValue } from "@/types/game";

interface RulesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Rules = ({ open, onOpenChange }: RulesProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("objective");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Sample cards for display in the rules
  const specialCards: Record<string, CardValue> = {
    ace: { suit: "spades", rank: "A" },
    two: { suit: "hearts", rank: "2" },
    three: { suit: "diamonds", rank: "3" },
    seven: { suit: "clubs", rank: "7" },
    eight: { suit: "spades", rank: "8" },
    ten: { suit: "hearts", rank: "10" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-shithead-primary">Shithead Rules</DialogTitle>
          <DialogDescription>
            Learn how to play the shithead card game (also known as Shithead)
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 text-shithead-foreground">
            {/* Objective Section */}
            <Collapsible
              open={expandedSection === "objective"}
              onOpenChange={() => toggleSection("objective")}
              className="rounded-lg border border-shithead-border bg-shithead-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-shithead-primary">Objective</h3>
                {expandedSection === "objective" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <p>Be the first player to get rid of all your cards to win the game! The last player with cards is the "Shithead" and loses the game.</p>
              </CollapsibleContent>
            </Collapsible>

            {/* Setup Section */}
            <Collapsible
              open={expandedSection === "setup"}
              onOpenChange={() => toggleSection("setup")}
              className="rounded-lg border border-shithead-border bg-shithead-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-shithead-primary">Setup</h3>
                {expandedSection === "setup" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <ul className="list-disc pl-5 space-y-2">
                  <li>The game is played with a standard 52-card deck.</li>
                  <li>Each player is dealt 3 face-down cards (these remain unknown until played).</li>
                  <li>Each player is then dealt 3 face-up cards (placed on top of the face-down cards).</li>
                  <li>Finally, each player is dealt 3 cards to form their hand.</li>
                  <li>Players can look at their hand but not at their face-down cards.</li>
                  <li>Before the game starts, players can swap cards from their hand with their face-up cards to optimize their starting position.</li>
                  <li>The remaining cards form the draw pile.</li>
                  <li>The top card from the draw pile is turned face up to start the discard pile.</li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Gameplay Section */}
            <Collapsible
              open={expandedSection === "gameplay"}
              onOpenChange={() => toggleSection("gameplay")}
              className="rounded-lg border border-shithead-border bg-shithead-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-shithead-primary">Gameplay</h3>
                {expandedSection === "gameplay" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Players take turns clockwise.</li>
                  <li>On your turn, you must play a card of equal or higher rank than the top card on the discard pile.</li>
                  <li>Aces are the highest ranked cards in the game.</li>
                  <li>You can play multiple cards of the same rank in a single turn.</li>
                  <li>If you cannot play a card, you must pick up the entire discard pile and add it to your hand.</li>
                  <li>You must always have at least 3 cards in your hand (if possible). Draw from the draw pile after playing if needed.</li>
                  <li>Once the draw pile is empty and your hand has fewer than 3 cards, you play with what you have.</li>
                  <li>Once your hand is empty, you must play your face-up cards.</li>
                  <li>Once your face-up cards are gone, you must play your face-down cards blindly (without looking at them first).</li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Special Cards Section */}
            <Collapsible
              open={expandedSection === "specialCards"}
              onOpenChange={() => toggleSection("specialCards")}
              className="rounded-lg border border-shithead-border bg-shithead-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-shithead-primary">Special Cards</h3>
                {expandedSection === "specialCards" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="space-y-6">
                  {/* Fixed each card item layout */}
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-auto">
                      <Card card={specialCards.ace} index={0} isPlayable={false} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p><strong>Ace:</strong> Highest ranking card in the game.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-auto">
                      <Card card={specialCards.two} index={0} isPlayable={false} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p><strong>2:</strong> Can be placed on any card regardless of rank. The player that lays it has another go and can place any card on top. Additionally, any card can be played on a 2.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-auto">
                      <Card card={specialCards.three} index={0} isPlayable={false} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p><strong>3:</strong> Can be placed on any card regardless of rank. Once a player lays a 3, the next player must pick up the entire discard pile unless they also have a 3. All 3s played in sequence are removed from the game.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-auto">
                      <Card card={specialCards.seven} index={0} isPlayable={false} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p><strong>7:</strong> After a 7 is played, the next player must play a card of rank 7 or lower.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-auto">
                      <Card card={specialCards.eight} index={0} isPlayable={false} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p><strong>8:</strong> An invisible card - play continues as if it wasn't played (next player must match the card beneath the 8).</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-auto">
                      <Card card={specialCards.ten} index={0} isPlayable={false} />
                    </div>
                    <div className="flex-1 pt-2">
                      <p><strong>10:</strong> Burns the pile. The entire discard pile is removed from the game, and the player gets another turn.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-40 h-auto">
                      <div className="flex relative">
                        {['hearts', 'diamonds', 'clubs', 'spades'].map((suit, i) => (
                          <div key={suit} className="w-12 h-auto" style={{ position: 'absolute', left: `${i * 8}px`, zIndex: i }}>
                            <Card card={{ suit: suit as any, rank: 'Q' }} index={0} isPlayable={false} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 pt-2 ml-8">
                      <p><strong>Four of a kind:</strong> Playing 4 cards of the same rank burns the pile (just like a 10).</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Winning Section */}
            <Collapsible
              open={expandedSection === "winning"}
              onOpenChange={() => toggleSection("winning")}
              className="rounded-lg border border-shithead-border bg-shithead-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-shithead-primary">Winning the Game</h3>
                {expandedSection === "winning" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <p>The first player to get rid of all their cards (hand, face-up, and face-down) wins the game!</p>
                <p className="mt-2">The game continues until all players except one have finished their cards. The last player with cards is the "Shithead" and loses the game.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Rules;
