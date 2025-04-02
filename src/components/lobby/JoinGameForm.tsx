
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

interface JoinGameFormProps {
  joinGame: (gameId: string, playerName: string) => void;
  initialGameId?: string;
}

const JoinGameForm = ({ joinGame, initialGameId = '' }: JoinGameFormProps) => {
  const [gameId, setGameId] = useState(initialGameId);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameId.trim()) {
      return;
    }
    
    if (!playerName.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await joinGame(gameId, playerName);
    } catch (error) {
      console.error('Error in join game form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Join Game</CardTitle>
        <CardDescription>Enter the game code shared by the host</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gameId">Game Code</Label>
            <Input 
              id="gameId" 
              value={gameId} 
              onChange={(e) => setGameId(e.target.value)} 
              placeholder="Enter game code"
              readOnly={!!initialGameId}
              className={initialGameId ? "bg-gray-100" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="playerName">Your Name</Label>
            <Input 
              id="playerName" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Enter your name"
              autoFocus={!!initialGameId}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-shithead-primary hover:bg-shithead-primary/90" 
            disabled={isSubmitting || !gameId.trim() || !playerName.trim()}
          >
            {isSubmitting ? 'Joining...' : 'Join Game'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JoinGameForm;
