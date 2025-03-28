
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import useGame from '@/hooks/useGame';
import { MousePointer } from 'lucide-react';

type CursorPosition = {
  x: number;
  y: number;
  playerId: string;
  playerName: string;
  color: string;
};

interface CursorTrackerProps {
  label?: string;
  showOnlyUserCursor?: boolean;
  hideUserCursor?: boolean;
}

const CursorTracker = ({ label, showOnlyUserCursor = false, hideUserCursor = false }: CursorTrackerProps = {}) => {
  const { state } = useGame();
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const [userCursor, setUserCursor] = useState<CursorPosition | null>(null);
  
  // Generate a consistent color based on player ID
  const getPlayerColor = (playerId: string) => {
    // Simple hash function to get a number from a string
    const hash = playerId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Convert to a hue (0-360)
    const h = Math.abs(hash % 360);
    // Use a fixed saturation and lightness for vibrant but visible colors
    return `hsl(${h}, 80%, 60%)`;
  };

  useEffect(() => {
    if (!state.gameId && !label) return;
    
    // Don't track or show cursors during setup phase
    if (state.setupPhase) {
      setCursors({});
      setUserCursor(null);
      return;
    }

    const playerColor = getPlayerColor(state.playerId || 'visitor');
    const displayName = label || state.currentPlayerName || 'You';
    
    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const position = {
        x: e.clientX,
        y: e.clientY,
        playerId: state.playerId || 'visitor',
        playerName: displayName,
        color: playerColor
      };
      
      // Update user's cursor position
      setUserCursor(position);
      
      // Broadcast cursor position to other players if not in showOnlyUserCursor mode
      if (!showOnlyUserCursor) {
        const channelId = state.gameId ? `cursor:${state.gameId}` : 'cursor:home';
        const channel = supabase.channel(channelId);
        channel.send({
          type: 'broadcast',
          event: 'cursor-move',
          payload: position,
        });
      }
    };

    // Throttle the mousemove event to avoid too many updates
    let throttleTimeout: number | null = null;
    const throttledMouseMove = (e: MouseEvent) => {
      if (!throttleTimeout) {
        throttleTimeout = window.setTimeout(() => {
          handleMouseMove(e);
          throttleTimeout = null;
        }, 50); // Update every 50ms at most
      }
    };

    window.addEventListener('mousemove', throttledMouseMove);

    // Subscribe to cursor movements from other players if not in showOnlyUserCursor mode
    if (!showOnlyUserCursor) {
      const channelId = state.gameId ? `cursor:${state.gameId}` : 'cursor:home';
      const channel = supabase.channel(channelId);
      
      channel
        .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
          if (payload.playerId === (state.playerId || 'visitor')) return; // Ignore our own cursor
          
          setCursors(prev => ({
            ...prev,
            [payload.playerId]: payload as CursorPosition
          }));
        })
        .subscribe();

      return () => {
        window.removeEventListener('mousemove', throttledMouseMove);
        if (throttleTimeout) {
          clearTimeout(throttleTimeout);
        }
        supabase.removeChannel(channel);
      };
    } else {
      return () => {
        window.removeEventListener('mousemove', throttledMouseMove);
        if (throttleTimeout) {
          clearTimeout(throttleTimeout);
        }
      };
    }
  }, [state.gameId, state.playerId, state.currentPlayerName, state.setupPhase, label, showOnlyUserCursor]);

  // Don't render any cursors if we're in setup phase
  if (state.setupPhase) return null;

  return (
    <>
      {/* Render other players' cursors */}
      {!showOnlyUserCursor && Object.values(cursors).map((cursor) => (
        <motion.div
          key={cursor.playerId}
          className="pointer-events-none fixed top-0 left-0 z-50"
          initial={{ x: cursor.x, y: cursor.y }}
          animate={{ x: cursor.x, y: cursor.y }}
          transition={{ type: 'spring', damping: 15 }}
          style={{ color: cursor.color }}
        >
          <div className="relative">
            <MousePointer className="h-6 w-6 filter drop-shadow-md" />
            <div 
              className="absolute left-4 top-1 px-2 py-1 text-base font-medium rounded-md shadow-md whitespace-nowrap"
              style={{ backgroundColor: cursor.color, color: '#fff' }}
            >
              {cursor.playerName}
            </div>
          </div>
        </motion.div>
      ))}
      
      {/* Render user's own cursor only if not hidden */}
      {userCursor && !hideUserCursor && (
        <motion.div
          className="pointer-events-none fixed top-0 left-0 z-50"
          initial={{ x: userCursor.x, y: userCursor.y }}
          animate={{ x: userCursor.x, y: userCursor.y }}
          transition={{ type: 'spring', damping: 15 }}
          style={{ color: userCursor.color }}
        >
          <div className="relative">
            <MousePointer className="h-6 w-6 filter drop-shadow-md" />
            <div 
              className="absolute left-4 top-1 px-2 py-1 text-base font-medium rounded-md shadow-md whitespace-nowrap"
              style={{ backgroundColor: userCursor.color, color: '#fff' }}
            >
              {userCursor.playerName}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default CursorTracker;
