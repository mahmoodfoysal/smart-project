"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useSelector((state) => state.auth?.user);
  const userEmail = user?.email || "anonymous";
  const storageKey = `app_notifications_${userEmail}`;

  useEffect(() => {
    // Load from local storage when user changes
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) {
        console.error("Failed to parse notifications from localStorage");
        setNotifications([]);
        setUnreadCount(0);
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [storageKey]);

  const saveToStorage = (newNotifs) => {
    localStorage.setItem(storageKey, JSON.stringify(newNotifs));
  };

  const addNotification = (title, message, type = "info") => {
    const newNotif = {
      id: Date.now().toString(),
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50); // Keep last 50
      saveToStorage(updated);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveToStorage(updated);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveToStorage(updated);
      setUnreadCount(0);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    saveToStorage([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};
