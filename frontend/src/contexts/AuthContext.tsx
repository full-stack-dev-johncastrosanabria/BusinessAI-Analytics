import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

interface User {
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

interface AuthContextType {
  readonly isAuthenticated: boolean;
  readonly user: User | null;
  readonly login: (email: string, password: string) => Promise<boolean>;
  readonly logout: () => void;
  readonly loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const authStatus = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('user');
    
    if (authStatus === 'true' && userData) {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData) as User);
      } catch {
        // Invalid stored data - clear it
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // For demo purposes, accept any credentials
    // In a real app, this would make an API call
    try {
      const userData = {
        name: 'Demo User',
        email: email,
        role: 'Business Analyst'
      };

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      
      return true;
    } catch (error: unknown) {
      // Only log errors in development mode
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Login failed:', error instanceof Error ? error.message : String(error));
      }
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    login,
    logout,
    loading
  }), [isAuthenticated, user, login, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};