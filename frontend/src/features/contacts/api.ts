import { apiDelete, apiGet, apiPatch, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Contact, ContactInput, ContactUpdateInput } from '@/types/contact'

interface ContactDto {
  id: number
  name: string
  contact_type: Contact['type']
  email: string
  mobile: string | null
  city: string | null
  state: string | null
  pincode: string | null
  profile_image_url: string | null
  archived: boolean
}

function fromDto(dto: ContactDto): Contact {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.contact_type,
    email: dto.email,
    mobile: dto.mobile,
    city: dto.city,
    state: dto.state,
    pincode: dto.pincode,
    profileImageUrl: dto.profile_image_url,
    archived: dto.archived,
  }
}

function toDto(input: ContactInput) {
  return {
    name: input.name,
    contact_type: input.type,
    email: input.email,
    mobile: input.mobile || null,
    city: input.city || null,
    state: input.state || null,
    pincode: input.pincode || null,
    profile_image_url: input.profileImageUrl || null,
  }
}

function toUpdateDto(input: ContactUpdateInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.type !== undefined && { contact_type: input.type }),
    ...(input.email !== undefined && { email: input.email }),
    ...(input.mobile !== undefined && { mobile: input.mobile || null }),
    ...(input.city !== undefined && { city: input.city || null }),
    ...(input.state !== undefined && { state: input.state || null }),
    ...(input.pincode !== undefined && { pincode: input.pincode || null }),
    ...(input.profileImageUrl !== undefined && { profile_image_url: input.profileImageUrl || null }),
  }
}

export const contactsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<ContactDto[]>('/contacts', roleHeaders(role))
    return dtos.map(fromDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<ContactDto>(`/contacts/${id}`, roleHeaders(role))
    return fromDto(dto)
  },
  create: async (input: ContactInput, role?: BackendUserRole) => {
    const dto = await apiPost<ContactDto>('/contacts', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  update: async (id: number, input: ContactUpdateInput, role?: BackendUserRole) => {
    const dto = await apiPatch<ContactDto>(`/contacts/${id}`, toUpdateDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  remove: async (id: number, role?: BackendUserRole) => {
    await apiDelete<void>(`/contacts/${id}`, roleHeaders(role))
  },
}
