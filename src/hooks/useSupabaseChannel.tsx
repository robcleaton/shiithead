
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
  const backoffFactor = 1.5; // Exponential backoff factor

  useEffect(() => {
    if (!enabled) return;
    
    const setupChannel = () => {
      try {
        // Create channel
        const channel = supabase.channel(channelName);
        
        // Setup system event handlers first
        channel
          .on('system', { event: 'connected' }, () => {
            console.log(`Connected to channel ${channelName}`);
            if (statusCallback) statusCallback('CONNECTED');
          })
          .on('system', { event: 'disconnected' }, () => {
            console.log(`Disconnected from channel ${channelName}`);
            if (statusCallback) statusCallback('DISCONNECTED');
          });

        // Handle postgres_changes events
        if (subscription.event === '*') {
          // Listen for INSERT events
          console.log(`Setting up INSERT listener for ${subscription.table}`);
          
          // Use type assertion to handle the postgres_changes method
          const typedChannel = channel as unknown as {
            on(
              event: 'postgres_changes',
              eventConfig: { 
                event: 'INSERT' | 'UPDATE' | 'DELETE',
                schema: string,
                table: string,
                filter?: string 
              },
              callback: (payload: any) => void
            ): any;
          };
          
          typedChannel.on(
            'postgres_changes',
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: subscription.table,
              filter: subscription.filter 
            }, 
            (payload) => {
              console.log(`INSERT event on ${subscription.table}:`, payload);
              callback(payload);
            }
          );
          
          // Listen for UPDATE events
          typedChannel.on(
            'postgres_changes',
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: subscription.table,
              filter: subscription.filter
            }, 
            (payload) => {
              console.log(`UPDATE event on ${subscription.table}:`, payload);
              callback(payload);
            }
          );
          
          // Listen for DELETE events
          typedChannel.on(
            'postgres_changes',
            { 
              event: 'DELETE', 
              schema: 'public', 
              table: subscription.table,
              filter: subscription.filter
            }, 
            (payload) => {
              console.log(`DELETE event on ${subscription.table}:`, payload);
              callback(payload);
            }
          );
        } else {
          // Handle specific event type
          const eventType = subscription.event || 'UPDATE';
          console.log(`Setting up ${eventType} listener for ${subscription.table}`);
          
          // Define the event type properly for TypeScript
          const validEventType = eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          
          // Use type assertion to handle the postgres_changes method
          const typedChannel = channel as unknown as {
            on(
              event: 'postgres_changes',
              eventConfig: { 
                event: 'INSERT' | 'UPDATE' | 'DELETE',
                schema: string,
                table: string,
                filter?: string 
              },
              callback: (payload: any) => void
            ): any;
          };
          
          typedChannel.on(
            'postgres_changes',
            {
              event: validEventType,
              schema: 'public',
              table: subscription.table,
              filter: subscription.filter
            },
            (payload) => {
              console.log(`${eventType} event on ${subscription.table}:`, payload);
              callback(payload);
            }
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
            
            // Calculate backoff with jitter to avoid thundering herd
            const baseDelay = reconnectDelayMs * Math.pow(backoffFactor, reconnectAttemptRef.current - 1);
            const jitter = Math.random() * 0.5 + 0.75; // Jitter between 0.75 and 1.25
            const delay = Math.floor(baseDelay * jitter);
            
            console.log(`Connection closed. Attempting to reconnect (${reconnectAttemptRef.current}/${maxReconnectAttempts}) in ${delay}ms...`);
            
            setTimeout(() => {
              if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
              }
              setupChannel();
            }, delay);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error on channel ${channelName}`);
            if (statusCallback) statusCallback('CHANNEL_ERROR');
            
            // Attempt reconnect after an error, with backoff
            if (reconnectAttemptRef.current < maxReconnectAttempts) {
              const delay = reconnectDelayMs * Math.pow(backoffFactor, reconnectAttemptRef.current);
              reconnectAttemptRef.current++;
              
              setTimeout(() => {
                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current);
                  channelRef.current = null;
                }
                setupChannel();
              }, delay);
            }
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
