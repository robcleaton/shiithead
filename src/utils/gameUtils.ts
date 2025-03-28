import { Json } from '@/integrations/supabase/types';
import { CardValue, Suit, Rank } from '@/types/game';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const createDeck = (): CardValue[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: CardValue[] = [];
  const cardSet = new Set<string>();

  // Create exactly one card of each suit and rank combination (52 cards total)
  for (const suit of suits) {
    for (const rank of ranks) {
      const card = { suit, rank };
      const cardId = cardToString(card);
      
      // Ensure no duplicates
      if (!cardSet.has(cardId)) {
        cardSet.add(cardId);
        deck.push(card);
      }
    }
  }

  // Verify we have exactly 52 cards
  if (deck.length !== 52) {
    console.error(`Deck generation error: Created ${deck.length} cards instead of 52`);
    throw new Error(`Invalid deck: ${deck.length} cards instead of 52`);
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

export const jsonToCardValues = (json: Json | null): CardValue[] => {
  if (!json) return [];
  
  try {
    if (Array.isArray(json)) {
      // Keep track of seen cards to prevent duplicates
      const uniqueCards: Record<string, CardValue> = {};
      
      return json.map(card => {
        if (typeof card === 'object' && card !== null && 'suit' in card && 'rank' in card) {
          const cardValue = {
            suit: card.suit as Suit,
            rank: card.rank as Rank
          };
          
          // Create a unique ID for this card
          const cardId = cardToString(cardValue);
          
          // If we've already seen this card, log a warning
          if (uniqueCards[cardId]) {
            console.warn(`Duplicate card detected in JSON: ${cardId}`);
          } else {
            uniqueCards[cardId] = cardValue;
          }
          
          return cardValue;
        }
        throw new Error('Invalid card format');
      }).filter(card => card !== null); // Filter out any null values
    }
    return [];
  } catch (error) {
    console.error('Error converting JSON to CardValue[]:', error);
    return [];
  }
};

// Helper function to check if a card already exists in an array of cards
export const cardExists = (card: CardValue, cards: CardValue[]): boolean => {
  return cards.some(c => c.suit === card.suit && c.rank === card.rank);
};

// Helper function to generate a unique string ID for a card
export const cardToString = (card: CardValue): string => {
  return `${card.rank}-${card.suit}`;
};

// Get unique cards from a potentially duplicated array
export const getUniqueCards = (cards: CardValue[]): CardValue[] => {
  const uniqueCards: Record<string, CardValue> = {};
  
  cards.forEach(card => {
    const cardId = cardToString(card);
    if (!uniqueCards[cardId]) {
      uniqueCards[cardId] = {...card};
    } else {
      console.warn(`Removed duplicate card: ${cardId}`);
    }
  });
  
  return Object.values(uniqueCards);
};

// Verify the integrity of all cards in the game
export const verifyGameCards = (
  deck: CardValue[], 
  pile: CardValue[], 
  playerHands: CardValue[][]
): boolean => {
  // Create a map to track all cards
  const cardMap = new Map<string, string>();
  const addCard = (card: CardValue, source: string) => {
    const cardId = cardToString(card);
    if (cardMap.has(cardId)) {
      console.error(`Card duplicate: ${cardId} in ${source} AND ${cardMap.get(cardId)}`);
      return false;
    }
    cardMap.set(cardId, source);
    return true;
  };
  
  // Check deck
  for (const card of deck) {
    if (!addCard(card, 'deck')) return false;
  }
  
  // Check pile
  for (const card of pile) {
    if (!addCard(card, 'pile')) return false;
  }
  
  // Check player hands
  playerHands.forEach((hand, index) => {
    for (const card of hand) {
      if (!addCard(card, `player ${index} hand`)) return false;
    }
  });
  
  // Ensure we have 52 or fewer cards
  if (cardMap.size > 52) {
    console.error(`Too many unique cards: ${cardMap.size}`);
    return false;
  }
  
  return true;
};

// Create a brand new copy of a card to prevent reference issues
export const copyCard = (card: CardValue): CardValue => {
  return { suit: card.suit, rank: card.rank };
};

// Create a brand new copy of an array of cards
export const copyCards = (cards: CardValue[]): CardValue[] => {
  return cards.map(copyCard);
};
