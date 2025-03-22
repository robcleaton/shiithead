
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface RulesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Rules = ({ open, onOpenChange }: RulesProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("objective");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-karma-primary">Karma Card Game Rules</DialogTitle>
          <DialogDescription>
            Learn how to play the Karma card game (also known as Shithead)
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 text-karma-foreground">
            {/* Objective Section */}
            <Collapsible
              open={expandedSection === "objective"}
              onOpenChange={() => toggleSection("objective")}
              className="rounded-lg border border-karma-border bg-karma-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-karma-primary">Objective</h3>
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
              className="rounded-lg border border-karma-border bg-karma-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-karma-primary">Setup</h3>
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
            
            {/* Card Ranking Section */}
            <Collapsible
              open={expandedSection === "cardRanking"}
              onOpenChange={() => toggleSection("cardRanking")}
              className="rounded-lg border border-karma-border bg-karma-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-karma-primary">Card Ranking</h3>
                {expandedSection === "cardRanking" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <p className="mb-2">Cards are ranked from lowest to highest as follows:</p>
                <p className="mb-2">2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A</p>
                <p>Note that in some variations, 2 is considered high (above Ace) or special cards have different effects.</p>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Gameplay Section */}
            <Collapsible
              open={expandedSection === "gameplay"}
              onOpenChange={() => toggleSection("gameplay")}
              className="rounded-lg border border-karma-border bg-karma-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-karma-primary">Gameplay</h3>
                {expandedSection === "gameplay" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Players take turns clockwise.</li>
                  <li>On your turn, you must play a card of equal or higher rank than the top card on the discard pile.</li>
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
              className="rounded-lg border border-karma-border bg-karma-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-karma-primary">Special Cards</h3>
                {expandedSection === "specialCards" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>2:</strong> Can be placed on any card regardless of rank. The player that lays it has another go and can place any card on top.</li>
                  <li><strong>3:</strong> Can be placed on any card regardless of rank. No additional effects.</li>
                  <li><strong>7:</strong> After a 7 is played, the next player must play a card of rank 7 or lower.</li>
                  <li><strong>8:</strong> An invisible card - play continues as if it wasn't played (next player must match the card beneath the 8).</li>
                  <li><strong>10:</strong> Burns the pile. The entire discard pile is removed from the game, and the player gets another turn.</li>
                  <li><strong>Four of a kind:</strong> Playing 4 cards of the same rank burns the pile (just like a 10).</li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Advanced Rules Section */}
            <Collapsible
              open={expandedSection === "advancedRules"}
              onOpenChange={() => toggleSection("advancedRules")}
              className="rounded-lg border border-karma-border bg-karma-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-karma-primary">Advanced Rules</h3>
                {expandedSection === "advancedRules" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Burn on 10:</strong> If the pile has a value of 10 (e.g., a 10 or a combination of cards adding up to 10), you can burn the pile.</li>
                  <li><strong>Sandwich Rule:</strong> If a player plays a card that matches the card 2 places below it in the pile, the pile is burned.</li>
                  <li><strong>9 Reverses:</strong> Playing a 9 reverses the direction of play.</li>
                  <li><strong>Jack Skips:</strong> Playing a Jack skips the next player's turn.</li>
                </ul>
                <p className="mt-2 italic text-sm text-karma-foreground/70">Note: These advanced rules are common variations but may not be implemented in this version of the game.</p>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Strategy Tips Section */}
            <Collapsible
              open={expandedSection === "strategyTips"}
              onOpenChange={() => toggleSection("strategyTips")}
              className="rounded-lg border border-karma-border bg-karma-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-karma-primary">Strategy Tips</h3>
                {expandedSection === "strategyTips" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <ul className="list-disc pl-5 space-y-2">
                  <li>During setup, place your highest cards face-up to ensure you can play over most cards.</li>
                  <li>Save special cards (2s, 10s) for when you're playing your face-down cards.</li>
                  <li>Try to remember what cards have been played to anticipate what's coming.</li>
                  <li>If possible, keep cards of the same rank in your hand to play multiple cards at once.</li>
                  <li>When playing face-down cards, it's best to have burned the pile right before, so you can play any card.</li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Winning Section */}
            <Collapsible
              open={expandedSection === "winning"}
              onOpenChange={() => toggleSection("winning")}
              className="rounded-lg border border-karma-border bg-karma-muted/30"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                <h3 className="text-lg font-semibold text-karma-primary">Winning the Game</h3>
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
