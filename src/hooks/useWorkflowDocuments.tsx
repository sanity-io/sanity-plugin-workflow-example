import React from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'
import {useToast} from '@sanity/ui'
import {SanityDocumentLike, useClient} from 'sanity'
import {DraggableLocation} from 'react-beautiful-dnd'

import {SanityDocumentWithMetadata, Metadata, State} from '../types'

type DocumentsAndMetadata = {
  documents: SanityDocumentLike[]
  metadata: Metadata[]
}

const DOCUMENT_LIST_QUERY = `*[_type in $schemaTypes]{ _id, _type, _rev }`
const METADATA_LIST_QUERY = `*[_type == "workflow.metadata"]{
  _rev,
  assignees,
  documentId,
  state
}`

const COMBINED_QUERY = `{
  "documents": ${DOCUMENT_LIST_QUERY},
  "metadata": ${METADATA_LIST_QUERY}
}`

const INITIAL_DATA: DocumentsAndMetadata = {
  documents: [],
  metadata: [],
}

export function useWorkflowDocuments(schemaTypes: string[]) {
  const toast = useToast()
  const client = useClient()
  const [localDocuments, setLocalDocuments] = React.useState<SanityDocumentWithMetadata[]>([])

  // Get and listen to changes on documents + workflow metadata documents
  const {data, loading, error} = useListeningQuery<DocumentsAndMetadata>(COMBINED_QUERY, {
    params: {schemaTypes},
    initialValue: INITIAL_DATA,
  })

  // Store local state for optimistic updates
  React.useEffect(() => {
    if (data) {
      // Combine metadata data into document
      const documentsWithMetadata = data.documents.reduce(
        (acc: SanityDocumentWithMetadata[], cur) => {
          // Filter out documents without metadata
          const curMeta = data.metadata.find((d) => d.documentId === cur._id.replace(`drafts.`, ``))

          // Add _metadata as null so it can be shown as a document that needs to be imported into workflow
          if (!curMeta) {
            return [...acc, {_metadata: null, ...cur}]
          }

          const curWithMetadata = {_metadata: curMeta, ...cur}

          // Remove `published` from array if `draft` exists
          if (!cur._id.startsWith(`drafts.`)) {
            // eslint-disable-next-line max-nested-callbacks
            const alsoHasDraft: boolean = Boolean(
              data.documents.find((doc) => doc._id === `drafts.${cur._id}`)
            )

            return alsoHasDraft ? acc : [...acc, curWithMetadata]
          }

          return [...acc, curWithMetadata]
        },
        []
      )

      setLocalDocuments(documentsWithMetadata)
    }
  }, [data])

  const move = React.useCallback(
    (draggedId: string, destination: DraggableLocation, states: State[]) => {
      // Optimistic update
      const currentLocalData = localDocuments
      const newLocalDocuments = localDocuments.map((item) => {
        if (item._metadata.documentId === draggedId) {
          return {
            ...item,
            _metadata: {
              ...item._metadata,
              state: destination.droppableId,
            },
          }
        }

        return item
      })

      setLocalDocuments(newLocalDocuments)

      // Now client-side update
      const newStateId = destination.droppableId
      const newState = states.find((s) => s.id === newStateId)
      const document = localDocuments.find((d) => d._metadata.documentId === draggedId)

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
      const {_rev, documentId} = document._metadata

      client
        .patch(`workflow-metadata.${documentId}`)
        .ifRevisionId(_rev)
        .set({state: newStateId})
        .commit()
        .then(() => {
          return toast.push({
            title: `Moved to "${newState?.title ?? newStateId}"`,
            description: documentId,
            status: 'success',
          })
        })
        .catch(() => {
          // Revert optimistic update
          setLocalDocuments(currentLocalData)

          return toast.push({
            title: `Failed to move to "${newState?.title ?? newStateId}"`,
            description: documentId,
            status: 'error',
          })
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
