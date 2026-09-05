import { apiGet, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Product, ProductInput } from '@/types/product'

interface ProductDto {
  id: number
  name: string
  product_type: Product['type']
  category: string
  sales_price: string
  cost_price: string
  image_url: string | null
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

export const productsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<ProductDto[]>('/products', roleHeaders(role))
    return dtos.map(fromDto)
  },
  create: async (input: ProductInput, role?: BackendUserRole) => {
    const dto = await apiPost<ProductDto>('/products', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
}
