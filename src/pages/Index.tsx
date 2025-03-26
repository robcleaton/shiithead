
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import JoinGameForm from '@/components/lobby/JoinGameForm';
import { useGame } from '@/context/GameContext';

const Index = () => {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const { gameId } = useParams();
  const location = useLocation();
  const { joinGame } = useGame();

  useEffect(() => {
    // Check if we're on a join URL path
    if (location.pathname.startsWith('/join/') && gameId) {
      setShowJoinForm(true);
      console.log(`Detected join URL with gameId: ${gameId}`);
    }
  }, [gameId, location]);

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-6 flex-1 flex flex-col items-center justify-center py-12">
        <div className="max-w-4xl w-full text-center">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-karma-primary to-karma-accent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Shithead Card Game
          </motion.h1>
          
          <motion.p 
            className="text-xl text-karma-foreground/80 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Play the classic Shithead card game online with friends. Create a game, share the code, and enjoy this timeless card game with beautiful animations and intuitive design.
          </motion.p>
          
          {showJoinForm || gameId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="max-w-md mx-auto"
            >
              <JoinGameForm joinGame={joinGame} initialGameId={gameId || ''} />
              
              {/* Back to home button removed */}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/game">
                <Button size="lg" className="bg-karma-primary hover:bg-karma-primary/90 text-white px-8 py-6 text-lg">
                  Start Playing
                </Button>
              </Link>
              
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => setShowJoinForm(true)}
                className="px-8 py-6 text-lg"
              >
                Join Game
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <footer className="container mx-auto px-6 py-8">
        <motion.div 
          className="text-center text-sm text-karma-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
        >
          <p>A beautiful implementation of the Shithead card game.</p>
        </motion.div>
      </footer>
    </div>
  );
};

export default Index;
