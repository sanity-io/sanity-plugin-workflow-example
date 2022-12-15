import React from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'

import {Metadata, State} from '../types'

/**
 * Takes the published ID of a document and return the metadata and current state object
 *
 * @param id Source document published ID
 * @param states Array of States defined in plugin config
 * @returns State
 */
export function useWorkflowMetadata(
  id: string,
  states: State[]
): {
  data: {metadata?: Metadata; state?: State}
  loading: boolean
  error: boolean
} {
  const {
    data: metadata,
    loading,
    error,
  } = useListeningQuery<Metadata>(`*[_type == "workflow.metadata" && documentId == $id][0]`, {
    params: {id},
  })

  if (metadata?.state) {
    return {
      data: {
        metadata,
        state: states.find((s) => s.id === metadata.state),
      },
      loading,
      error,
    }
  }

  return {data: {}, loading, error}
}
