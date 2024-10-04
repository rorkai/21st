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
        Row: {
          id: string
          component_name: string
          description: string
          code: string
          
        }
        Insert: {
          component_name: string
          description: string
          code: string
          
        }
        Update: {
          component_name?: string
          description?: string
          code?: string
          
        }
      }
      users: {
        Row: {
          id: string
          username: string
          image_url: string
          name: string
          email: string
          created_at: string
          updated_at: string
          
        }
        Insert: {
          username: string
          image_url?: string
          name: string
          email: string
          
        }
        Update: {
          username?: string
          image_url?: string
          name?: string
          email?: string
          
        }
      }
      
    }
    Views: Record<string, GenericView>
    Functions: Record<string, GenericFunction>
  }
}