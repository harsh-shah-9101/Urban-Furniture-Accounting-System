import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProductForm } from '@/features/products/components/ProductForm'
import { useCreateProduct } from '@/features/products/hooks'
import type { ProductFormValues } from '@/features/products/schema'

export function ProductFormPage() {
  const navigate = useNavigate()
  const createProduct = useCreateProduct()

  function handleSubmit(values: ProductFormValues) {
    createProduct.mutate({ ...values, imageUrl: null }, { onSuccess: () => navigate('/products') })
  }

  return (
    <div>
      <PageHeader title="New Product" />
      <ProductForm onSubmit={handleSubmit} isSubmitting={createProduct.isPending} />
    </div>
  )
}
