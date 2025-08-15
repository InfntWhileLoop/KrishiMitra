import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  phone: string;
  language: string;
  farmDetails?: {
    location: string;
    landSize: string;
    crops: string[];
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<boolean>;
  signup: (name: string, phone: string, language: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('krishimitra_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string, otp: string): Promise<boolean> => {
    // Simulate OTP verification
    if (otp === '123456') {
      const userData = {
        id: Date.now().toString(),
        name: 'Sample Farmer',
        phone,
        language: 'Hindi',
        farmDetails: {
          location: 'Maharashtra, India',
          landSize: '5 acres',
          crops: ['Rice', 'Wheat', 'Sugarcane']
        }
      };
      setUser(userData);
      localStorage.setItem('krishimitra_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const signup = async (name: string, phone: string, language: string): Promise<boolean> => {
    const userData = {
      id: Date.now().toString(),
      name,
      phone,
      language
    };
    setUser(userData);
    localStorage.setItem('krishimitra_user', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('krishimitra_user');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('krishimitra_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};