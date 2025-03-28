
import { Json } from '@/integrations/supabase/types';
import { CardValue, Suit, Rank } from '@/types/game';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const createDeck = (): CardValue[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: CardValue[] = [];

  // Create exactly one card of each suit and rank combination (52 cards total)
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // Verify we have exactly 52 cards
  if (deck.length !== 52) {
    console.error(`Deck generation error: Created ${deck.length} cards instead of 52`);
  }

  return deck;
};

export const jsonToCardValues = (json: Json | null): CardValue[] => {
  if (!json) return [];
  
  try {
    if (Array.isArray(json)) {
      return json.map(card => {
        if (typeof card === 'object' && card !== null && 'suit' in card && 'rank' in card) {
          return {
            suit: card.suit as Suit,
            rank: card.rank as Rank
          };
        }
        throw new Error('Invalid card format');
      });
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
    }
  });
  
  return Object.values(uniqueCards);
};
