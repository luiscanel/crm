import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';

const AUTH_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    clearTimers();
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
    setUser(null);
    setShowTimeoutWarning(false);
  }, [clearTimers]);

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    clearTimers();
    localStorage.setItem('lastActivity', Date.now());
    setShowTimeoutWarning(false);

    // Set timeout to warning (25 minutes)
    warningRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, AUTH_TIMEOUT - 5 * 60 * 1000); // 5 min before timeout

    // Set logout timeout (30 minutes)
    timeoutRef.current = setTimeout(() => {
      logout();
    }, AUTH_TIMEOUT);
  }, [clearTimers, logout]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      const lastActivity = localStorage.getItem('lastActivity');
      
      if (token) {
        // Check if session has expired due to inactivity
        if (lastActivity) {
          const inactiveTime = Date.now() - parseInt(lastActivity);
          if (inactiveTime >= AUTH_TIMEOUT) {
            // Session expired due to inactivity
            localStorage.removeItem('token');
            setLoading(false);
            return;
          }
        }

        try {
          const data = await api.getMe();
          if (data.user) {
            setUser(data.user);
            resetActivityTimer();
          } else {
            localStorage.removeItem('token');
          }
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, [resetActivityTimer]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      if (!showTimeoutWarning) {
        resetActivityTimer();
      }
    };

    // Listen for user activity
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('mousemove', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
    };
  }, [user, showTimeoutWarning, resetActivityTimer]);

  // Warn before logout
  useEffect(() => {
    if (!user || !showTimeoutWarning) return;

    const handleActivity = () => {
      resetActivityTimer();
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
    };
  }, [user, showTimeoutWarning, resetActivityTimer]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('lastActivity', Date.now());
      setUser(data.user);
      resetActivityTimer();
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error('Error refreshing user:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser, showTimeoutWarning }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};