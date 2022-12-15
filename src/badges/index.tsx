import {DocumentBadgeDescription, DocumentBadgeProps} from 'sanity'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'

import {State} from '../types'

export function StateBadge(
  props: DocumentBadgeProps,
  states: State[]
): DocumentBadgeDescription | null {
  const {id} = props
  const {data, loading, error} = useWorkflowMetadata(id, states)
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
    title: state.title,
    color: state?.color,
  }
}
