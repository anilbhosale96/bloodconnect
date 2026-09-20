import { useState, useEffect, useRef, useMemo } from 'react';
import {
  subscribeToEmergencySystem,
  subscribeToEmergencyRequests,
  subscribeToInventory,
  subscribeToResponses
} from '../services/realtimeService.js';

/**
 * Universal React hook for pure Supabase Realtime updates.
 * Subscribes on mount, streams database mutations into React state,
 * and cleanly unsubscribes on unmount with zero polling and zero memory leaks.
 *
 * @param {Object} [options]
 * @param {Function} [options.onEmergencyRequest] - Triggered when emergency_requests row inserted/updated
 * @param {Function} [options.onInventoryChange] - Triggered when inventory available_units/reserved_units change
 * @param {Function} [options.onResponse] - Triggered when blood bank submits response
 * @param {Function} [options.onAnyChange] - Triggered on any monitored database mutation
 * @param {Object} [options.filters] - Optional table filter strings
 * @param {boolean} [options.enabled=true] - Toggle subscription active state
 * @returns {{
 *   lastUpdate: Object|null,
 *   isConnected: boolean,
 *   connectionStatus: string,
 *   eventCount: number
 * }}
 */
export function useRealtimeUpdates(options = {}) {
  const {
    onEmergencyRequest,
    onInventoryChange,
    onResponse,
    onAnyChange,
    filters = {},
    enabled = true
  } = options;

  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [eventCount, setEventCount] = useState(0);

  // Keep latest callbacks in refs to prevent unnecessary re-subscribing
  const callbacksRef = useRef({
    onEmergencyRequest,
    onInventoryChange,
    onResponse,
    onAnyChange
  });

  useEffect(() => {
    callbacksRef.current = {
      onEmergencyRequest,
      onInventoryChange,
      onResponse,
      onAnyChange
    };
  });

  const filterReq = filters.emergencyRequests;
  const filterInv = filters.inventory;
  const filterRes = filters.responses;

  const memoizedFilters = useMemo(() => ({
    emergencyRequests: filterReq,
    inventory: filterInv,
    responses: filterRes
  }), [filterReq, filterInv, filterRes]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const subscription = subscribeToEmergencySystem(
      {
        onEmergencyRequest: (change) => {
          setLastUpdate({ ...change, timestamp: Date.now() });
          setEventCount((prev) => prev + 1);
          callbacksRef.current.onEmergencyRequest?.(change);
        },
        onInventoryChange: (change) => {
          setLastUpdate({ ...change, timestamp: Date.now() });
          setEventCount((prev) => prev + 1);
          callbacksRef.current.onInventoryChange?.(change);
        },
        onResponse: (change) => {
          setLastUpdate({ ...change, timestamp: Date.now() });
          setEventCount((prev) => prev + 1);
          callbacksRef.current.onResponse?.(change);
        },
        onAnyChange: (change) => {
          callbacksRef.current.onAnyChange?.(change);
        },
        onStatusChange: (status) => {
          setConnectionStatus(status);
        }
      },
      memoizedFilters
    );

    // Guaranteed cleanup on unmount or options change - prevents memory leaks
    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, memoizedFilters]);

  return {
    lastUpdate,
    isConnected: connectionStatus === 'SUBSCRIBED',
    connectionStatus,
    eventCount
  };
}

/**
 * Dedicated hook for emergency requests table real-time status changes.
 */
export function useRealtimeEmergencyRequests(callback, { filter, event, enabled = true } = {}) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;

    const subscription = subscribeToEmergencyRequests(
      (change) => cbRef.current?.(change),
      { filter, event }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [filter, event, enabled]);
}

/**
 * Dedicated hook for inventory table changes (e.g. units reserved / updated).
 */
export function useRealtimeInventory(callback, { filter, event, enabled = true } = {}) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;

    const subscription = subscribeToInventory(
      (change) => cbRef.current?.(change),
      { filter, event }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [filter, event, enabled]);
}

/**
 * Dedicated hook for responses table real-time events.
 */
export function useRealtimeResponses(callback, { filter, event, enabled = true } = {}) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;

    const subscription = subscribeToResponses(
      (change) => cbRef.current?.(change),
      { filter, event }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [filter, event, enabled]);
}

