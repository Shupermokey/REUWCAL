import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 *
 * Provides caching and data synchronization for the app
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Keep cache for 10 minutes
      cacheTime: 10 * 60 * 1000,

      // Retry failed requests 3 times
      retry: 3,

      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.PROD,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,

      // Show error toast on mutation failure (handled in components)
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
