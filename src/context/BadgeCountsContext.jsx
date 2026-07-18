import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSelector } from 'react-redux';

const BadgeCountsContext = createContext({
  counts: {
    orders: 0,
    queue: 0,
  },
  refreshCounts: () => {},
});

export const useBadgeCounts = () => useContext(BadgeCountsContext);

export const BadgeCountsProvider = ({ children }) => {
  const { profile } = useSelector((s) => s.userProfile);
  const [counts, setCounts] = useState({
    orders: 0,
    queue: 0,
  });

  const fetchCounts = useCallback(async () => {
    if (!profile?.id) return;
    try {
      // Fetch Orders count (order_status = 'placed')
      const { count: ordersCount, error: ordersError } = await supabase
        .from('pharmacy_orders')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', profile.id)
        .eq('order_status', 'placed');

      if (ordersError) throw ordersError;

      // Fetch Hospital Queue count (visits with pending prescriptions)
      const { data: queueData, error: queueError } = await supabase
        .from('visits')
        .select('id, prescriptions!inner(status)')
        .eq('prescriptions.status', 'pending');

      if (queueError) throw queueError;

      setCounts({
        orders: ordersCount || 0,
        queue: queueData ? queueData.length : 0,
      });
    } catch (err) {
      console.error('Error fetching badge counts:', err);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchCounts();

    if (!profile?.id) return;

    let timeoutId;
    const debouncedFetchCounts = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchCounts();
      }, 500);
    };

    // Subscriptions for real-time updates
    const ordersSub = supabase
      .channel('pharmacy_orders_badges')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pharmacy_orders',
        filter: `pharmacy_id=eq.${profile.id}`,
      }, () => {
        debouncedFetchCounts();
      })
      .subscribe();

    const prescriptionsSub = supabase
      .channel('prescriptions_badges')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'prescriptions',
      }, () => {
        debouncedFetchCounts();
      })
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(ordersSub);
      supabase.removeChannel(prescriptionsSub);
    };
  }, [fetchCounts, profile?.id]);

  return (
    <BadgeCountsContext.Provider value={{ counts, refreshCounts: fetchCounts }}>
      {children}
    </BadgeCountsContext.Provider>
  );
};
