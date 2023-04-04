import {Button, useToast} from '@sanity/ui'
import {LexoRank} from 'lexorank'
import React from 'react'
import {useClient} from 'sanity'
import {UserExtended} from 'sanity-plugin-utils'

import {API_VERSION} from '../constants'
import {SanityDocumentWithMetadata, State} from '../types'
import FloatingCard from './FloatingCard'

type VerifyProps = {
  data: SanityDocumentWithMetadata[]
  userList: UserExtended[]
  states: State[]
}

// This component checks the validity of the data in the Kanban
// It will only render something it there is invalid date
// And will render buttons to fix the data
export default function Verify(props: VerifyProps) {
  const {data, userList, states} = props
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  // A lot of error-checking
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
        const {documentId, orderRank} = cur._metadata ?? {}

        return !orderRank && documentId ? [...acc, documentId] : acc
      }, [] as string[])
    : []

  const documentsWithDuplicatedOrderIds = data?.length
    ? data.reduce((acc, cur) => {
        const {documentId, orderRank} = cur._metadata ?? {}

        return orderRank &&
          data.filter((d) => d._metadata?.orderRank === orderRank).length > 1 &&
          documentId
          ? [...acc, documentId]
          : acc
      }, [] as string[])
    : []

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
        title: `Corrected ${
          ids.length === 1 ? `1 Document` : `${ids.length} Documents`
        }`,
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
        const {assignees} =
          data.find((d) => d._id === documentId)?._metadata ?? {}
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
        title: `Corrected ${
          ids.length === 1 ? `1 Document` : `${ids.length} Documents`
        }`,
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

      // Get first order value
      const firstOrder = data[0]?._metadata?.orderRank
      let newLexo =
        firstOrder && data.length !== ids.length
          ? LexoRank.parse(firstOrder)
          : LexoRank.min()

      const tx = client.transaction()

      for (let index = 0; index < ids.length; index += 1) {
        newLexo = newLexo.genNext().genNext()

        tx.patch(`workflow-metadata.${ids[index]}`, {
          set: {orderRank: newLexo.toString()},
        })
      }

      await tx.commit()

      toast.push({
        title: `Added order to ${
          ids.length === 1 ? `1 Document` : `${ids.length} Documents`
        }`,
        status: 'success',
      })
    },
    [data, client, toast]
  )

  // A document could be deleted and the workflow metadata left behind
  const orphanedMetadataDocumentIds = React.useMemo(() => {
    return data.length
      ? data.filter((doc) => !doc?._id).map((doc) => doc._metadata.documentId)
      : []
  }, [data])

  const handleOrphans = React.useCallback(() => {
    toast.push({
      title: 'Removing orphaned metadata...',
      status: 'info',
    })

    const tx = client.transaction()
    orphanedMetadataDocumentIds.forEach((id) => {
      tx.delete(`workflow-metadata.${id}`)
    })

    tx.commit()

    toast.push({
      title: `Removed ${orphanedMetadataDocumentIds.length} orphaned metadata documents`,
      status: 'success',
    })
  }, [client, orphanedMetadataDocumentIds, toast])

  return (
    <FloatingCard>
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
      {documentsWithDuplicatedOrderIds.length > 0 ? (
        <Button
          tone="caution"
          onClick={() => addOrderToDocuments(documentsWithDuplicatedOrderIds)}
          text={
            documentsWithDuplicatedOrderIds.length === 1
              ? `Set Unique Order for 1 Document`
              : `Set Unique Order for ${documentsWithDuplicatedOrderIds.length} Documents`
          }
        />
      ) : null}
      {orphanedMetadataDocumentIds.length > 0 ? (
        <Button
          text="Cleanup orphaned metadata"
          onClick={handleOrphans}
          tone="caution"
        />
      ) : null}
      {/* <Button
        tone="caution"
        onClick={() =>
          addOrderToDocuments(
            data.map((doc) => String(doc._metadata?.documentId))
          )
        }
        text={
          data.length === 1
            ? `Reset Order for 1 Document`
            : `Reset Order for all ${data.length} Documents`
        }
      /> */}
    </FloatingCard>
  )
}
