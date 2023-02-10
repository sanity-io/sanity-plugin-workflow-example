import React from 'react'
import {Button, Popover, useToast, useClickOutside} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'
import {UserSelectMenu} from 'sanity-plugin-utils'
import {useClient} from 'sanity'

import AvatarGroup from './DocumentCard/AvatarGroup'
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

  const [button] = React.useState(null)
  const [popover, setPopover] = React.useState(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const close = React.useCallback(() => setIsOpen(false), [])
  const open = React.useCallback(() => setIsOpen(true), [])

  useClickOutside(close, [button, popover])

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
    <Popover
      // @ts-ignore
      ref={setPopover}
      // onKeyDown={handleKeyDown}
      content={
        <UserSelectMenu
          style={{maxHeight: 300}}
          value={assignees || []}
          userList={userList}
          onAdd={addAssignee}
          onClear={clearAssignees}
          onRemove={removeAssignee}
          open={isOpen}
        />
      }
      portal
      open={isOpen}
    >
      {!assignees || assignees.length === 0 ? (
        <Button
          onClick={open}
          fontSize={1}
          padding={2}
          tabIndex={-1}
          icon={AddIcon}
          text="Assign"
          tone="positive"
        />
      ) : (
        <Button onClick={open} padding={0} mode="bleed" style={{width: `100%`}}>
          <AvatarGroup users={userList.filter((u) => assignees.includes(u.id))} />
        </Button>
      )}
    </Popover>
  )
}
