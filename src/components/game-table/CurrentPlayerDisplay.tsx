
import React from 'react';

interface CurrentPlayerDisplayProps {
  currentPlayer: string;
}

const CurrentPlayerDisplay: React.FC<CurrentPlayerDisplayProps> = ({ currentPlayer }) => {
  return (
    <div className="flex justify-center items-center mb-4">
      <span className="px-3 py-1 bg-karma-secondary/50 rounded-full text-xs">
        Current Player: <strong>{currentPlayer}</strong>
      </span>
    </div>
  );
};

export default CurrentPlayerDisplay;
