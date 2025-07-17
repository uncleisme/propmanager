import { supabase } from '../utils/supabaseClient';

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return !error;
};

export const register = async (full_name: string, email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      }
    }
  });
  return !error;
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const isAuthenticated = () => {
  const session = supabase.auth.getSession();
  return !!session;
};