import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
})

// Проверка соединения
supabase.auth.getSession().then(({ error }) => {
  if (error) {
    console.error('Error connecting to Supabase:', error)
  } else {
    console.error('Successfully connected to Supabase')
  }
}).catch(error => {
  console.error('Unexpected error during Supabase connection:', error)
})