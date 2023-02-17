import {UsersIcon} from '@sanity/icons'
import {DocumentActionProps} from 'sanity'
import {useState} from 'react'
import {useProjectUsers} from 'sanity-plugin-utils'

import {API_VERSION} from '../constants'
import UserAssignment from '../components/UserAssignment'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {State} from '../types'

export function AssignWorkflow(props: DocumentActionProps, states: State[]) {
  const {id} = props
  const [isDialogOpen, setDialogOpen] = useState(false)
  const userList = useProjectUsers({apiVersion: API_VERSION})
  const {data, loading, error} = useWorkflowMetadata(id, states)

  if (error) {
    console.error(error)
  }

  if (!data?.metadata) {
    return null
  }

  return {
    icon: UsersIcon,
    type: 'dialog',
    disabled: !data || loading || error,
    label: `Assign`,
    title: data ? null : `Document is not in Workflow`,
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
        />
      ),
    },
    onHandle: () => {
      setDialogOpen(true)
    },
  }
}
