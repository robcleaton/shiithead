
import { toast } from 'sonner';
import { Player, CardValue } from '@/types/game';

// Function to display toast messages related to card plays and game events
export const displayMessages = (
  player: Player,
  cardToPlay: CardValue,
  burnMessage: string | null,
  cardPlayedFromType: 'faceUp' | 'faceDown' | 'hand',
  wasEmptyPile: boolean,
  gameOver: boolean,
  statusMessage: string | null
): void => {
  // Display messages based on card played
  if (burnMessage) {
    toast.success(`${player.name} ${burnMessage} ${player.name} gets another turn.`);
  } else if (cardToPlay.rank === '2') {
    toast.success(`${player.name} played a 2 - they get another turn!`);
  } else if (cardToPlay.rank === '3') {
    if (wasEmptyPile) {
      if (cardPlayedFromType === 'hand' && player.faceUpCards.length <= 2) {
        toast.success(`${player.name} played a 3 on an empty pile - next player's turn is skipped!`);
      } else {
        toast.success(`${player.name} played a 3 on an empty pile - pile is emptied and ${player.name} gets another turn!`);
      }
    } else {
      toast.success(`${player.name} played a 3 - next player must pick up the pile or play a 3!`);
    }
  } else if (cardToPlay.rank === '7') {
    toast.success(`${player.name} played a 7 - the next player must play a card of rank lower than 7 or another 7!`);
  } else if (cardToPlay.rank === '8') {
    toast.success(`${player.name} played an 8 - this card is invisible, the next player can play any card!`);
  } else {
    let sourceText = '';
    if (cardPlayedFromType === 'faceUp') {
      sourceText = 'from their face up cards';
    } else if (cardPlayedFromType === 'faceDown') {
      sourceText = 'from their face down cards';
    }
    toast.success(`${player.name} played a ${cardToPlay.rank} of ${cardToPlay.suit} ${sourceText}!`);
  }
  
  // Display game status message
  if (gameOver) {
    toast.success(`${player.name} has won the game!`);
  } else if (statusMessage) {
    toast.info(statusMessage);
  }
};
