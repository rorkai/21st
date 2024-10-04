import { User, Component } from './types';

export type GenericView = {
  Row: Record<string, unknown>;
};

export type GenericFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export type Database = {
  public: {
    Tables: {
      components: {
        Row: Component
        Insert: Omit<Component, 'id' | 'created_at' | 'updated_at' | 'user' | 'downloads_count' | 'likes_count'>
        Update: Partial<Omit<Component, 'id' | 'created_at' | 'updated_at' | 'user'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: Record<string, GenericView>
    Functions: Record<string, GenericFunction>
  }
}