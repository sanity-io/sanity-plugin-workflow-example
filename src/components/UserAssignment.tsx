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
}

export default function UserAssignment(props: UserAssignmentProps) {
  const {assignees, userList, documentId} = props
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const addAssignee = React.useCallback(
    (userId: string) => {
      const user = userList.find((u) => u.id === userId)

      if (!userId || !user) {
        return toast.push({
          status: 'error',
          title: 'Could not find User',
        })
      }

      return client
        .patch(`workflow-metadata.${documentId}`)
        .setIfMissing({assignees: []})
        .insert(`after`, `assignees[-1]`, [userId])
        .commit()
        .then(() => {
          return toast.push({
            title: `Added ${user.displayName} to assignees`,
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
    [documentId, client, toast, userList]
  )

  const removeAssignee = React.useCallback(
    (userId: string) => {
      const user = userList.find((u) => u.id === userId)

      if (!userId || !user) {
        return toast.push({
          status: 'error',
          title: 'Could not find User',
        })
      }

      return client
        .patch(`workflow-metadata.${documentId}`)
        .unset([`assignees[@ == "${userId}"]`])
        .commit()
        .then(() => {
          return toast.push({
            title: `Removed ${user.displayName} from assignees`,
            status: 'success',
          })
        })
        .catch((err) => {
          console.error(err)

          return toast.push({
            title: `Failed to remove assignee`,
            description: documentId,
            status: 'error',
          })
        })
    },
    [client, toast, documentId, userList]
  )

  const clearAssignees = React.useCallback(() => {
    return client
      .patch(`workflow-metadata.${documentId}`)
      .unset([`assignees`])
      .commit()
      .then(() => {
        return toast.push({
          title: `Cleared assignees`,
          status: 'success',
        })
      })
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
    />
  )
}
