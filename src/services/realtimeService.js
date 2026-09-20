/**
 * LIFE-LINK Emergency Blood Response System
 * Supabase Realtime Service for Pure Push Events
 *
 * Tables Monitored:
 * 1. emergency_requests (status updates, new requests)
 * 2. inventory (available_units, reserved_units)
 * 3. responses (offers, acceptances, rejections)
 */

import { supabase } from '../lib/supabase.js';

/**
 * Creates a subscription to changes on the `emergency_requests` table.
 *
 * @param {Function} onUpdate - Callback receiving ({ eventType, new, old, payload })
 * @param {Object} [options]
 * @param {string} [options.filter] - Optional PostgREST filter string, e.g. 'hospital_id=eq.xyz'
 * @param {string} [options.event='*'] - Event filter ('INSERT', 'UPDATE', 'DELETE', or '*')
 * @returns {{ unsubscribe: Function, channel: Object }}
 */
export function subscribeToEmergencyRequests(onUpdate, options = {}) {
  const channelName = `realtime-emergency-requests-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const event = options.event || '*';

  const filterConfig = {
    event,
    schema: 'public',
    table: 'emergency_requests'
  };

  if (options.filter) {
    filterConfig.filter = options.filter;
  }

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', filterConfig, (payload) => {
      onUpdate?.({
        table: 'emergency_requests',
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        payload
      });
    })
    .subscribe((status, err) => {
      if (err) {
        console.warn(`[Realtime] Emergency requests channel error:`, err);
      }
    });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Creates a subscription to changes on the `inventory` table (e.g. available_units / reserved_units).
 *
 * @param {Function} onUpdate - Callback receiving ({ eventType, new, old, payload })
 * @param {Object} [options]
 * @param {string} [options.filter] - Optional PostgREST filter string, e.g. 'blood_bank_id=eq.xyz'
 * @param {string} [options.event='*'] - Event filter ('INSERT', 'UPDATE', 'DELETE', or '*')
 * @returns {{ unsubscribe: Function, channel: Object }}
 */
export function subscribeToInventory(onUpdate, options = {}) {
  const channelName = `realtime-inventory-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const event = options.event || '*';

  const filterConfig = {
    event,
    schema: 'public',
    table: 'inventory'
  };

  if (options.filter) {
    filterConfig.filter = options.filter;
  }

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', filterConfig, (payload) => {
      onUpdate?.({
        table: 'inventory',
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        payload
      });
    })
    .subscribe((status, err) => {
      if (err) {
        console.warn(`[Realtime] Inventory channel error:`, err);
      }
    });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Creates a subscription to changes on the `responses` table.
 *
 * @param {Function} onUpdate - Callback receiving ({ eventType, new, old, payload })
 * @param {Object} [options]
 * @param {string} [options.filter] - Optional PostgREST filter string, e.g. 'request_id=eq.xyz'
 * @param {string} [options.event='*'] - Event filter ('INSERT', 'UPDATE', 'DELETE', or '*')
 * @returns {{ unsubscribe: Function, channel: Object }}
 */
export function subscribeToResponses(onUpdate, options = {}) {
  const channelName = `realtime-responses-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const event = options.event || '*';

  const filterConfig = {
    event,
    schema: 'public',
    table: 'responses'
  };

  if (options.filter) {
    filterConfig.filter = options.filter;
  }

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', filterConfig, (payload) => {
      onUpdate?.({
        table: 'responses',
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        payload
      });
    })
    .subscribe((status, err) => {
      if (err) {
        console.warn(`[Realtime] Responses channel error:`, err);
      }
    });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Composite Realtime Subscription:
 * Listens to all 3 core tables (emergency_requests, inventory, responses)
 * on a single unified channel without polling or memory leaks.
 *
 * @param {Object} handlers
 * @param {Function} [handlers.onEmergencyRequest]
 * @param {Function} [handlers.onInventoryChange]
 * @param {Function} [handlers.onResponse]
 * @param {Function} [handlers.onAnyChange]
 * @param {Function} [handlers.onStatusChange]
 * @param {Object} [filters] - Optional table-specific filters
 * @returns {{ unsubscribe: Function, channel: Object }}
 */
export function subscribeToEmergencySystem(
  { onEmergencyRequest, onInventoryChange, onResponse, onAnyChange, onStatusChange } = {},
  filters = {}
) {
  const channelName = `realtime-system-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const reqConfig = {
    event: '*',
    schema: 'public',
    table: 'emergency_requests'
  };
  if (filters.emergencyRequests) reqConfig.filter = filters.emergencyRequests;

  const invConfig = {
    event: '*',
    schema: 'public',
    table: 'inventory'
  };
  if (filters.inventory) invConfig.filter = filters.inventory;

  const resConfig = {
    event: '*',
    schema: 'public',
    table: 'responses'
  };
  if (filters.responses) resConfig.filter = filters.responses;

  const channel = supabase
    .channel(channelName)
    // 1. Emergency Requests listener
    .on('postgres_changes', reqConfig, (payload) => {
      const change = {
        table: 'emergency_requests',
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        payload
      };
      onEmergencyRequest?.(change);
      onAnyChange?.(change);
    })
    // 2. Inventory listener (available_units & reserved_units)
    .on('postgres_changes', invConfig, (payload) => {
      const change = {
        table: 'inventory',
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        payload
      };
      onInventoryChange?.(change);
      onAnyChange?.(change);
    })
    // 3. Responses listener
    .on('postgres_changes', resConfig, (payload) => {
      const change = {
        table: 'responses',
        eventType: payload.eventType,
        new: payload.new,
        old: payload.old,
        payload
      };
      onResponse?.(change);
      onAnyChange?.(change);
    })
    .subscribe((status, err) => {
      onStatusChange?.(status);
      if (err) {
        console.warn(`[Realtime] Emergency System subscription error:`, err);
      }
    });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

