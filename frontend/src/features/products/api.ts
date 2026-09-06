import { apiDelete, apiGet, apiPatch, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Product, ProductInput, ProductUpdateInput } from '@/types/product'

interface ProductDto {
  id: number
  name: string
  product_type: Product['type']
  category: string
  sales_price: string
  cost_price: string
  image_url: string | null
  archived: boolean
}

function fromDto(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.product_type,
    category: dto.category,
    salesPrice: Number(dto.sales_price),
    cost: Number(dto.cost_price),
    imageUrl: dto.image_url,
    archived: dto.archived,
  }
}

function toDto(input: ProductInput) {
  return {
    name: input.name,
    product_type: input.type,
    category: input.category,
    sales_price: input.salesPrice,
    cost_price: input.cost,
    image_url: input.imageUrl || null,
  }
}

function toUpdateDto(input: ProductUpdateInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.type !== undefined && { product_type: input.type }),
    ...(input.category !== undefined && { category: input.category }),
    ...(input.salesPrice !== undefined && { sales_price: input.salesPrice }),
    ...(input.cost !== undefined && { cost_price: input.cost }),
    ...(input.imageUrl !== undefined && { image_url: input.imageUrl || null }),
  }
}

export const productsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<ProductDto[]>('/products', roleHeaders(role))
    return dtos.map(fromDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<ProductDto>(`/products/${id}`, roleHeaders(role))
    return fromDto(dto)
  },
  create: async (input: ProductInput, role?: BackendUserRole) => {
    const dto = await apiPost<ProductDto>('/products', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  update: async (id: number, input: ProductUpdateInput, role?: BackendUserRole) => {
    const dto = await apiPatch<ProductDto>(`/products/${id}`, toUpdateDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  remove: async (id: number, role?: BackendUserRole) => {
    await apiDelete<void>(`/products/${id}`, roleHeaders(role))
  },
}
