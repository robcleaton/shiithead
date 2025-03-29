
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
  
  // Create a set of existing card IDs to check for duplicates
  const existingCardIds = new Set(existingHand.map(cardToString));
  
  // Filter out cards that are already in the player's hand
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
  
  // Create a final hand with deep copies of all cards
  const newHandCards = [...existingHand.map(copyCard), ...uniqueCardsToAdd.map(copyCard)];
  
  // Double-check for any duplicates in the new hand
  const finalHand = getUniqueCards(newHandCards);
  
  console.log(`Final hand will have ${finalHand.length} cards after deduplication`);
  
  return { finalHand, uniqueCardsToAdd, pileToPickup };
};
