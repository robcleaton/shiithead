
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import useGame from '@/hooks/useGame';

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
          className="pointer-events-none fixed top-0 left-0 z-50 hidden md:block"
          initial={{ x: cursor.x, y: cursor.y }}
          animate={{ x: cursor.x, y: cursor.y }}
          transition={{ type: 'spring', damping: 15 }}
          style={{ color: cursor.color }}
        >
          <div className="relative">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 174 196" 
              className="h-6 w-6 drop-shadow-md"
              style={{ fill: cursor.color, transform: 'rotate(-25deg)' }}
            >
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.1481e-06 108.138C6.61821e-06 91.2956 9.22651 76.6115 22.8933 68.8795V64.0427C22.8933 53.8452 29.7072 44.9186 39.387 41.757C62.7639 34.1218 103.886 18.4755 114.559 0C135.843 9.73537 151.107 22.8069 151.107 46.7541C151.107 54.1628 150.214 61.3532 148.981 67.7512C163.808 75.1192 174 90.4365 174 108.138V149.094C174 159.048 165.943 167.117 156.005 167.117H128.396C122.344 167.117 116.335 166.098 110.621 164.103L95.8875 158.957C90.1324 156.947 83.8676 156.947 78.1126 158.957L63.3793 164.103C57.665 166.098 51.6563 167.117 45.6044 167.117H17.9949C8.05656 167.117 0 159.048 0 149.094L5.1481e-06 108.138ZM56.1109 108.138C44.9303 108.138 35.8667 117.216 35.8667 128.414C35.8667 139.612 44.9303 148.69 56.1109 148.69C67.2915 148.69 76.3551 139.612 76.3551 128.414C76.3551 117.216 67.2915 108.138 56.1109 108.138ZM101.098 128.414C101.098 117.216 110.162 108.138 121.342 108.138C132.523 108.138 141.586 117.216 141.586 128.414C141.586 139.612 132.523 148.69 121.342 148.69C110.162 148.69 101.098 139.612 101.098 128.414Z" />
              <path d="M68.022 189.065C62.8685 184.92 66.8903 177.977 73.4998 177.977H74.1209C75.2173 177.977 76.2624 178.397 77.1489 179.043C80.1177 181.206 83.7726 182.483 87.7251 182.483C91.6717 182.483 95.3298 181.21 98.3044 179.043C99.191 178.397 100.236 177.977 101.332 177.977H101.95C108.56 177.977 112.582 184.92 107.428 189.065C102.034 193.404 95.182 196 87.7251 196C80.2681 196 73.4165 193.404 68.022 189.065Z" />
            </svg>
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
          className="pointer-events-none fixed top-0 left-0 z-50 hidden md:block"
          initial={{ x: userCursor.x, y: userCursor.y }}
          animate={{ x: userCursor.x, y: userCursor.y }}
          transition={{ type: 'spring', damping: 15 }}
          style={{ color: userCursor.color }}
        >
          <div className="relative">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 174 196" 
              className="h-6 w-6 drop-shadow-md"
              style={{ fill: userCursor.color, transform: 'rotate(-25deg)' }}
            >
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.1481e-06 108.138C6.61821e-06 91.2956 9.22651 76.6115 22.8933 68.8795V64.0427C22.8933 53.8452 29.7072 44.9186 39.387 41.757C62.7639 34.1218 103.886 18.4755 114.559 0C135.843 9.73537 151.107 22.8069 151.107 46.7541C151.107 54.1628 150.214 61.3532 148.981 67.7512C163.808 75.1192 174 90.4365 174 108.138V149.094C174 159.048 165.943 167.117 156.005 167.117H128.396C122.344 167.117 116.335 166.098 110.621 164.103L95.8875 158.957C90.1324 156.947 83.8676 156.947 78.1126 158.957L63.3793 164.103C57.665 166.098 51.6563 167.117 45.6044 167.117H17.9949C8.05656 167.117 0 159.048 0 149.094L5.1481e-06 108.138ZM56.1109 108.138C44.9303 108.138 35.8667 117.216 35.8667 128.414C35.8667 139.612 44.9303 148.69 56.1109 148.69C67.2915 148.69 76.3551 139.612 76.3551 128.414C76.3551 117.216 67.2915 108.138 56.1109 108.138ZM101.098 128.414C101.098 117.216 110.162 108.138 121.342 108.138C132.523 108.138 141.586 117.216 141.586 128.414C141.586 139.612 132.523 148.69 121.342 148.69C110.162 148.69 101.098 139.612 101.098 128.414Z" />
              <path d="M68.022 189.065C62.8685 184.92 66.8903 177.977 73.4998 177.977H74.1209C75.2173 177.977 76.2624 178.397 77.1489 179.043C80.1177 181.206 83.7726 182.483 87.7251 182.483C91.6717 182.483 95.3298 181.21 98.3044 179.043C99.191 178.397 100.236 177.977 101.332 177.977H101.95C108.56 177.977 112.582 184.92 107.428 189.065C102.034 193.404 95.182 196 87.7251 196C80.2681 196 73.4165 193.404 68.022 189.065Z" />
            </svg>
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
