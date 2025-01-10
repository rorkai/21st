import { createClient } from '@supabase/supabase-js'
import { useCallback } from 'react'
import { AnalyticsActivityType } from '@/types/global'
// Type guard for runtime checking
function isValidActivityType(type: string): type is AnalyticsActivityType {
  return Object.values(AnalyticsActivityType).includes(type as AnalyticsActivityType)
}

// Initialize Supabase client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export function useSupabaseAnalytics() {
  const capture = useCallback((
    component_id: number,
    activity_type: AnalyticsActivityType,
    user_id?: string
  ) => {
    // Skip analytics in development mode
    if (process.env.NODE_ENV === 'development') {
      return
    }

    try {
      // Runtime type check
      if (!isValidActivityType(activity_type)) {
        throw new Error(`Invalid activity type: ${activity_type}`)
      }

      supabase
        .from('component_analytics')
        .insert({
          component_id,
          activity_type,
          created_at: new Date().toISOString(),
          user_id,
        })
        .then(({ error }) => {
          if (error) {
            console.error('Analytics capture failed:', error)
          }
        })
    } catch (err) {
      console.error('Analytics capture error:', err)
    }
  }, [])

  return { capture }
}
