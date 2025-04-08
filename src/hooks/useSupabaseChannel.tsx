
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

      // Create the channel configuration with explicit event handling
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any, 
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter
          }, 
          (payload) => {
            console.log(`${channelName} update received:`, payload);
            
            // Handle different payload structures safely without assuming properties
            if (payload && typeof payload === 'object') {
              // Safely check for DELETE events using optional chaining and type guards
              const isDelete = 
                // Check if event property exists and is DELETE
                (payload.event === 'DELETE') ||
                // Check for type and event properties
                (payload.type === 'postgres_changes' && payload.event === 'DELETE');
              
              // Safely extract old data if available
              let oldData = null;
              
              // Use optional chaining to safely access potentially undefined properties
              if ('old' in payload) {
                oldData = payload.old;
              }
              
              if (isDelete && oldData) {
                console.log(`DELETE event detected in ${config.table}`, oldData);
              }
            }
            
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
