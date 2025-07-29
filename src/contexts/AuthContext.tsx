import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserCategory, USER_CATEGORIES } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: string, action: string) => boolean;
  canAccessModule: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    nome: 'Admin Técnico',
    email: 'admin@sistema.gov.br',
    categoria: 'administracao_tecnica',
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    nome: 'Nutricionista Chefe',
    email: 'nutricao@sistema.gov.br',
    categoria: 'gerencia_nutricao',
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    nome: 'Comissão Recebimento',
    email: 'recebimento@sistema.gov.br',
    categoria: 'comissao_recebimento',
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    const foundUser = mockUsers.find(u => u.email === email && u.ativo);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
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
      canAccessModule
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