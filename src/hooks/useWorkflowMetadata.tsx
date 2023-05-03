import {useMemo} from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'

import {API_VERSION} from '../constants'
import {KeyedMetadata, Metadata} from '../types'

/**
 * Takes the published ID of documents and return the metadata for those documents.
 *
 * @param ids Source document published IDs
 */
export function useWorkflowMetadata(ids: string[]): {
  data: KeyedMetadata
  loading: boolean
  error: boolean
} {
  const {
    data: rawData,
    loading,
    error,
  } = useListeningQuery<Metadata[]>(
    `*[_type == "workflow.metadata" && documentId in $ids]{
      _id,
      _type,
      _rev,
      assignees,
      documentId,
      state,
      orderRank
    }`,
    {
      params: {ids},
      options: {apiVersion: API_VERSION},
    }
  )

  const keyedMetadata = useMemo(() => {
    if (!rawData || rawData.length === 0) return {}

    return rawData.reduce<KeyedMetadata>((acc, cur) => {
      return {
        ...acc,
        [cur.documentId]: cur,
      }
    }, {})
  }, [rawData])

  return {data: keyedMetadata, loading, error}
}
