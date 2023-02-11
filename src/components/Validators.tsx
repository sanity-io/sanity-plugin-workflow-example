import React from 'react'
import {useToast, Button} from '@sanity/ui'
import {useClient} from 'sanity'

import FloatingCard from './FloatingCard'
import {API_VERSION} from '../constants'
import {SanityDocumentWithMetadata, State} from '../types'

type ValidatorsProps = {
  data: SanityDocumentWithMetadata[]
  userList: any[]
  states: State[]
}

export default function Validators({data, userList, states}: ValidatorsProps) {
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  // A lot of error-checking
  const documentsWithoutMetadataIds = data?.length
    ? data.filter((doc) => !doc._metadata).map((d) => d._id.replace(`drafts.`, ``))
    : []
  const documentsWithoutValidMetadataIds = data?.length
    ? data.reduce((acc, cur) => {
        const {documentId, state} = cur._metadata ?? {}
        const stateExists = states.find((s) => s.id === state)

        return !stateExists && documentId ? [...acc, documentId] : acc
      }, [] as string[])
    : []
  const documentsWithoutValidUsersIds = data?.length
    ? data.reduce((acc, cur) => {
        const {documentId, assignees} = cur._metadata ?? {}
        const assigneesExist = assignees?.every((a) => userList.find((u) => u.id === a))

        return !assigneesExist && documentId ? [...acc, documentId] : acc
      }, [] as string[])
    : []
  const documentsWithoutOrderIds = data?.length
    ? data.reduce((acc, cur) => {
        const {documentId, order} = cur._metadata ?? {}

        return !order && documentId ? [...acc, documentId] : acc
      }, [] as string[])
    : []

  // Creates metadata documents for those that do not have them
  const importDocuments = React.useCallback(
    async (ids: string[]) => {
      toast.push({
        title: 'Importing documents',
        status: 'info',
      })

      const tx = ids.reduce((item, documentId) => {
        return item.createOrReplace({
          _id: `workflow-metadata.${documentId}`,
          _type: 'workflow.metadata',
          state: states[0].id,
          documentId,
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Imported ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, states, toast]
  )

  // Updates metadata documents to a valid, existing state
  const correctDocuments = React.useCallback(
    async (ids: string[]) => {
      toast.push({
        title: 'Correcting...',
        status: 'info',
      })

      const tx = ids.reduce((item, documentId) => {
        return item.patch(`workflow-metadata.${documentId}`, {
          set: {state: states[0].id},
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Corrected ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, states, toast]
  )

  // Remove users that are no longer in the project from documents
  const removeUsersFromDocuments = React.useCallback(
    async (ids: string[]) => {
      toast.push({
        title: 'Removing users...',
        status: 'info',
      })

      const tx = ids.reduce((item, documentId) => {
        const {assignees} = data.find((d) => d._id === documentId)?._metadata ?? {}
        const validAssignees = assignees?.length
          ? // eslint-disable-next-line max-nested-callbacks
            assignees.filter((a) => userList.find((u) => u.id === a)?.id)
          : []

        return item.patch(`workflow-metadata.${documentId}`, {
          set: {assignees: validAssignees},
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Corrected ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, data, toast, userList]
  )

  // Add order value to metadata documents
  const addOrderToDocuments = React.useCallback(
    async (ids: string[]) => {
      toast.push({
        title: 'Adding ordering...',
        status: 'info',
      })

      // TODO: This doesn't consider the order of other documents
      const startingValue = 10000
      const tx = ids.reduce((item, documentId, itemIndex) => {
        return item.patch(`workflow-metadata.${documentId}`, {
          set: {order: startingValue + itemIndex * 1000},
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Added order to ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, toast]
  )

  return (
    <FloatingCard>
      {documentsWithoutMetadataIds.length > 0 ? (
        <Button
          tone="caution"
          onClick={() => importDocuments(documentsWithoutMetadataIds)}
          text={
            documentsWithoutMetadataIds.length === 1
              ? `Import 1 Missing Document into Workflow`
              : `Import ${documentsWithoutMetadataIds.length} Missing Documents into Workflow`
          }
        />
      ) : null}
      {documentsWithoutValidMetadataIds.length > 0 ? (
        <Button
          tone="caution"
          onClick={() => correctDocuments(documentsWithoutValidMetadataIds)}
          text={
            documentsWithoutValidMetadataIds.length === 1
              ? `Correct 1 Document State`
              : `Correct ${documentsWithoutValidMetadataIds.length} Document States`
          }
        />
      ) : null}
      {documentsWithoutValidUsersIds.length > 0 ? (
        <Button
          tone="caution"
          onClick={() => removeUsersFromDocuments(documentsWithoutValidUsersIds)}
          text={
            documentsWithoutValidUsersIds.length === 1
              ? `Remove Invalid Users from 1 Document`
              : `Remove Invalid Users from ${documentsWithoutValidUsersIds.length} Documents`
          }
        />
      ) : null}
      {documentsWithoutOrderIds.length > 0 ? (
        <Button
          tone="caution"
          onClick={() => addOrderToDocuments(documentsWithoutOrderIds)}
          text={
            documentsWithoutOrderIds.length === 1
              ? `Set Order for 1 Document`
              : `Set Order for ${documentsWithoutOrderIds.length} Documents`
          }
        />
      ) : null}
    </FloatingCard>
  )
}
