// UserGroup types

export interface UserGroup {
  id: string
  tenantId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  // Backend restituisce la lista degli userId (GUID) - join con usersStore per nome/email
  memberUserIds?: string[]
  relations?: GroupRelation[]
}

export interface GroupRelation {
  id: string
  relationType: string
  objectType: string
  objectId: string
  createdAt: string
}

export interface CreateUserGroupDto {
  name: string
  description?: string
  members?: string[]
}

export interface UpdateUserGroupDto {
  name?: string
  description?: string
  members?: string[]
}

export interface AddGroupMemberDto {
  userId: string
}

export interface RemoveGroupMemberDto {
  userId: string
}

export interface AddGroupRelationDto {
  relationType: string
  objectType: string
  objectId: string
}
