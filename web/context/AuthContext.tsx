import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'farmer' | 'vet' | null;

export interface AuthUser {
  name: string;
  phone: string;
  village: string;
  aadhaar: string;
  role: 'farmer' | 'vet';
  identifier?: string;
  region?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isInitialized: boolean;
  register: (details: AuthUser) => void;
  loginWithPhone: (phone: string, otp?: string) => boolean;
  loginQuickDemo: (role: 'farmer' | 'vet') => void;
  logout: () => void;
  switchRole: (newRole: 'farmer' | 'vet') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PRESETS: Record<'farmer' | 'vet', AuthUser> = {
  farmer: {
    name: 'Samuel Kiprotich',
    phone: '9876543210',
    village: 'Rampur Farming Ward',
    aadhaar: '5412 8901 2345',
    role: 'farmer',
    identifier: 'FARM-KE-4882',
    region: 'Rift Valley Pastoral District',
  },
  vet: {
    name: 'Dr. Sarah Mercer',
    phone: '9888776655',
    village: 'Nairobi Central Sector',
    aadhaar: '6723 9012 3456',
    role: 'vet',
    identifier: 'VET-LIC-0994-HQ',
    region: 'National Disease Control Directorate',
  },
};

const STORAGE_KEY = 'sentinel_farmer_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check persistent session on startup
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sentinel_auth_session');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        // invalid JSON
      }
    }
    setIsInitialized(true);
  }, []);

  const persistUser = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const register = (details: AuthUser) => {
    persistUser(details);
  };

  const loginWithPhone = (phone: string, _otp?: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return false;

    const preset = Object.values(DEMO_PRESETS).find((u) => u.phone === cleanPhone);

    const loggedUser: AuthUser = preset || {
      name: 'Registered Community Farmer',
      phone: cleanPhone,
      village: 'Regional Agro Sector',
      aadhaar: '5412 8901 2345',
      role: 'farmer',
      identifier: `USER-${cleanPhone.slice(-4)}`,
    };

    persistUser(loggedUser);
    return true;
  };

  const loginQuickDemo = (demoRole: 'farmer' | 'vet') => {
    persistUser(DEMO_PRESETS[demoRole]);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('sentinel_auth_session');
  };

  const switchRole = (newRole: 'farmer' | 'vet') => {
    if (user) {
      const updated: AuthUser = {
        ...user,
        role: newRole,
        identifier: newRole === 'farmer' ? 'FARM-SWITCHED' : 'VET-SWITCHED',
      };
      persistUser(updated);
    } else {
      loginQuickDemo(newRole);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isInitialized,
        register,
        loginWithPhone,
        loginQuickDemo,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
