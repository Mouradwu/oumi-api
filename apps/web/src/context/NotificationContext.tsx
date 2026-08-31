"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  data: any;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_BASE = "https://oumiapi-production.up.railway.app";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur");
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Erreur markAsRead:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, fetchNotifications, markAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
