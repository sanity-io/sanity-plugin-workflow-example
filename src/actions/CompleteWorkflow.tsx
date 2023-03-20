import {useCallback} from 'react'
import {CheckmarkIcon} from '@sanity/icons'
import {DocumentActionProps, useClient} from 'sanity'

import {API_VERSION} from '../constants'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {State} from '../types'

export function CompleteWorkflow(props: DocumentActionProps, states: State[]) {
  const {id} = props
  const {data, loading, error} = useWorkflowMetadata(id, states)
  const client = useClient({apiVersion: API_VERSION})

  if (error) {
    console.error(error)
  }

  const handle = useCallback(() => {
    client.delete(`workflow-metadata.${id}`)
  }, [id, client])

  const isLastState = data?.state?.id === states[states.length - 1].id

  if (!data.metadata) {
    return null
  }

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
