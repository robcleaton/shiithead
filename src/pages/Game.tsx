
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';
import PlayerHand from '@/components/PlayerHand';
import GameTable from '@/components/GameTable';
import Rules from '@/components/Rules';
import Lobby from '@/components/Lobby';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const Game = () => {
  const { state, playCard, drawCard, resetGame } = useGame();
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    console.log('Game component rendered. Game started:', state.gameStarted);
    console.log('Players in game:', state.players);
  }, [state]);

  const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
  const player = state.players.find(p => p.id === state.playerId);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-karma-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-4 text-karma-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!state.gameStarted) {
    return <Lobby />;
  }

  if (state.gameOver) {
    const winner = state.players.find(p => p.hand.length === 0);
    
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center glass-card p-8 rounded-xl max-w-md w-full"
          initial={{ y: 20, scale: 0.9 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.h1 
            className="text-3xl font-bold text-karma-primary mb-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Game Over!
          </motion.h1>
          
          <motion.div
            className="my-6 py-4 bg-karma-secondary/50 rounded-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <p className="text-lg mb-1">Winner</p>
            <p className="text-2xl font-bold">{winner?.name || 'Unknown'}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Button 
              onClick={resetGame}
              className="w-full bg-karma-primary hover:bg-karma-primary/90 mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <motion.div 
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold">Karma Card Game</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRulesOpen(true)}
            className="flex items-center gap-1"
          >
            <HelpCircle className="w-4 h-4" />
            Rules
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to reset the game?")) {
                resetGame();
              }
            }}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col gap-8 items-center">
        {/* Opponent hands (if multiplayer) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.players
            .filter(p => p.id !== state.playerId)
            .map(opponent => (
              <motion.div 
                key={opponent.id}
                className="bg-karma-muted/30 backdrop-blur-sm p-4 rounded-xl border border-karma-border shadow-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-karma-primary rounded-full flex items-center justify-center text-white font-medium">
                      {opponent.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{opponent.name}</span>
                  </div>
                  <span className="text-sm px-2 py-1 bg-karma-secondary/50 rounded-full">
                    {opponent.hand.length} cards
                  </span>
                </div>
                <div className="flex justify-center">
                  {opponent.hand.map((_, index) => (
                    <div 
                      key={index}
                      className="w-12 h-16 -ml-6 first:ml-0"
                      style={{ transform: `rotate(${(index - opponent.hand.length / 2) * 5}deg)` }}
                    >
                      <div className="w-full h-full bg-karma-card-back bg-card-texture rounded-lg shadow-sm border border-gray-800/20"></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
        </div>

        {/* Game Table */}
        <GameTable 
          pile={state.pile} 
          deckCount={state.deck.length} 
          onDrawCard={drawCard}
          currentPlayer={currentPlayer?.name || 'Unknown'}
        />

        {/* Player Hand */}
        <div className="w-full max-w-3xl">
          {player && (
            <PlayerHand
              cards={player.hand}
              isActive={state.currentPlayerId === state.playerId}
              onPlayCard={(index) => playCard(index)}
            />
          )}
        </div>
      </div>

      <Rules open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default Game;
