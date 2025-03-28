
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface LobbyHeaderProps {
  gameId: string;
}

const LobbyHeader = ({ gameId }: LobbyHeaderProps) => {
  // Transform gameId into middle-of-swear-words format for fun display
  const transformedGameId = transformGameId(gameId);

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join/${gameId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  return (
    <div className="space-y-3">
      <div className="bg-karma-secondary/50 p-4 rounded-lg">
        <p className="text-sm text-karma-foreground/70 mb-2">Share with friends</p>
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyInviteLink}
            className="w-full"
          >
            Copy Invite Link
            <Copy className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <p className="text-xs text-karma-foreground/60 mt-2">Friends can use this link to join your game</p>
      </div>
      
      <div className="bg-karma-secondary/50 p-4 rounded-lg">
        <p className="text-sm text-karma-foreground/70 mb-2">Fun Code (Just for display)</p>
        <div className="font-mono text-lg bg-white/60 rounded px-3 py-2">
          <span className="truncate">{transformedGameId}</span>
        </div>
      </div>
    </div>
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

export default LobbyHeader;
