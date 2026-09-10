import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDataStore } from '@/services/mockDataStore';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInDemo: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'farmpilot_demo_auth_active';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setProfile(mockDataStore.getProfile());
      return;
    }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
    } catch {
      console.warn('Profile not found, falling back to mock profile');
      setProfile(mockDataStore.getProfile());
    }
  };

  const initDemoUser = () => {
    const demoProfile = mockDataStore.getProfile();
    const fakeUser: Partial<User> = {
      id: demoProfile.id,
      email: demoProfile.email,
      user_metadata: { full_name: demoProfile.full_name },
      app_metadata: { provider: 'demo' },
      aud: 'authenticated',
      created_at: demoProfile.created_at,
    };
    setUser(fakeUser as User);
    setProfile(demoProfile);
    setLoading(false);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // In demo mode, check if explicitly signed out
      const isSignedOut = localStorage.getItem(DEMO_USER_STORAGE_KEY) === 'logged_out';
      if (!isSignedOut) {
        initDemoUser();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
      return;
    }

    // Supabase Auth session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          setTimeout(() => fetchProfile(s.user.id), 500);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      const newProf = mockDataStore.updateProfile({ email, full_name: fullName });
      setUser({
        id: newProf.id,
        email: newProf.email,
        user_metadata: { full_name: fullName },
        app_metadata: { provider: 'demo' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User);
      setProfile(newProf);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      initDemoUser();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInDemo = async () => {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    initDemoUser();
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, 'logged_out');
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      isDemoMode: !isSupabaseConfigured,
      signUp, signIn, signOut, signInDemo, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
