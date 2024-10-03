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
          // Добавьте остальные поля вашей таблицы components
        }
        Insert: {
          component_name: string
          description: string
          code: string
          // Добавьте остальные поля
        }
        Update: {
          component_name?: string
          description?: string
          code?: string
          // Добавьте остальные поля
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
          // Добавьте остальные поля вашей таблицы users
        }
        Insert: {
          username: string
          image_url?: string
          name: string
          email: string
          // Добавьте остальные поля
        }
        Update: {
          username?: string
          image_url?: string
          name?: string
          email?: string
          // Добавьте остальные поля
        }
      }
      // Добавьте остальные таблицы вашей базы данных
    }
    Views: Record<string, GenericView>
    Functions: Record<string, GenericFunction>
  }
}