import React from 'react'
import {SanityDocumentLike} from 'sanity'

export type State = {
  id: string
  title: string
  operation?: 'publish' | 'unpublish' | null
  // From badge props
  color?: 'primary' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode | React.ComponentType
}

export type WorkflowConfig = {
  schemaTypes: string[]
  states?: State[]
}

export type User = {
  createdAt: string
  displayName: string
  email: string
  familyName: string
  givenName: string
  id: string
  imageUrl: string
  isCurrentUser: boolean
  middleName: string
  projectId: string
  provider: string
  sanityUserId: string
  updatedAt: string
}

export type DragData = {
  documentId?: string
  x?: number
  y?: number
  state?: string
}

export type Metadata = SanityDocumentLike & {
  _rev: string
  assignees: string[]
  documentId: string
  state: string
}

export type SanityDocumentWithMetadata = SanityDocumentLike & {
  _metadata: Metadata | null
}
