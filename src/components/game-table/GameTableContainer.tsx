
import React from 'react';
import { cn } from '@/lib/utils';

interface GameTableContainerProps {
  children: React.ReactNode;
}

const GameTableContainer: React.FC<GameTableContainerProps> = ({ children }) => {
  return (
    <div className="w-full max-w-2xl p-6 bg-karma-muted/30 backdrop-blur-sm rounded-xl border border-karma-border shadow-sm relative">
      {children}
    </div>
  );
};

export default GameTableContainer;
