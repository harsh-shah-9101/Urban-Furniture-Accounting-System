export type ProductType = 'goods' | 'service' | 'combo'

export interface Product {
  id: number
  name: string
  type: ProductType
  category: string
  salesPrice: number
  cost: number
  imageUrl: string | null
  archived: boolean
}

export type ProductInput = Omit<Product, 'id' | 'archived'>
export type ProductUpdateInput = Partial<ProductInput>
