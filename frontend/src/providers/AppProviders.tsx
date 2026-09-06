import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/http'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/providers/ThemeProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            // Mutations that handle their own errors (e.g. inline form validation) opt out.
            if (mutation.options.onError) return
            const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
            toast.error(message)
          },
        }),
      }),
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
