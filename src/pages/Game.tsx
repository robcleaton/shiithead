
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';
import PlayerHand from '@/components/PlayerHand';
import GameTable from '@/components/GameTable';
import Rules from '@/components/Rules';
import Lobby from '@/components/Lobby';
import { HelpCircle, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

const Game = () => {
  const { state, playCard, drawCard, resetGame, selectFaceUpCard, completeSetup } = useGame();
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
    const winner = state.players.find(p => p.hand.length === 0 && p.faceUpCards.length === 0 && p.faceDownCards.length === 0);
    
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

  if (state.setupPhase && player) {
    return (
      <div className="container mx-auto px-4 py-10 min-h-screen">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold">Shithead - Setup Phase</h1>
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
          </div>
        </motion.div>

        <div className="flex flex-col gap-8 items-center">
          <motion.div
            className="text-center mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-2">Setup Your Cards</h2>
            <p className="text-karma-foreground/80">
              Select 3 cards from your hand to place face-up on your 3 face-down cards
            </p>
            <div className="mt-4 flex justify-center gap-1 flex-wrap">
              {state.players.map(p => (
                <div key={p.id} className={`px-3 py-1 rounded-full text-xs font-medium ${p.isReady ? 'bg-green-500/20 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {p.name} {p.isReady ? '✓' : '...'}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Face Down Cards */}
          <motion.div 
            className="flex justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {player.faceDownCards.map((_, index) => (
              <div 
                key={index}
                className="w-14 h-20 bg-karma-card-back bg-card-texture rounded-lg shadow-md border border-gray-800/20"
              />
            ))}
          </motion.div>

          {/* Face Up Cards */}
          <motion.div 
            className="flex justify-center gap-4 mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {player.faceUpCards.map((card, index) => (
              <div 
                key={`${card.suit}-${card.rank}-${index}`}
                className="w-14 h-20 bg-white rounded-lg shadow flex items-center justify-center border border-gray-200"
              >
                <div className={`text-2xl ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                  {card.rank}
                  {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                </div>
              </div>
            ))}
            {Array(3 - player.faceUpCards.length).fill(0).map((_, i) => (
              <div 
                key={`empty-${i}`}
                className="w-14 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center"
              >
                <span className="text-gray-400 text-xs">Select</span>
              </div>
            ))}
          </motion.div>

          {/* Player Hand */}
          <div className="w-full max-w-3xl mt-8">
            <PlayerHand
              cards={player.hand}
              isActive={true}
              onPlayCard={(index) => selectFaceUpCard(index)}
            />
          </div>

          {player.isReady && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-4"
            >
              <p className="text-center text-green-600 mb-2">You've selected all your face-up cards</p>
              {state.isHost && (
                <Button 
                  onClick={completeSetup}
                  className="bg-karma-primary hover:bg-karma-primary/90"
                  disabled={!state.players.every(p => p.isReady)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
              )}
            </motion.div>
          )}
        </div>

        <Rules open={rulesOpen} onOpenChange={setRulesOpen} />
      </div>
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
        <h1 className="text-2xl font-bold">Shithead Card Game</h1>
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
                
                {/* Face down and face up cards */}
                <div className="flex justify-center mb-2">
                  {opponent.faceDownCards.map((_, index) => (
                    <div 
                      key={`fd-${index}`}
                      className="w-10 h-14 -ml-4 first:ml-0 bg-karma-card-back bg-card-texture rounded-md shadow-sm border border-gray-800/20"
                    />
                  ))}
                </div>
                
                <div className="flex justify-center mb-4">
                  {opponent.faceUpCards.map((card, index) => (
                    <div 
                      key={`fu-${index}`}
                      className="w-10 h-14 -ml-4 first:ml-0 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-center"
                    >
                      <div className={`text-sm ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                        {card.rank}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Hand cards */}
                <div className="flex justify-center">
                  {opponent.hand.map((_, index) => (
                    <div 
                      key={index}
                      className="w-10 h-14 -ml-4 first:ml-0"
                      style={{ transform: `rotate(${(index - opponent.hand.length / 2) * 3}deg)` }}
                    >
                      <div className="w-full h-full bg-karma-card-back bg-card-texture rounded-md shadow-sm border border-gray-800/20"></div>
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

        {/* Player Cards */}
        {player && (
          <div className="w-full max-w-3xl">
            {/* Player's face down and face up cards */}
            <div className="flex justify-center gap-1 mb-6">
              <div className="flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-1">Face Down</div>
                <div className="flex gap-2">
                  {player.faceDownCards.map((_, index) => (
                    <div 
                      key={`fd-${index}`}
                      className="w-12 h-16 bg-karma-card-back bg-card-texture rounded-lg shadow-sm border border-gray-800/20"
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-center ml-6">
                <div className="text-xs text-gray-500 mb-1">Face Up</div>
                <div className="flex gap-2">
                  {player.faceUpCards.map((card, index) => (
                    <div 
                      key={`fu-${index}`}
                      className="w-12 h-16 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center"
                    >
                      <div className={`text-lg ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black'}`}>
                        {card.rank}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Player Hand */}
            <PlayerHand
              cards={player.hand}
              isActive={state.currentPlayerId === state.playerId}
              onPlayCard={(index) => playCard(index)}
            />
          </div>
        )}
      </div>

      <Rules open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  );
};

export default Game;
