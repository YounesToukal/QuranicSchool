import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (token: string) => {
        try {
          const decoded: any = jwtDecode(token);
          set({
            token,
            user: decoded.user,
            isAuthenticated: true,
          });
          localStorage.setItem('token', token);
        } catch (error) {
          console.error('Invalid token:', error);
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
      
      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
