/**
 * TypeScript declaration file for AuthContext
 * Provides type definitions for the React context
 */

declare module './AuthContext' {
  export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'teacher' | 'student';
    [key: string]: any;
  }

  export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (userData: any) => Promise<void>;
    loading: boolean;
    [key: string]: any;
  }

  export function useAuth(): AuthContextType;
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
}
