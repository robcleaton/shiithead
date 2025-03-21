
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestPlayerFormProps {
  addTestPlayer: (name: string) => void;
}

const TestPlayerForm = ({ addTestPlayer }: TestPlayerFormProps) => {
  const [testPlayerName, setTestPlayerName] = useState('');

  const handleAddTestPlayer = () => {
    if (!testPlayerName.trim()) {
      toast.error('Please enter a name for the test player');
      return;
    }
    addTestPlayer(testPlayerName);
    setTestPlayerName('');
  };

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <p className="text-sm font-medium mb-2 text-yellow-800">Add Test Players (Dev Mode)</p>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Test Player Name"
          value={testPlayerName}
          onChange={(e) => setTestPlayerName(e.target.value)}
        />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleAddTestPlayer}
          className="flex-shrink-0 bg-yellow-100"
        >
          <PlusCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TestPlayerForm;
