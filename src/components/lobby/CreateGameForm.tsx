
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateGameFormProps {
  createGame: (playerName: string) => void;
}

const CreateGameForm = ({ createGame }: CreateGameFormProps) => {
  const [playerName, setPlayerName] = useState('');

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    createGame(playerName);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          autoFocus
        />
      </div>
      <Button onClick={handleCreateGame} className="w-full bg-karma-primary hover:bg-karma-primary/90">
        Create New Game
      </Button>
    </div>
  );
};

export default CreateGameForm;
