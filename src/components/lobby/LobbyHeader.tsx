
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface LobbyHeaderProps {
  gameId: string;
}

const LobbyHeader = ({ gameId }: LobbyHeaderProps) => {
  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/join/${gameId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  return (
    <div className="bg-karma-secondary/50 p-4 rounded-lg">
      <p className="text-sm text-karma-foreground/70 mb-2">Game ID (Share with friends)</p>
      <div className="font-mono text-lg bg-white/60 rounded px-3 py-2 flex items-center justify-between">
        <span className="truncate">{gameId}</span>
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

export default LobbyHeader;
