import {CurrentUser, SanityDocumentLike} from 'sanity'

export type State = {
  id: string
  transitions: string[]
  title: string
  roles?: string[]
  requireAssignment?: boolean
  requireValidation?: boolean
  // From document badges
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

export type StateCheck<Id, States> = {
  id: Id
  // Transitions is an array of State ids
  transitions?: States extends {id: infer Id2}[] ? Id2[] : never
} & State

export type FilterOptions = {
  locales: string[]
}

export type WorkflowConfig = {
  schemaTypes: string[]
  states?: State[]
  filters?: (user: CurrentUser | null) => FilterOptions | undefined
}

export function defineStates<
  Id extends string,
  States extends StateCheck<Id, States>[]
>(states: States): States {
  return states
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
  orderRank: string
  locale: string
}

export type KeyedMetadata = {[key: string]: Metadata}

export type SanityDocumentWithMetadata = {
  _metadata: Metadata
  _id: string
  _type: string
  _rev: string
  _updatedAt: string
}
