
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

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

  // Determine if the form is being shown on the Join Game view
  const isJoinView = !!initialGameId || !!urlGameId;

  // Transform gameId into fun format when on join view
  const transformedGameId = isJoinView ? transformGameId(gameId) : '';

  const handleCopyGameLink = () => {
    const inviteLink = `${window.location.origin}/join/${gameId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Game link copied to clipboard!');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Join Game</CardTitle>
        <CardDescription>Enter the game code shared by the host</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {isJoinView && (
            <div className="bg-karma-secondary/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-karma-foreground/70 mb-2">Game Code</p>
              <div className="font-mono text-lg bg-white/60 rounded px-3 py-2 flex items-center justify-between">
                <span className="truncate">{transformedGameId}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyGameLink}
                  className="ml-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          {!isJoinView && (
            <div className="space-y-2">
              <Label htmlFor="gameId" className="flex items-center gap-1">
                Game Code
                <span className="inline-block ml-1 text-xs text-karma-foreground/70">
                  (Use the original code, not the fun code)
                </span>
              </Label>
              <Input 
                id="gameId" 
                value={gameId} 
                onChange={(e) => setGameId(e.target.value)} 
                placeholder="Enter game code (e.g., abc123)"
                readOnly={isJoinView}
                className={isJoinView ? "bg-gray-100" : ""}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="playerName">Your Name</Label>
            <Input 
              id="playerName" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Enter your name"
              autoFocus={isJoinView}
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

// Function to transform gameId into a shortened format with UK swear words and slang
const transformGameId = (gameId: string): string => {
  if (!gameId) return '';
  
  // UK-specific swear words and slang (shortened list)
  const words = [
    'bollocks', 'wanker', 'tosser', 'minger', 'twat',
    'pillock', 'git', 'knob', 'arsehole', 'bugger'
  ];
  
  // Group gameId characters in pairs when possible
  let result = '';
  for (let i = 0; i < gameId.length; i += 2) {
    const chars = gameId.slice(i, i + 2);
    const charCode = chars.charCodeAt(0);
    const wordIndex = charCode % words.length;
    const word = words[wordIndex];
    
    // Insert the character(s) in the middle of the word
    const middle = Math.floor(word.length / 2);
    const transformedWord = word.slice(0, middle) + chars + word.slice(middle);
    
    result += (i > 0 ? '-' : '') + transformedWord;
  }
  
  return result;
};

export default JoinGameForm;
