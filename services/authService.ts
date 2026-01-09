import { supabase } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { CustomAbbreviation } from '../types';

export interface AuthError {
  message: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const authService = {
  async signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return {
      user: data.user,
      session: data.session,
      error: error ? { message: error.message } : null,
    };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data.user,
      session: data.session,
      error: error ? { message: error.message } : null,
    };
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return {
      error: error ? { message: error.message } : null,
    };
  },

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return {
      error: error ? { message: error.message } : null,
    };
  },

  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getSession();
    return {
      session: data.session,
      error: error ? { message: error.message } : null,
    };
  },

  async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getUser();
    return {
      user: data.user,
      error: error ? { message: error.message } : null,
    };
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async getProfile(userId: string): Promise<{ profile: UserProfile | null; error: AuthError | null }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return {
      profile: data,
      error: error ? { message: error.message } : null,
    };
  },

  async updateProfile(userId: string, updates: Partial<Pick<UserProfile, 'full_name' | 'avatar_url'>>): Promise<{ error: AuthError | null }> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return {
      error: error ? { message: error.message } : null,
    };
  },

  async getCustomizations(userId: string): Promise<{ abbreviations: CustomAbbreviation[]; error: AuthError | null }> {
    const { data, error } = await supabase
      .from('user_customizations')
      .select('abbreviations')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row found, return empty array
      return { abbreviations: [], error: null };
    }

    return {
      abbreviations: data?.abbreviations || [],
      error: error ? { message: error.message } : null,
    };
  },

  async saveCustomizations(userId: string, abbreviations: CustomAbbreviation[]): Promise<{ error: AuthError | null }> {
    const { error } = await supabase
      .from('user_customizations')
      .upsert({
        user_id: userId,
        abbreviations,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return {
      error: error ? { message: error.message } : null,
    };
  },
};
