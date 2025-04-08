
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import JoinGameForm from '@/components/lobby/JoinGameForm';
import useGame from '@/hooks/useGame';
import CursorTracker from '@/components/CursorTracker';
import { toast } from 'sonner';

const Index = () => {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const { gameId } = useParams();
  const location = useLocation();
  const { joinGame, state, resetGame } = useGame();

  useEffect(() => {
    if (location.pathname.startsWith('/join/') && gameId) {
      setShowJoinForm(true);
      console.log(`Detected join URL with gameId: ${gameId}`);
    }
  }, [gameId, location]);

  // If we're redirected to home but still have game state, reset it
  useEffect(() => {
    const playerId = localStorage.getItem('playerId');
    
    // If we have a player ID but we're at the home page and we're not seeing the join form
    // this might be because we were removed from a game
    if (playerId && location.pathname === '/' && !showJoinForm && state.gameId) {
      console.log('Home page detected with lingering game state - cleaning up');
      resetGame();
    }
  }, [location.pathname, showJoinForm, state.gameId, resetGame]);

  return (
    // Join game module
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="p-3 w-full">
        <div className="mx-auto max-w-4xl w-full text-center">
          {showJoinForm || gameId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="max-w-md mx-auto"
            >
              <JoinGameForm joinGame={joinGame} initialGameId={gameId || ''} />
            </motion.div>
          ) : (
            <>
              <motion.h1
                className="text-4xl md:text-6xl p-4 font-tusker"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Shit head
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="flex justify-center"
              >
                <Link to="/game">
                  <Button size="lg" className="bg-shithead-primary hover:bg-shithead-primary/90 text-white px-8 py-6 text-lg">
                    Start Playing
                  </Button>
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>

      <footer className="container mx-auto px-6 py-8">
        <motion.div
          className="text-center text-sm text-shithead-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
        >
          {/* Footer text */}
        </motion.div>
      </footer>

      <CursorTracker label="Let's play" showOnlyUserCursor={true} />
    </div>
  );
};

export default Index;
