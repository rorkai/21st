import { supabase } from '@/utils/supabase';
import { Component, Tag, User } from '@/types/types';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

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

export async function getComponent(username: string, slug: string): Promise<Component | null> {
  console.log('getComponent called with username:', username, 'and slug:', slug);
  const { data, error } = await supabase
    .from('components')
    .select(`
      ${componentFields},
      tags:component_tags(tags(name, slug))
    `)
    .eq('component_slug', slug)
    .eq('user.username', username)
    .single();
  
  if (error) {
    console.error('Error fetching component:', error);
    return null;
  }

  if (data && data.tags) {
    data.tags = data.tags.map((tag: any) => tag.tags);
  }

  return data;
}

export function useComponent(username: string, slug: string) {
  return useQuery<Component | null, Error>({
    queryKey: ['component', username, slug],
    queryFn: () => getComponent(username, slug)
  });
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

    return data;
  } catch (error) {
    console.error('Error in getUserData:', error);
    return null;
  }
}

// Хук useUserData для клиентских компонентов
export function useUserData(username: string) {
  return useQuery<User | null, Error>({
    queryKey: ['user', username],
    queryFn: () => getUserData(username)
  });
}

export async function getUserComponents(userId: string): Promise<Component[] | null> {
  const { data, error } = await supabase
    .from('components')
    .select(componentFields)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user components:', error);
    return null;
  }

  return data;
}

export function useUserComponents(userId: string) {
  return useQuery<Component[] | null, Error>({
    queryKey: ['userComponents', userId],
    queryFn: () => getUserComponents(userId)
  });
}

export async function getComponents(): Promise<Component[]> {
  const { data, error } = await supabase.from('components').select(componentFields);

  if (error) {
    console.error('Error fetching components:', error);
    return [];
  }

  return data || [];
}

export function useComponents() {
  return useQuery<Component[], Error>({
    queryKey: ['components'],
    queryFn: getComponents
  });
}

export async function getComponentTags(componentId: string): Promise<Tag[] | null> {
  const { data, error } = await supabase
    .from('component_tags')
    .select('tags(name, slug)')
    .eq('component_id', componentId);

  if (error) {
    console.error('Error fetching component tags:', error);
    return null;
  }

  return data.map((item: any) => item.tags);
}

export function useComponentTags(componentId: string) {
  return useQuery<Tag[] | null, Error>({
    queryKey: ['componentTags', componentId],
    queryFn: () => getComponentTags(componentId)
  });
}