import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Enhanced hook with reconnection handling and status callback
export const useSupabaseChannel = (
  channelName: string, 
  subscription: {
    table: string;
    filter?: string;
    event?: string;
  },
  callback: (payload: any) => void,
  enabled = true,
  statusCallback?: (status: string) => void
) => {
  // Keep track of the channel for cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Track reconnection attempts
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayMs = 2000;

  useEffect(() => {
    if (!enabled) return;
    
    const setupChannel = () => {
      try {
        // Create channel with the event and filter
        const channel = supabase.channel(channelName);
        
        // Add the subscription
        if (subscription.event === '*') {
          // Subscribe to all events
          channel
            .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: subscription.table,
              filter: subscription.filter
            }, callback)
            .on('postgres_changes', { 
              event: 'UPDATE', 
              schema: 'public', 
              table: subscription.table,
              filter: subscription.filter  
            }, callback)
            .on('postgres_changes', { 
              event: 'DELETE', 
              schema: 'public', 
              table: subscription.table,
              filter: subscription.filter
            }, callback);
        } else {
          // Subscribe to specific event
          channel.on('postgres_changes', { 
            event: (subscription.event || 'UPDATE') as 'INSERT' | 'UPDATE' | 'DELETE', 
            schema: 'public', 
            table: subscription.table,
            filter: subscription.filter  
          }, callback);
        }
        
        // Add channel status handlers
        channel
          .on('system', { event: 'health' }, () => {
            console.log(`Health check on channel ${channelName}`);
          })
          .on('subscription', { event: 'ready' }, () => {
            console.log(`Subscription ready on channel ${channelName}`);
            reconnectAttemptRef.current = 0; // Reset reconnection counter on successful connection
            if (statusCallback) statusCallback('SUBSCRIBED');
          })
          .on('subscription', { event: 'error' }, (err) => {
            console.error(`Subscription error on channel ${channelName}:`, err);
            if (statusCallback) statusCallback('CHANNEL_ERROR');
            
            // Try to reconnect if we haven't exceeded the limit
            if (reconnectAttemptRef.current < maxReconnectAttempts) {
              reconnectAttemptRef.current++;
              console.log(`Attempting to reconnect (${reconnectAttemptRef.current}/${maxReconnectAttempts})...`);
              
              // Cleanup and attempt reconnect after delay
              setTimeout(() => {
                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current);
                }
                setupChannel();
              }, reconnectDelayMs);
            }
          });
        
        // Subscribe to the channel
        const subscription = channel.subscribe((status) => {
          console.log(`Channel ${channelName} status:`, status);
          if (statusCallback) statusCallback(status);
          
          if (status === 'CLOSED' && reconnectAttemptRef.current < maxReconnectAttempts) {
            reconnectAttemptRef.current++;
            console.log(`Connection closed. Attempting to reconnect (${reconnectAttemptRef.current}/${maxReconnectAttempts})...`);
            
            setTimeout(() => {
              if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
              }
              setupChannel();
            }, reconnectDelayMs);
          }
        });
        
        // Store the channel
        channelRef.current = channel;
      } catch (error) {
        console.error(`Error setting up channel ${channelName}:`, error);
        if (statusCallback) statusCallback('SETUP_ERROR');
      }
    };
    
    // Initial setup
    setupChannel();
    
    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`Cleaning up channel ${channelName}`);
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelName, subscription, callback, enabled, statusCallback]);
};
