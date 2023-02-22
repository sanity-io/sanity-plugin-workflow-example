import {CurrentUser, DocumentBadgeDescription} from 'sanity'
import {useProjectUsers} from 'sanity-plugin-utils'
import {API_VERSION} from '../constants'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'

import {State} from '../types'

export function AssigneesBadge(
  states: State[],
  documentId: string,
  currentUser: CurrentUser | null
): DocumentBadgeDescription | null {
  const {data, loading, error} = useWorkflowMetadata(documentId, states)
  const {metadata} = data
  const userList = useProjectUsers({apiVersion: API_VERSION})

  if (loading || error || !metadata) {
    if (error) {
      console.error(error)
    }

    return null
  }

  if (!metadata?.assignees?.length) {
    return {
      label: 'Unassigned',
    }
  }

  const {assignees} = metadata ?? []
  const hasMe = currentUser ? assignees.some((assignee) => assignee === currentUser.id) : false
  const assigneesCount = hasMe ? assignees.length - 1 : assignees.length
  const assigneeUsers = userList.filter((user) => assignees.includes(user.id))
  const title = assigneeUsers.map((user) => user.displayName).join(', ')

  let label

  if (hasMe && assigneesCount === 0) {
    label = 'Assigned to Me'
  } else if (hasMe && assigneesCount > 0) {
    label = `Me and ${assigneesCount} ${assigneesCount === 1 ? 'other' : 'others'}`
  } else {
    label = `${assigneesCount} assigned`
  }

  return {
    label,
    title,
    color: 'primary',
  }
}
