import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserCategory, USER_CATEGORIES } from '@/types/auth';
import { apiService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  canAccessModule: (module: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await apiService.getProfile();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.usuario));
      setUser(response.usuario);
      
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    
    const categoryPermissions = USER_CATEGORIES[user.categoria];
    const modulePermission = categoryPermissions.permissions[module as keyof typeof categoryPermissions.permissions];
    
    return modulePermission?.actions.includes(action as any) || false;
  };

  const canAccessModule = (module: string): boolean => {
    if (!user) return false;
    
    const categoryPermissions = USER_CATEGORIES[user.categoria];
    return module in categoryPermissions.permissions;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      hasPermission,
      canAccessModule,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}