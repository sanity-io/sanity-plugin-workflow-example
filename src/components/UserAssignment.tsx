import React from 'react'
import {useToast} from '@sanity/ui'
import {UserSelectMenu} from 'sanity-plugin-utils'
import {useClient} from 'sanity'

import {User} from '../types'
import {API_VERSION} from '../constants'

type UserAssignmentProps = {
  userList: User[]
  assignees: string[]
  documentId: string
  isOpen: boolean
}

export default function UserAssignment(props: UserAssignmentProps) {
  const {assignees, userList, documentId, isOpen} = props
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const addAssignee = React.useCallback(
    (userId: string) => {
      if (!userId) {
        return toast.push({
          status: 'error',
          title: 'No user selected',
        })
      }

      return client
        .patch(`workflow-metadata.${documentId}`)
        .setIfMissing({assignees: []})
        .insert(`after`, `assignees[-1]`, [userId])
        .commit()
        .then(() => {
          return toast.push({
            title: `Assigned user to document`,
            description: userId,
            status: 'success',
          })
        })
        .catch((err) => {
          console.error(err)

          return toast.push({
            title: `Failed to add assignee`,
            description: userId,
            status: 'error',
          })
        })
    },
    [documentId, client, toast]
  )

  const removeAssignee = React.useCallback(
    (userId: string) => {
      client
        .patch(`workflow-metadata.${documentId}`)
        .unset([`assignees[@ == "${userId}"]`])
        .commit()
        .then((res) => res)
        .catch((err) => {
          console.error(err)

          return toast.push({
            title: `Failed to remove assignee`,
            description: documentId,
            status: 'error',
          })
        })
    },
    [client, toast, documentId]
  )

  const clearAssignees = React.useCallback(() => {
    client
      .patch(`workflow-metadata.${documentId}`)
      .unset([`assignees`])
      .commit()
      .then((res) => res)
      .catch((err) => {
        console.error(err)

        return toast.push({
          title: `Failed to clear assignees`,
          description: documentId,
          status: 'error',
        })
      })
  }, [client, toast, documentId])

  return (
    <UserSelectMenu
      style={{maxHeight: 300}}
      value={assignees || []}
      userList={userList}
      onAdd={addAssignee}
      onClear={clearAssignees}
      onRemove={removeAssignee}
      open={isOpen}
    />
  )
}
