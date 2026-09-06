import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productsApi } from './api'
import { productKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { ProductInput, ProductUpdateInput } from '@/types/product'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function useProducts() {
  const role = useRole()
  return useQuery({ queryKey: productKeys.lists(), queryFn: () => productsApi.list(role) })
}

export function useCreateProduct() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) => productsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product created')
    },
  })
}

export function useUpdateProduct(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductUpdateInput) => productsApi.update(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product updated')
    },
  })
}

export function useDeleteProduct() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productsApi.remove(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product deleted')
    },
  })
}
