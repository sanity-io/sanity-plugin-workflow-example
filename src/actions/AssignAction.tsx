import {UsersIcon} from '@sanity/icons'
import {DocumentActionProps} from 'sanity'
import {useState} from 'react'
import {useProjectUsers} from 'sanity-plugin-utils'

import {API_VERSION} from '../constants'
import UserAssignment from '../components/UserAssignment'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {State} from '../types'

export function AssignAction(props: DocumentActionProps, states: State[]) {
  const {id} = props
  const [isDialogOpen, setDialogOpen] = useState(false)
  const userList = useProjectUsers({apiVersion: API_VERSION})
  const {data, loading, error} = useWorkflowMetadata(id, states)

  if (error) {
    console.error(error)
  }

  return {
    icon: UsersIcon,
    type: 'dialog',
    disabled: loading || error,
    label: `Assign`,
    dialog: isDialogOpen && {
      type: 'popover',
      onClose: () => {
        setDialogOpen(false)
      },
      content: (
        <UserAssignment
          userList={userList}
          assignees={data.metadata?.assignees ?? []}
          documentId={id}
          isOpen={isDialogOpen}
        />
      ),
    },
    onHandle: () => {
      setDialogOpen(true)
    },
  }
}
