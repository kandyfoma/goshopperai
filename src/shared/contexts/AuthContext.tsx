// Authentication Context
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {User, AuthState} from '@/shared/types';
import {authService} from '@/shared/services/firebase';

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({children}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(user => {
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error: null,
      });
    });

    return unsubscribe;
  }, []);

  // Auto sign-in anonymously if not authenticated
  useEffect(() => {
    const autoSignIn = async () => {
      if (!state.isLoading && !state.isAuthenticated) {
        try {
          await authService.signInAnonymously();
        } catch (error) {
          console.error('Auto sign-in failed:', error);
        }
      }
    };

    autoSignIn();
  }, [state.isLoading, state.isAuthenticated]);

  const signIn = useCallback(async () => {
    setState(prev => ({...prev, isLoading: true, error: null}));
    try {
      const user = await authService.signInAnonymously();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Échec de la connexion',
      }));
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({...prev, isLoading: true}));
    try {
      await authService.signOut();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Échec de la déconnexion',
      }));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
