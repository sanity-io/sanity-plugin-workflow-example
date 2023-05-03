import {CheckmarkIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {DocumentActionProps, useClient} from 'sanity'

import {useWorkflowContext} from '../components/WorkflowContext'
import {API_VERSION} from '../constants'

export function CompleteWorkflow(props: DocumentActionProps) {
  const {id} = props
  const {metadata, loading, error, states} = useWorkflowContext(id)
  const client = useClient({apiVersion: API_VERSION})

  if (error) {
    console.error(error)
  }

  const handle = useCallback(() => {
    client.delete(`workflow-metadata.${id}`)
  }, [id, client])

  if (!metadata) {
    return null
  }

  const state = states.find((s) => s.id === metadata.state)
  const isLastState = state?.id === states[states.length - 1].id

  return {
    icon: CheckmarkIcon,
    type: 'dialog',
    disabled: loading || error || !isLastState,
    label: `Complete Workflow`,
    title: isLastState
      ? `Removes the document from the Workflow process`
      : `Cannot remove from workflow until in the last state`,
    onHandle: () => {
      handle()
    },
    color: 'positive',
  }
}
