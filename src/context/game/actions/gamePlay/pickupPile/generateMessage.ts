
export const generatePickupMessage = (
  playerName: string,
  uniqueCardsCount: number,
  specialCardsCount: number
): string => {
  let message = `${playerName} picked up ${uniqueCardsCount} card${uniqueCardsCount !== 1 ? 's' : ''}`;
  
  if (specialCardsCount > 0) {
    message += `. ${specialCardsCount} special card${specialCardsCount !== 1 ? 's were' : ' was'} removed from the game.`;
  }
  
  return message;
};
