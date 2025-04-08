
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import JoinGameForm from '@/components/lobby/JoinGameForm';
import useGame from '@/hooks/useGame';
import CursorTracker from '@/components/CursorTracker';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { joinGame, state, resetGame } = useGame();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    if (location.pathname.startsWith('/join/') && gameId) {
      setShowJoinForm(true);
      console.log(`Detected join URL with gameId: ${gameId}`);
    }
  }, [gameId, location]);

  // Check for existing session on page load
  useEffect(() => {
    const checkExistingSession = async () => {
      setIsCheckingSession(true);
      
      try {
        // Get stored game ID and player ID
        const storedGameId = localStorage.getItem('gameId');
        const storedPlayerId = localStorage.getItem('playerId');
        
        if (storedGameId && storedPlayerId) {
          console.log(`Found stored game session: Game ID ${storedGameId}, Player ID ${storedPlayerId}`);
          
          // Verify player is still part of the game
          const { data: playerData, error } = await supabase
            .from('players')
            .select('id, name, game_id')
            .eq('id', storedPlayerId)
            .eq('game_id', storedGameId)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking player session:', error);
            resetGame();
          } else if (playerData) {
            console.log('Player found in game, redirecting to game page');
            navigate('/game');
          } else {
            console.log('Player no longer in game, resetting state');
            resetGame();
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkExistingSession();
  }, [navigate, resetGame]);

  // Modified to be less aggressive with resets
  // Only reset if we came from a game page via explicit navigation
  // (not on initial load or browser refresh)
  useEffect(() => {
    const playerId = localStorage.getItem('playerId');
    const wasInGame = sessionStorage.getItem('wasInGame') === 'true';
    
    // Only reset if we came to home page via explicit navigation from a game page
    if (playerId && 
        location.pathname === '/' && 
        !showJoinForm && 
        state.gameId && 
        wasInGame) {
      console.log('Home page detected with lingering game state after navigation - cleaning up');
      resetGame();
      sessionStorage.removeItem('wasInGame');
    }
    
    // Mark that we're in a game when we have a game state
    if (state.gameId) {
      sessionStorage.setItem('wasInGame', 'true');
    }
  }, [location.pathname, showJoinForm, state.gameId, resetGame]);

  if (isCheckingSession) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <p className="text-shithead-foreground/60">Checking game session...</p>
        </div>
      </div>
    );
  }

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
