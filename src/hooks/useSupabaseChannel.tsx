
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

      // Type assertion to any to bypass TypeScript's type checking for Supabase's API
      // This is necessary because the Supabase API accepts this string at runtime
      // but TypeScript's type definitions don't match the runtime behavior
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
            onUpdate(payload);
          }
        )
        .subscribe((status: any) => {
          console.log(`${channelName} channel subscription status:`, status);
          
          // Type assertion here to bypass TypeScript's type checking
          // Supabase runtime API returns string literals that don't match TypeScript types
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
