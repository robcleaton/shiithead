
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface LobbyHeaderProps {
  gameId: string;
}

const LobbyHeader = ({ gameId }: LobbyHeaderProps) => {
  // Transform gameId into middle-of-swear-words format
  const transformedGameId = transformGameId(gameId);

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join/${gameId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  return (
    <div className="bg-karma-secondary/50 p-4 rounded-lg">
      <p className="text-sm text-karma-foreground/70 mb-2">Game ID (Share with friends)</p>
      <div className="font-mono text-lg bg-white/60 rounded px-3 py-2 flex items-center justify-between">
        <span className="truncate">{transformedGameId}</span>
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
  );
};

// Function to transform gameId into middle-of-swear-words format
const transformGameId = (gameId: string): string => {
  if (!gameId) return '';
  
  // List of censored swear words to use for the middle-of-words format
  const words = [
    'sh*t', 'f*ck', 'a*s', 'b*tch', 'd*mn', 
    'cr*p', 'p*ss', 'tw*t', 'w*nker', 'b*llocks',
    'j*rk', 'd*ck', 'a**hole', 'b*stard', 'sh*thead',
    'f*cker', 'a**hat', 'douch*', 'pr*ck', 'sh*tbag',
    'f*ckface', 'a**wipe', 'd*ckhead', 'c*nt', 'b*llsh*t'
  ];
  
  // Use the gameId characters to select words
  let result = '';
  for (let i = 0; i < gameId.length; i++) {
    const char = gameId[i];
    const charCode = char.charCodeAt(0);
    const wordIndex = charCode % words.length;
    const word = words[wordIndex];
    
    // Insert the character in the middle of the word
    const middle = Math.floor(word.length / 2);
    const transformedWord = word.slice(0, middle) + char + word.slice(middle);
    
    result += (i > 0 ? '-' : '') + transformedWord;
  }
  
  return result;
};

export default LobbyHeader;
