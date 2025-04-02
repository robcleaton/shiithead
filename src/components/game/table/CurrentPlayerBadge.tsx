
import React from 'react';

interface CurrentPlayerBadgeProps {
  currentPlayer: string;
}

const CurrentPlayerBadge: React.FC<CurrentPlayerBadgeProps> = ({ currentPlayer }) => {
  return (
    <div className="flex justify-center items-center mb-4">
      <span className="px-3 py-1 bg-shithead-secondary/50 rounded-full text-xs">
        Current Player: <strong>{currentPlayer}</strong>
      </span>
    </div>
  );
};

export default CurrentPlayerBadge;
