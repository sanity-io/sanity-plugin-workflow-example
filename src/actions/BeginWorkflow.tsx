import {SplitVerticalIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {LexoRank} from 'lexorank'
import {useCallback, useState} from 'react'
import {DocumentActionProps, useClient} from 'sanity'

import {useWorkflowContext} from '../components/WorkflowContext'
import {API_VERSION} from '../constants'

export function BeginWorkflow(props: DocumentActionProps) {
  const {id, draft} = props
  const {metadata, loading, error, states} = useWorkflowContext(id)
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
      .createIfNotExists({
        _id: `workflow-metadata.${id}`,
        _type: `workflow.metadata`,
        documentId: id,
        state: states[0].id,
        orderRank: lowestOrderFirstState
          ? LexoRank.parse(lowestOrderFirstState).genNext().toString()
          : LexoRank.min().toString(),
      })
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

  if (!draft || complete || metadata) {
    return null
  }

  return {
    icon: SplitVerticalIcon,
    type: 'dialog',
    disabled: metadata || loading || error || beginning || complete,
    label: beginning ? `Beginning...` : `Begin Workflow`,
    onHandle: () => {
      handle()
    },
  }
}
