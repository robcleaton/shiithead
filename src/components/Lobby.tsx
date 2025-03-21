
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGame } from '@/context/GameContext';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Copy, UserPlus } from 'lucide-react';

const Lobby = () => {
  const { createGame, joinGame, startGame, state, invitePlayer } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [inviteEmail, setInviteEmail] = useState('');
  const { gameId: joinGameId } = useParams();
  const navigate = useNavigate();

  // Handle direct game joining via URL
  useEffect(() => {
    if (joinGameId && !state.gameId) {
      setGameId(joinGameId);
      setActiveTab('join');
    }
  }, [joinGameId, state.gameId]);

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
    // Clear the URL parameter after joining
    if (joinGameId) {
      navigate('/');
    }
  };

  const handleStartGame = () => {
    if (state.players.length < 2) {
      toast.error('You need at least 2 players to start the game');
      return;
    }
    startGame();
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join/${state.gameId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    invitePlayer(inviteEmail);
    setInviteEmail('');
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
                <div className="space-y-4">
                  <div className="bg-karma-secondary/50 p-4 rounded-lg">
                    <p className="text-sm text-karma-foreground/70 mb-2">Game ID (Share with friends)</p>
                    <div className="font-mono text-lg bg-white/60 rounded px-3 py-2 flex items-center justify-between">
                      <span className="truncate">{state.gameId}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCopyInviteLink}
                        className="ml-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {state.isHost && (
                    <div className="bg-karma-accent/10 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Invite players by email</p>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="friend@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handleSendInvite}
                          className="flex-shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Players ({state.players.length})
                  </h3>
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
