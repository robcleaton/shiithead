
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from 'react-router-dom';

interface JoinGameFormProps {
  joinGame: (gameId: string, playerName: string) => void;
  initialGameId?: string;
}

const JoinGameForm = ({ joinGame, initialGameId = '' }: JoinGameFormProps) => {
  const [gameId, setGameId] = useState(initialGameId);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { gameId: urlGameId } = useParams();

  useEffect(() => {
    // If there's a gameId in the URL and no initialGameId was provided, use the URL gameId
    if (urlGameId && !initialGameId) {
      setGameId(urlGameId);
    }
  }, [urlGameId, initialGameId]);

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

  // Determine if the game code field should be read-only
  const isGameIdReadOnly = !!initialGameId || !!urlGameId;

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
              readOnly={isGameIdReadOnly}
              className={isGameIdReadOnly ? "bg-gray-100" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="playerName">Your Name</Label>
            <Input 
              id="playerName" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Enter your name"
              autoFocus={isGameIdReadOnly}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-karma-primary hover:bg-karma-primary/90" 
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
