import {DraggableLocation} from '@hello-pangea/dnd'
import {useToast} from '@sanity/ui'
import groq from 'groq'
import React from 'react'
import {useClient} from 'sanity'
import {useListeningQuery} from 'sanity-plugin-utils'

import {API_VERSION} from '../constants'
import {SanityDocumentWithMetadata, State} from '../types'

const QUERY = groq`*[_type == "workflow.metadata"]|order(orderRank){
  "_metadata": {
    _rev,
    assignees,
    documentId,
    state,
    orderRank
  },
  ...(
    *[_id in [^.documentId, "drafts." + ^.documentId]]|order(_updatedAt)[0]{ 
      _id, 
      _type, 
      _rev, 
      _updatedAt 
    }
  )
}`

type WorkflowDocuments = {
  workflowData: {
    data: SanityDocumentWithMetadata[]
    loading: boolean
    error: boolean
  }
  operations: {
    move: (
      draggedId: string,
      destination: DraggableLocation,
      states: State[],
      newOrder: string
    ) => void
  }
}

export function useWorkflowDocuments(schemaTypes: string[]): WorkflowDocuments {
  const toast = useToast()
  const client = useClient({apiVersion: API_VERSION})

  // Get and listen to changes on documents + workflow metadata documents
  const {data, loading, error} = useListeningQuery<
    SanityDocumentWithMetadata[]
  >(QUERY, {
    params: {schemaTypes},
    initialValue: [],
  })

  const [localDocuments, setLocalDocuments] = React.useState<
    SanityDocumentWithMetadata[]
  >([])

  React.useEffect(() => {
    if (data) {
      setLocalDocuments(data)
    }
  }, [data])

  const move = React.useCallback(
    async (
      draggedId: string,
      destination: DraggableLocation,
      states: State[],
      newOrder: string
    ) => {
      // Optimistic update
      const currentLocalData = localDocuments
      const newLocalDocuments = localDocuments.map((item) => {
        if (item?._metadata?.documentId === draggedId) {
          return {
            ...item,
            _metadata: {
              ...item._metadata,
              state: destination.droppableId,
              orderRank: newOrder,
              // This value won't be written to the document
              // It's done so that un/publish operations don't happen twice
              // Because a moved document's card will update once optimistically
              // and then again when the document is updated
              optimistic: true,
            },
          }
        }

        return item
      })

      setLocalDocuments(newLocalDocuments)

      // Now client-side update
      const newStateId = destination.droppableId
      const newState = states.find((s) => s.id === newStateId)
      const document = localDocuments.find(
        (d) => d?._metadata?.documentId === draggedId
      )

      if (!newState?.id) {
        toast.push({
          title: `Could not find target state ${newStateId}`,
          status: 'error',
        })
        return null
      }

      if (!document) {
        toast.push({
          title: `Could not find dragged document in data`,
          status: 'error',
        })
        return null
      }

      // We need to know if it's a draft or not
      const {_id, _type} = document

      // Metadata + useDocumentOperation always uses Published id
      const {documentId, _rev} = document._metadata || {}

      await client
        .patch(`workflow-metadata.${documentId}`)
        .ifRevisionId(_rev)
        .set({state: newStateId, orderRank: newOrder})
        .commit()
        .then((res) => {
          toast.push({
            title: `Moved to "${newState?.title ?? newStateId}"`,
            status: 'success',
          })
          return res
        })
        .catch((err) => {
          // Revert optimistic update
          setLocalDocuments(currentLocalData)

          toast.push({
            title: `Failed to move to "${newState?.title ?? newStateId}"`,
            description: err.message,
            status: 'error',
          })
          return null
        })

      // Send back to the workflow board so a document update can happen
      return {_id, _type, documentId, state: newState as State}
    },
    [client, toast, localDocuments]
  )

  return {
    workflowData: {data: localDocuments, loading, error},
    operations: {move},
  }
}
