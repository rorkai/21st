import { supabase } from '@/utils/supabase';
import { Component, User } from '@/types/types';

const userFields = `
  id,
  username,
  image_url,
  name,
  email,
  created_at,
  updated_at
`;

const componentFields = `
  *,
  user:users!user_id (${userFields})
`;

async function fetchComponents(
  query: any
): Promise<Component[] | null> {
  try {
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching components:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchComponents:', error);
    return null;
  }
}

export async function getComponent(username: string, slug: string): Promise<Component | null> {
  console.log('getComponent called with username:', username, 'and slug:', slug);
  const query = supabase
    .from('components')
    .select(componentFields)
    .eq('component_slug', slug)
    .eq('user.username', username)
    .single();

  const { data, error } = await query;
  
  console.log('Fetched component data:', data); // Добавьте это для отладки
  
  if (error) {
    console.error('Error fetching component:', error);
    return null;
  }
  return data;
}

export async function getUserData(username: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(userFields)
      .eq('username', username)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return null;
    }

    if ('error' in data) {
      throw new Error('Failed to fetch user');
    }
    return data;
  } catch (error) {
    console.error('Error in getUserData:', error);
    return null;
  }
}

export async function getUserComponents(userId: string): Promise<Component[] | null> {
  const query = supabase
    .from('components')
    .select(componentFields)
    .eq('user_id', userId);

  return await fetchComponents(query);
}

export async function getComponents(): Promise<Component[]> {
  const query = supabase.from('components').select(componentFields);
  return await fetchComponents(query);
}