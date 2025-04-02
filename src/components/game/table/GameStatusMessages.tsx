
import React from 'react';

interface GameStatusMessagesProps {
  isThreeOnTop: boolean;
  isTenOnTop: boolean;
  isEightOnTop: boolean;
  isCurrentPlayer: boolean;
}

const GameStatusMessages: React.FC<GameStatusMessagesProps> = ({ 
  isThreeOnTop, 
  isTenOnTop, 
  isEightOnTop, 
  isCurrentPlayer 
}) => {
  if (!isThreeOnTop && !isTenOnTop && !isEightOnTop) {
    return null;
  }
  
  return (
    <div className="text-center mt-4 text-xs text-shithead-foreground/70">
      {isThreeOnTop && (
        <p className="font-medium text-orange-600 mb-1">Three has been played! {isCurrentPlayer ? "You must" : "Current player must"} pick up the pile or play another 3.</p>
      )}
      {isTenOnTop && (
        <p className="font-medium text-orange-500 mb-1">10 has been played! The entire discard pile has been burned!</p>
      )}
      {isEightOnTop && (
        <p className="font-medium text-blue-500 mb-1">8 has been played! This card is transparent - play on the card below it.</p>
      )}
    </div>
  );
};

export default GameStatusMessages;
