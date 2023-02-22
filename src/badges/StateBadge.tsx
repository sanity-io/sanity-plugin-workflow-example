import {DocumentBadgeDescription} from 'sanity'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'

import {State} from '../types'

export function StateBadge(states: State[], documentId: string): DocumentBadgeDescription | null {
  const {data, loading, error} = useWorkflowMetadata(documentId, states)
  const {state} = data

  if (loading || error) {
    if (error) {
      console.error(error)
    }

    return null
  }

  if (!state) {
    return null
  }

  return {
    label: state.title,
    // title: state.title,
    color: state?.color,
  }
}
