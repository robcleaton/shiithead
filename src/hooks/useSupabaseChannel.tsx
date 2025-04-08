
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ChannelEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface ChannelConfig {
  table: string;
  schema?: string;
  filter?: string;
  event?: ChannelEvent;
}

// Define a proper type for the payload we expect to receive
interface RealtimePayload {
  type?: string;
  event?: ChannelEvent; 
  eventType?: ChannelEvent;
  new?: Record<string, any>;
  old?: Record<string, any>;
  record?: Record<string, any>;
  schema?: string;
  table?: string;
  [key: string]: any; // For other properties we might receive
}

export const useSupabaseChannel = (
  channelName: string,
  config: ChannelConfig,
  onUpdate: (payload: RealtimePayload) => void,
  enabled: boolean = true
) => {
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setupChannel = useCallback(() => {
    if (!enabled) return;

    try {
      console.log(`Setting up ${channelName} channel subscription`);
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Use the postgres_changes event
      const channel = supabase
        .channel(channelName)
        .on(
          // Type assertion to fix TypeScript error
          'postgres_changes' as any, 
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter
          }, 
          (payload: RealtimePayload) => {
            console.log(`${channelName} update received:`, payload);
            
            // Enhanced detection for DELETE events
            if (payload) {
              const event = payload.event || '';
              
              if (event === 'DELETE') {
                console.log(`DELETE event detected in ${config.table}:`, payload);
                
                // Ensure the DELETE event has proper flags for downstream handlers
                payload.isDeleteEvent = true;
                
                // Make sure 'old' is available for player identification
                if (!payload.old && payload.record) {
                  payload.old = payload.record;
                }
              }
            }
            
            // Forward all events to handler, including enhanced delete events
            onUpdate(payload);
          }
        )
        .subscribe((status: any) => {
          console.log(`${channelName} channel subscription status:`, status);
          
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error(`${channelName} subscription error. Will attempt to reconnect.`);
            
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect ${channelName} subscription...`);
              setupChannel();
            }, 5000);
          }
        });
      
      channelRef.current = channel;
    } catch (error) {
      console.error(`Error setting up ${channelName} channel:`, error);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Attempting to reconnect ${channelName} subscription after error...`);
        setupChannel();
      }, 5000);
    }
  }, [channelName, config, onUpdate, enabled]);

  useEffect(() => {
    setupChannel();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [setupChannel]);

  return {
    removeChannel: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  };
};
