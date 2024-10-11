import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query"
import { useClerkSupabaseClient } from "../utils/clerk"
import { useUser } from "@clerk/nextjs"
import {
  hasUserLikedComponent,
  likeComponent,
  unlikeComponent,
} from "../utils/dataFetchers"

export function useHasUserLikedComponent(componentId: number) {
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()

  return useQuery<boolean, Error>({
    queryKey: ["hasUserLikedComponent", componentId, user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated")
      try {
        const result = await hasUserLikedComponent(supabase, user.id, componentId)
        return result
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'PGRST116') {
          // If the query returned no rows, it means the user hasn't liked the component
          return false
        }
        throw error
      }
    },
    enabled: !!user,
  })
}

export function useLikeComponent(): UseMutationResult<void, Error, number> {
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const { user } = useUser()
  return useMutation<void, Error, number>({
    mutationFn: async (componentId: number) => {
      if (!user) throw new Error("User not authenticated")
      await likeComponent(supabase, user.id, componentId)
    },
      onSuccess: (_, componentId) => {
        queryClient.invalidateQueries({
          queryKey: ["hasUserLikedComponent", componentId, user?.id],
        })
        queryClient.invalidateQueries({
          queryKey: ["component", componentId],
        })
        queryClient.invalidateQueries({
          queryKey: ["components"],
        })
      },
    },
  )
}

export function useUnlikeComponent(): UseMutationResult<void, Error, number> {
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation<void, Error, number>({
    mutationFn: async (componentId: number) => {
      if (!user) throw new Error("User not authenticated")
      await unlikeComponent(supabase, user.id, componentId)
    },
    onSuccess: (_, componentId) => {
      queryClient.invalidateQueries({
          queryKey: ["hasUserLikedComponent", componentId, user?.id],
        })
        queryClient.invalidateQueries({
          queryKey: ["component", componentId],
        })
        queryClient.invalidateQueries({
          queryKey: ["components"],
        })
      },
    },
  )
}
