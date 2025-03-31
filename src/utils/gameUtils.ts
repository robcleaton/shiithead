
import { Json } from '@/integrations/supabase/types';
import { CardValue, Suit, Rank } from '@/types/game';

const ukSwearWords = [
  'bloody', 'bugger', 'bollocks', 'wanker', 'tosser', 'muppet', 'git', 
  'prat', 'pillock', 'plonker', 'twat', 'berk', 'naff', 'sod', 'twit', 
  'numpty', 'knob', 'daft', 'piss', 'arse', 'blighter', 'chav', 'minger', 
  'munter', 'nitwit', 'prick', 'twerp', 'mong', 'dodgy', 'gormless'
];

export const generateId = () => {
  if (window.location.pathname === "/" || window.location.pathname.includes("/game")) {
    const randomNum = Math.floor(Math.random() * 1000);
    const word1 = ukSwearWords[Math.floor(Math.random() * ukSwearWords.length)];
    const word2 = ukSwearWords[Math.floor(Math.random() * ukSwearWords.length)];
    return `${word1}-${word2}-${randomNum}`;
  }
  return Math.random().toString(36).substring(2, 9);
};

export const createDeck = (): CardValue[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: CardValue[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

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
