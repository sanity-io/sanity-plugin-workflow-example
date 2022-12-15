import React from 'react'
import {Button, Popover, useToast} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'
import {UserSelectMenu} from 'sanity-plugin-utils'
import {useClient} from 'sanity'

import AvatarGroup from './DocumentCard/AvatarGroup'
import {User} from '../types'

type UserAssignmentProps = {
  userList: User[]
  assignees: string[]
  documentId: string
}

export default function UserAssignment(props: UserAssignmentProps) {
  const {assignees, userList, documentId} = props
  const client = useClient()
  const toast = useToast()
  const [openId, setOpenId] = React.useState<string>(``)

  const addAssignee = React.useCallback(
    (userId: string) => {
      if (!userId) {
        return toast.push({
          status: 'error',
          title: 'No user selected',
        })
      }

      client
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
    (id: string, userId: string) => {
      client
        .patch(`workflow-metadata.${id}`)
        .unset([`assignees[@ == "${userId}"]`])
        .commit()
        .then((res) => res)
        .catch((err) => {
          console.error(err)

          return toast.push({
            title: `Failed to remove assignee`,
            description: id,
            status: 'error',
          })
        })
    },
    [client, toast]
  )

  const clearAssignees = React.useCallback(
    (id: string) => {
      client
        .patch(`workflow-metadata.${id}`)
        .unset([`assignees`])
        .commit()
        .then((res) => res)
        .catch((err) => {
          console.error(err)

          return toast.push({
            title: `Failed to clear assignees`,
            description: id,
            status: 'error',
          })
        })
    },
    [client, toast]
  )

  return (
    <Popover
      // @ts-ignore
      // ref={setPopoverRef}
      // onKeyDown={handleKeyDown}
      content={
        <UserSelectMenu
          style={{maxHeight: 300}}
          value={assignees || []}
          userList={userList}
          onAdd={addAssignee}
          onClear={clearAssignees}
          onRemove={removeAssignee}
          open={openId === documentId}
        />
      }
      portal
      open={openId === documentId}
    >
      {!assignees || assignees.length === 0 ? (
        <Button
          onClick={() => setOpenId(documentId)}
          fontSize={1}
          padding={2}
          tabIndex={-1}
          icon={AddIcon}
          text="Assign"
          tone="positive"
        />
      ) : (
        <Button
          onClick={() => setOpenId(documentId)}
          padding={0}
          mode="bleed"
          style={{width: `100%`}}
        >
          <AvatarGroup users={userList.filter((u) => assignees.includes(u.id))} />
        </Button>
      )}
    </Popover>
  )
}
