
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGame } from '@/context/GameContext';
import { toast } from 'sonner';

const Lobby = () => {
  const { createGame, joinGame, startGame, state } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    createGame(playerName);
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!gameId.trim()) {
      toast.error('Please enter a game ID');
      return;
    }
    joinGame(gameId, playerName);
  };

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
            <CardTitle className="text-2xl font-bold text-center text-karma-primary">Karma Card Game</CardTitle>
            <CardDescription className="text-center">Create or join a game to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {!state.gameId ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create">Create Game</TabsTrigger>
                  <TabsTrigger value="join">Join Game</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateGame} className="w-full bg-karma-primary hover:bg-karma-primary/90">
                    Create New Game
                  </Button>
                </TabsContent>
                <TabsContent value="join" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-name">Your Name</Label>
                    <Input
                      id="join-name"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="game-id">Game ID</Label>
                    <Input
                      id="game-id"
                      placeholder="Enter game ID"
                      value={gameId}
                      onChange={(e) => setGameId(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleJoinGame} className="w-full bg-karma-primary hover:bg-karma-primary/90">
                    Join Game
                  </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-karma-secondary/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-karma-foreground/70">Game ID (Share with friends)</p>
                  <div className="font-mono text-lg bg-white/60 rounded px-3 py-2 mt-1">{state.gameId}</div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Players ({state.players.length})</h3>
                  <ul className="space-y-2">
                    {state.players.map((player, index) => (
                      <motion.li
                        key={player.id}
                        className="flex items-center gap-2 bg-white/40 p-2 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="w-8 h-8 rounded-full bg-karma-primary flex items-center justify-center text-white">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{player.name}</span>
                        {player.isHost && (
                          <span className="ml-auto text-xs bg-karma-secondary px-2 py-0.5 rounded">Host</span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
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
              Play the classic Karma card game with friends online
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Lobby;
