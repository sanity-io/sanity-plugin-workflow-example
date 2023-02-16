import React from 'react'
import {useToast, Button} from '@sanity/ui'
import {useClient} from 'sanity'
import {UserExtended} from 'sanity-plugin-utils'

import FloatingCard from './FloatingCard'
import {API_VERSION, ORDER_MAX, ORDER_MIN} from '../constants'
import {SanityDocumentWithMetadata, State} from '../types'

type ValidatorsProps = {
  data: SanityDocumentWithMetadata[]
  userList: UserExtended[]
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

  const documentsWithInvalidUserIds = data?.length
    ? data.reduce((acc, cur) => {
        const {documentId, assignees} = cur._metadata ?? {}
        const allAssigneesExist = assignees?.length
          ? assignees?.every((a) => userList.find((u) => u.id === a))
          : true

        return !allAssigneesExist && documentId ? [...acc, documentId] : acc
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

      // TODO: This is naive, should be smarter
      const highestOrder =
        [...data]
          ?.sort((a, b) =>
            b?._metadata?.order && a?._metadata?.order
              ? b?._metadata?.order - a?._metadata?.order
              : 0
          )
          ?.pop()?._metadata?.order ?? ORDER_MAX

      const tx = ids.reduce((item, documentId, txIndex) => {
        return item.createOrReplace({
          _id: `workflow-metadata.${documentId}`,
          _type: 'workflow.metadata',
          state: states[0].id,
          documentId,
          order: highestOrder + txIndex * 500,
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Imported ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, states, toast, data]
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

      // TODO: Attempt to use existing document orders
      const startingValue = ORDER_MIN * 2
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
      {documentsWithInvalidUserIds.length > 0 ? (
        <Button
          tone="caution"
          onClick={() => removeUsersFromDocuments(documentsWithInvalidUserIds)}
          text={
            documentsWithInvalidUserIds.length === 1
              ? `Remove Invalid Users from 1 Document`
              : `Remove Invalid Users from ${documentsWithInvalidUserIds.length} Documents`
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
      {/* <Button
        tone="caution"
        onClick={() => addOrderToDocuments(data.map((doc) => String(doc._metadata?.documentId)))}
        text="Reset order"
      /> */}
    </FloatingCard>
  )
}
