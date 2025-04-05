
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
        // Create channel
        const channel = supabase.channel(channelName);
        
        // Setup system event handlers for the channel status first
        channel
          .on('system', { event: 'connected' }, () => {
            console.log(`Connected to channel ${channelName}`);
            if (statusCallback) statusCallback('CONNECTED');
          })
          .on('system', { event: 'disconnected' }, () => {
            console.log(`Disconnected from channel ${channelName}`);
            if (statusCallback) statusCallback('DISCONNECTED');
          });
          
        // Add the subscription for postgres_changes events
        if (subscription.event === '*') {
          // Subscribe to all events (INSERT, UPDATE, DELETE)
          channel
            .on(
              'postgres_changes', 
              { 
                event: 'INSERT', 
                schema: 'public', 
                table: subscription.table,
                filter: subscription.filter 
              }, 
              callback
            )
            .on(
              'postgres_changes', 
              { 
                event: 'UPDATE', 
                schema: 'public', 
                table: subscription.table,
                filter: subscription.filter  
              }, 
              callback
            )
            .on(
              'postgres_changes', 
              { 
                event: 'DELETE', 
                schema: 'public', 
                table: subscription.table,
                filter: subscription.filter
              }, 
              callback
            );
        } else {
          // Subscribe to specific event
          channel.on(
            'postgres_changes', 
            { 
              event: (subscription.event || 'UPDATE') as 'INSERT' | 'UPDATE' | 'DELETE', 
              schema: 'public', 
              table: subscription.table,
              filter: subscription.filter  
            }, 
            callback
          );
        }
        
        // Send a broadcast message for health check
        channel.send({
          type: 'broadcast',
          event: 'sync',
          payload: { status: 'syncing' }
        });
        
        // Subscribe to the channel
        channel.subscribe((status) => {
          console.log(`Channel ${channelName} status:`, status);
          if (statusCallback) statusCallback(status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`Subscription ready on channel ${channelName}`);
            reconnectAttemptRef.current = 0; // Reset reconnection counter on successful connection
            if (statusCallback) statusCallback('SUBSCRIBED');
          } else if (status === 'CLOSED' && reconnectAttemptRef.current < maxReconnectAttempts) {
            reconnectAttemptRef.current++;
            console.log(`Connection closed. Attempting to reconnect (${reconnectAttemptRef.current}/${maxReconnectAttempts})...`);
            
            setTimeout(() => {
              if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
              }
              setupChannel();
            }, reconnectDelayMs);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error on channel ${channelName}`);
            if (statusCallback) statusCallback('CHANNEL_ERROR');
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
