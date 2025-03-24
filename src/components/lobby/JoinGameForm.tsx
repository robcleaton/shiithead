
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface JoinGameFormProps {
  joinGame: (gameId: string, playerName: string) => void;
  initialGameId?: string;
}

const JoinGameForm = ({ joinGame, initialGameId = '' }: JoinGameFormProps) => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState(initialGameId);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialGameId) {
      setGameId(initialGameId);
      console.log(`Setting initial game ID: ${initialGameId}`);
    }
  }, [initialGameId]);

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

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="join-name">Your Name</Label>
        <Input
          id="join-name"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          autoFocus
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
      {initialGameId && (
        <p className="text-sm text-center mt-2 text-karma-foreground/70">
          Enter your name to join game {initialGameId}
        </p>
      )}
    </div>
  );
};

export default JoinGameForm;
