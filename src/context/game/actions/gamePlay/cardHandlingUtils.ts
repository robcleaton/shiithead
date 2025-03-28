
import { CardValue, Player, GameState } from '@/types/game';

// Process the player's hand after playing cards
export const processPlayerHand = (
  player: Player,
  sortedIndices: number[],
  state: { deck: CardValue[] }
): {
  finalHand: CardValue[],
  updatedFaceUpCards: CardValue[],
  updatedFaceDownCards: CardValue[],
  updatedDeck: CardValue[]
} => {
  // Create a new hand array, removing the played cards
  const updatedHand = [...player.hand];
  for (const index of sortedIndices) {
    updatedHand.splice(index, 1);
  }
  
  // Make a copy of the deck for drawing cards
  const updatedDeck = [...state.deck];
  let updatedFaceDownCards = [...player.faceDownCards];
  
  // Check for moving face-up cards to hand when hand is empty and deck is empty
  let finalHand = [...updatedHand];
  let updatedFaceUpCards = [...player.faceUpCards];
  
  if (finalHand.length === 0 && updatedDeck.length === 0 && updatedFaceUpCards.length > 0) {
    // Move face-up cards to hand
    finalHand = [...updatedFaceUpCards];
    updatedFaceUpCards = [];
  } else if (finalHand.length === 0 && updatedFaceUpCards.length === 0 && updatedFaceDownCards.length > 0) {
    // When no cards in hand, no face up cards, and face down cards exist
    // Move face down cards to hand
    finalHand = [...updatedFaceDownCards];
    updatedFaceDownCards = [];
    console.log(`Moved ${finalHand.length} face down cards to hand`);
  } else {
    // Draw cards from the deck if needed
    const cardsToDrawCount = Math.max(0, 3 - updatedHand.length);
    
    console.log(`Drawing ${cardsToDrawCount} cards from deck (${updatedDeck.length} cards available)`);
    
    const drawnCards = [];
    
    for (let i = 0; i < cardsToDrawCount && updatedDeck.length > 0; i++) {
      const card = updatedDeck.pop()!;
      drawnCards.push(card);
      console.log(`Drew card: ${card.rank} of ${card.suit}, deck now has ${updatedDeck.length} cards`);
    }
    
    finalHand = [...updatedHand, ...drawnCards];
  }
  
  return { finalHand, updatedFaceUpCards, updatedFaceDownCards, updatedDeck };
};

// Determine the next player's ID based on game rules
export const determineNextPlayer = (
  state: { players: Player[], currentPlayerId: string | null },
  player: Player,
  cardsToPlay: CardValue[],
  shouldGetAnotherTurn: boolean,
  wasEmptyPile: boolean = false
): string => {
  // If a 3 was played on an empty pile, skip the next player's turn
  const isThreePlayed = cardsToPlay.some(card => card.rank === '3');
  
  if (shouldGetAnotherTurn || cardsToPlay.some(card => card.rank === '2')) {
    return state.currentPlayerId || player.id;
  }
  
  const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
  
  // If a 3 was played on an empty pile, skip one player
  if (isThreePlayed && wasEmptyPile) {
    const skipIndex = (currentPlayerIndex + 2) % state.players.length;
    return state.players[skipIndex].id;
  }
  
  const nextIndex = (currentPlayerIndex + 1) % state.players.length;
  return state.players[nextIndex].id;
};

// Generate status message for the played cards
export const generateCardPlayMessage = (
  playerName: string,
  cardsToPlay: CardValue[],
  burnMessage: string | null,
  wasEmptyPile: boolean = false
): string => {
  if (burnMessage) {
    return `${playerName} ${burnMessage} ${playerName} gets another turn.`;
  }
  
  if (cardsToPlay.length > 1) {
    return `${playerName} played ${cardsToPlay.length} ${cardsToPlay[0].rank}s!`;
  }
  
  const rank = cardsToPlay[0].rank;
  
  if (rank === '2') {
    return `${playerName} played a 2 - they get another turn!`;
  } else if (rank === '3') {
    if (wasEmptyPile) {
      return `${playerName} played a 3 on an empty pile - next player's turn is skipped!`;
    }
    return `${playerName} played a 3 - next player must pick up the pile or play a 3!`;
  } else if (rank === '7') {
    return `${playerName} played a 7 - the next player must play a card of rank lower than 7 or another 7!`;
  } else if (rank === '8') {
    return `${playerName} played an 8 - this card is invisible, the next player can play any card!`;
  }
  
  return `${playerName} played a ${rank}!`;
};

// Generate game status messages based on player's remaining cards
export const generateGameStatusMessage = (
  player: Player,
  finalHand: CardValue[],
  updatedFaceUpCards: CardValue[],
  updatedFaceDownCards: CardValue[],
  state: { deck: CardValue[] }
): { gameOver: boolean, statusMessage: string | null } => {
  const gameOver = finalHand.length === 0 && updatedFaceUpCards.length === 0 && updatedFaceDownCards.length === 0;
  let statusMessage = null;
  
  if (gameOver) {
    statusMessage = `${player.name} has won the game!`;
  } else if (finalHand.length === 0 && updatedFaceUpCards.length === 0 && updatedFaceDownCards.length === 1) {
    statusMessage = `${player.name} is down to their last card!`;
  } else if (finalHand.length === 0 && updatedFaceUpCards.length === 0 && player.faceDownCards.length > 0 && updatedFaceDownCards.length === 0) {
    statusMessage = `${player.name}'s face-down cards have been moved to their hand`;
  } else if (finalHand.length === 0 && state.deck.length === 0 && updatedFaceUpCards.length === 0 && updatedFaceDownCards.length > 0) {
    statusMessage = `${player.name} must now play their face-down cards!`;
  } else if (finalHand.length === 0 && state.deck.length === 0 && player.faceUpCards.length > 0) {
    statusMessage = `${player.name}'s face-up cards have been moved to their hand`;
  }
  
  return { gameOver, statusMessage };
};
