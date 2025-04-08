
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

export const useSupabaseChannel = (
  channelName: string,
  config: ChannelConfig,
  onUpdate: (payload: any) => void,
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

      // Fix for TypeScript error by using correct type assertion
      const channel = supabase
        .channel(channelName)
        .on(
          // Type assertion to fix TypeScript error
          'postgres_changes' as unknown as 'system', 
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter
          }, 
          (payload) => {
            console.log(`${channelName} update received:`, payload);
            
            // Enhanced detection for DELETE events
            if (payload) {
              const isDeleteEvent = payload.eventType === 'DELETE' || 
                                    payload.event === 'DELETE';
              
              if (isDeleteEvent) {
                console.log(`DELETE event detected in ${config.table}:`, payload);
                // Explicitly mark as delete for improved handling
                if (typeof payload === 'object') {
                  payload.isDeleteEvent = true;
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
