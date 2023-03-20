import {useCallback, useState} from 'react'
import {SplitVerticalIcon} from '@sanity/icons'
import {DocumentActionProps, useClient} from 'sanity'
import {useToast} from '@sanity/ui'
import {LexoRank} from 'lexorank'

import {API_VERSION} from '../constants'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {State} from '../types'

export function BeginWorkflow(props: DocumentActionProps, states: State[]) {
  const {id, draft} = props
  const {data, loading, error} = useWorkflowMetadata(id, states)
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const [beginning, setBeginning] = useState(false)
  const [complete, setComplete] = useState(false)

  if (error) {
    console.error(error)
  }

  const handle = useCallback(async () => {
    setBeginning(true)
    const lowestOrderFirstState = await client.fetch(
      `*[_type == "workflow.metadata" && state == $state]|order(orderRank)[0].orderRank`,
      {state: states[0].id}
    )
    client
      .createIfNotExists(
        {
          _id: `workflow-metadata.${id}`,
          _type: `workflow.metadata`,
          documentId: id,
          state: states[0].id,
          orderRank: lowestOrderFirstState
            ? LexoRank.parse(lowestOrderFirstState).genNext().toString()
            : LexoRank.min().toString(),
        },
        // Faster!
        {visibility: 'async'}
      )
      .then(() => {
        toast.push({
          status: 'success',
          title: 'Workflow started',
          description: `Document is now "${states[0].title}"`,
        })
        setBeginning(false)
        // Optimistically remove action
        setComplete(true)
      })
  }, [id, states, client, toast])

  if (!draft || complete || data.metadata) {
    return null
  }

  return {
    icon: SplitVerticalIcon,
    type: 'dialog',
    disabled: data?.metadata || loading || error || beginning || complete,
    label: beginning ? `Beginning...` : `Begin Workflow`,
    onHandle: () => {
      handle()
    },
  }
}
