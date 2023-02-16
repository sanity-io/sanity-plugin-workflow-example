import {useCallback} from 'react'
import {ArrowRightIcon} from '@sanity/icons'
import {DocumentActionProps, useClient} from 'sanity'

import {API_VERSION} from '../constants'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {State} from '../types'

export function BeginWorkflow(props: DocumentActionProps, states: State[]) {
  const {id} = props
  const {data, loading, error} = useWorkflowMetadata(id, states)
  const client = useClient({apiVersion: API_VERSION})

  if (error) {
    console.error(error)
  }

  const handle = useCallback(() => {
    client.createIfNotExists({
      _id: `workflow-metadata.${id}`,
      _type: `workflow.metadata`,
      documentId: id,
      state: states[0].id,
    })
  }, [id, states, client])

  if (data.metadata) {
    return null
  }

  return {
    icon: ArrowRightIcon,
    type: 'dialog',
    disabled: data?.metadata || loading || error,
    label: `Begin Workflow`,
    onHandle: () => {
      handle()
    },
  }
}
