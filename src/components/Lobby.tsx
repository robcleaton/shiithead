
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useGame from '@/hooks/useGame';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

// Import refactored components
import CreateGameForm from './lobby/CreateGameForm';
import JoinGameForm from './lobby/JoinGameForm';
import PlayerList from './lobby/PlayerList';
import TestPlayerForm from './lobby/TestPlayerForm';
import LobbyHeader from './lobby/LobbyHeader';
import CursorTracker from './CursorTracker';

const Lobby = () => {
  const { createGame, joinGame, startGame, state, addTestPlayer } = useGame();
  const [activeTab, setActiveTab] = useState('create');
  const { gameId: joinGameId } = useParams();
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    if (joinGameId && !state.gameId) {
      setActiveTab('join');
    }
  }, [joinGameId, state.gameId]);

  useEffect(() => {
    if (state.gameId) {
      navigate('/game');
    }
  }, [state.gameId, navigate]);

  useEffect(() => {
    // Debug log to track game state and players
    console.log('Current game state in Lobby:', state);
    console.log('Players in lobby:', state.players);
  }, [state]);

  const handleStartGame = () => {
    if (state.players.length < 2) {
      toast.error('You need at least 2 players to start the game');
      return;
    }
    startGame();
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-[calc(100vh-200px)]"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="w-full max-w-md">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-karma-primary">Shithead Card Game</CardTitle>
            <CardDescription className="text-center">Create or join a game to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {!state.gameId ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create">Create Game</TabsTrigger>
                  <TabsTrigger value="join">Join Game</TabsTrigger>
                </TabsList>
                <TabsContent value="create">
                  <CreateGameForm createGame={createGame} />
                </TabsContent>
                <TabsContent value="join">
                  <JoinGameForm joinGame={joinGame} initialGameId={joinGameId} />
                </TabsContent>
              </Tabs>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <LobbyHeader gameId={state.gameId} />
                  
                  {isDevelopment && state.isHost && (
                    <TestPlayerForm addTestPlayer={addTestPlayer} />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Players ({state.players.length})
                  </h3>
                  {state.players.length < 2 && (
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                      Invite at least one player to join the game
                    </div>
                  )}
                  
                  <PlayerList players={state.players} currentPlayerId={state.playerId} />
                </div>
                
                {state.isHost && (
                  <Button
                    onClick={handleStartGame}
                    className="w-full bg-karma-accent hover:bg-karma-accent/90 text-white"
                    disabled={state.players.length < 2}
                  >
                    Start Game
                  </Button>
                )}
                
                {!state.isHost && (
                  <p className="text-center text-sm text-karma-foreground/70">
                    Waiting for the host to start the game...
                  </p>
                )}
              </motion.div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-karma-foreground/60">
              Play the classic Shithead card game with friends online
            </p>
          </CardFooter>
        </Card>
      </motion.div>
      {state.gameId && <CursorTracker hideUserCursor={true} />}
    </motion.div>
  );
};

export default Lobby;
