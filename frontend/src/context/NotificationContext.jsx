import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      const { data: trips } = await API.get('/trips');
      let notifs = [];
      const now = new Date();

      trips.forEach(trip => {
        // Safe check for valid trip data
        if (!trip || typeof trip.totalExpense !== 'number' || typeof trip.budget !== 'number') return;
        
        // Budget alerts
        if (trip.totalExpense > trip.budget) {
          notifs.push({
            id: `budget_exc_${trip._id}`,
            type: 'danger',
            title: 'Budget Exceeded',
            message: `Budget exceeded by ₹${(trip.totalExpense - trip.budget).toLocaleString()} for ${trip.destination}.`,
            timestamp: new Date(trip.updatedAt || now).getTime(),
          });
        } else if (trip.totalExpense > trip.budget * 0.8) {
          notifs.push({
            id: `budget_warn_${trip._id}`,
            type: 'warning',
            title: 'Budget Alert',
            message: `You have used ${Math.round((trip.totalExpense / trip.budget) * 100)}% of your ${trip.destination} budget.`,
            timestamp: new Date(trip.updatedAt || now).getTime(),
          });
        }

        // Trip starting soon
        const startDate = new Date(trip.startDate);
        const diffTime = startDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) {
          notifs.push({
            id: `trip_start_${trip._id}`,
            type: 'info',
            title: 'Trip Starting Soon',
            message: `Your trip to ${trip.destination} starts in ${diffDays} day${diffDays !== 1 ? 's' : ''}!`,
            timestamp: startDate.getTime() - (3 * 24 * 60 * 60 * 1000), // Approx generation time
          });
        }
      });

      // Ephemeral frontend state (simulate expenses added via custom event or just local state)
      const ephemeral = JSON.parse(sessionStorage.getItem(`eph_notifs_${user._id}`) || '[]');
      notifs = [...ephemeral, ...notifs];

      // Sort by timestamp descending
      notifs.sort((a, b) => b.timestamp - a.timestamp);

      // Read state
      const readIds = JSON.parse(localStorage.getItem(`read_notifs_${user._id}`) || '[]');
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !readIds.includes(n.id)).length);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('WANDERVAULT_UPDATE', handleUpdate);
    return () => window.removeEventListener('WANDERVAULT_UPDATE', handleUpdate);
  }, [fetchNotifications]);

  const markAllAsRead = () => {
    if (!user) return;
    const readIds = notifications.map(n => n.id);
    localStorage.setItem(`read_notifs_${user._id}`, JSON.stringify(readIds));
    setUnreadCount(0);
  };

  const addNotification = (type, title, message) => {
    if (!user) return;
    const newNotif = {
      id: `eph_${Date.now()}`,
      type,
      title,
      message,
      timestamp: Date.now()
    };
    const ephemeral = JSON.parse(sessionStorage.getItem(`eph_notifs_${user._id}`) || '[]');
    ephemeral.push(newNotif);
    sessionStorage.setItem(`eph_notifs_${user._id}`, JSON.stringify(ephemeral));
    fetchNotifications(); // Re-compute everything
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, addNotification, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
