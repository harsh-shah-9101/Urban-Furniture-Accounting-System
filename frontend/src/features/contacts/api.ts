import { apiGet, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Contact, ContactInput } from '@/types/contact'

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

export const contactsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<ContactDto[]>('/contacts', roleHeaders(role))
    return dtos.map(fromDto)
  },
  create: async (input: ContactInput, role?: BackendUserRole) => {
    const dto = await apiPost<ContactDto>('/contacts', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
}
