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

  if (!data.metadata) {
    return null
  }

  return {
    icon: CheckmarkIcon,
    type: 'dialog',
    disabled: loading || error,
    label: `Complete Workflow`,
    onHandle: () => {
      handle()
    },
    color: 'positive',
  }
}
