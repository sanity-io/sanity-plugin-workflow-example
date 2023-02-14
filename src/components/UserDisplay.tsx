import React from 'react'
import {Button, Popover, useClickOutside} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'

import AvatarGroup from './DocumentCard/AvatarGroup'
import {User} from '../types'
import UserAssignment from './UserAssignment'

type UserDisplayProps = {
  userList: User[]
  assignees: string[]
  documentId: string
}

export default function UserDisplay(props: UserDisplayProps) {
  const {assignees, userList, documentId} = props

  const [button] = React.useState(null)
  const [popover, setPopover] = React.useState(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const close = React.useCallback(() => setIsOpen(false), [])
  const open = React.useCallback(() => setIsOpen(true), [])

  useClickOutside(close, [button, popover])

  return (
    <Popover
      // @ts-ignore
      ref={setPopover}
      content={
        <UserAssignment
          userList={userList}
          assignees={assignees}
          documentId={documentId}
          isOpen={isOpen}
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
          mode="ghost"
        />
      ) : (
        <Button onClick={open} padding={0} mode="bleed" style={{width: `100%`}}>
          <AvatarGroup users={userList.filter((u) => assignees.includes(u.id))} />
        </Button>
      )}
    </Popover>
  )
}
