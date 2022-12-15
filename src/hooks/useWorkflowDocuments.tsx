import React from 'react'
import {useListeningQuery} from 'sanity-plugin-utils'
import {SanityDocumentLike} from 'sanity'

import {SanityDocumentWithMetadata, Metadata} from '../types'

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
  // Get and listen to changes on documents + workflow metadata documents
  const {data, loading, error} = useListeningQuery<DocumentsAndMetadata>(
    COMBINED_QUERY,
    {schemaTypes},
    {},
    INITIAL_DATA
  )

  // Combine metadata data into document
  const documentsWithMetadata = React.useMemo(
    () =>
      data.documents.reduce((acc: SanityDocumentWithMetadata[], cur) => {
        // Filter out documents without metadata
        const curMeta = data.metadata.find((d) => d.documentId === cur._id.replace(`drafts.`, ``))

        if (!curMeta) {
          return acc
        }

        const curWithMetadata = {_metadata: curMeta, ...cur, thing: 'ert'}

        // Remove `published` from array if `draft` exists
        if (!cur._id.startsWith(`drafts.`)) {
          // eslint-disable-next-line max-nested-callbacks
          const alsoHasDraft: boolean = Boolean(
            data.documents.find((doc) => doc._id === `drafts.${cur._id}`)
          )

          return alsoHasDraft ? acc : [...acc, curWithMetadata]
        }

        return [...acc, curWithMetadata]
      }, []),
    [data]
  )

  return {
    workflowData: {data: documentsWithMetadata, loading, error},
    operations: {},
  }
}
