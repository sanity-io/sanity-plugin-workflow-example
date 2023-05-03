import {UsersIcon} from '@sanity/icons'
import {useState} from 'react'
import {DocumentActionProps} from 'sanity'
import {useProjectUsers} from 'sanity-plugin-utils'

import UserAssignment from '../components/UserAssignment'
import {useWorkflowContext} from '../components/WorkflowContext'
import {API_VERSION} from '../constants'

export function AssignWorkflow(props: DocumentActionProps) {
  const {id} = props
  const {metadata, loading, error} = useWorkflowContext(id)
  const [isDialogOpen, setDialogOpen] = useState(false)
  const userList = useProjectUsers({apiVersion: API_VERSION})

  if (error) {
    console.error(error)
  }

  if (!metadata) {
    return null
  }

  return {
    icon: UsersIcon,
    type: 'dialog',
    disabled: !metadata || loading || error,
    label: `Assign`,
    title: metadata ? null : `Document is not in Workflow`,
    dialog: isDialogOpen && {
      type: 'popover',
      onClose: () => {
        setDialogOpen(false)
      },
      content: (
        <UserAssignment
          userList={userList}
          assignees={metadata?.assignees?.length > 0 ? metadata.assignees : []}
          documentId={id}
        />
      ),
    },
    onHandle: () => {
      setDialogOpen(true)
    },
  }
}
