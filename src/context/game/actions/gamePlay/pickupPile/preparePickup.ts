
import { CardValue } from '@/types/game';
import { getUniqueCards, cardToString, copyCard } from '@/utils/gameUtils';

export const preparePickup = (
  existingHand: CardValue[],
  pile: CardValue[]
): { 
  finalHand: CardValue[]; 
  uniqueCardsToAdd: CardValue[];
  pileToPickup: CardValue[];
} => {
  // Make a deep copy of the pile, excluding special cards (3, 10, 8)
  const pileToPickup = pile
    .filter(card => card.rank !== '3' && card.rank !== '10' && card.rank !== '8')
    .map(copyCard);
  
  console.log(`Pile to pickup: ${pileToPickup.length} cards after filtering special cards`);
  
  // Track all existing card IDs to avoid duplicates
  const existingCardIds = new Set(existingHand.map(cardToString));
  
  // Filter cards in the pile that are already in the player's hand
  const uniqueCardsToAdd = pileToPickup.filter(card => {
    const cardId = cardToString(card);
    if (existingCardIds.has(cardId)) {
      console.warn(`Prevented duplicate card from being added: ${cardId}`);
      return false;
    }
    existingCardIds.add(cardId);
    return true;
  });
  
  console.log(`Unique cards to add: ${uniqueCardsToAdd.length} cards`);
  
  // Create a complete new hand with deep copies of all cards
  const newHand = [...existingHand, ...uniqueCardsToAdd];
  
  // Double-check for any duplicates that might have slipped through
  const finalHand = getUniqueCards(newHand);
  
  console.log(`Final hand will have ${finalHand.length} cards`);
  
  return { finalHand, uniqueCardsToAdd, pileToPickup };
};
