import {ArrowRightIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useDocumentOperation} from 'sanity'
import {DocumentActionProps, useClient} from 'sanity'

import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {API_VERSION} from '../constants'
import {State} from '../types'

export function PromoteAction(props: DocumentActionProps, states: State[]) {
  const {id, type, draft} = props
  const {data, loading, error} = useWorkflowMetadata(id, states)
  const {state: currentState} = data
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const ops = useDocumentOperation(id, type)

  if (error) {
    console.error(error)
  }

  const onHandle = (documentId: string, newState: State) => {
    client
      .patch(`workflow-metadata.${documentId}`)
      .set({state: newState.id})
      .commit()
      .then(() => {
        props.onComplete()
        toast.push({
          status: 'success',
          title: `Document promoted to "${newState.title}"`,
        })

        // TODO: Extract this into something reusable
        if (draft && newState?.operation === 'publish') {
          if (!ops.publish.disabled) {
            ops.publish.execute()
          }
        } else if (!draft && newState?.operation === 'unpublish') {
          if (!ops.unpublish.disabled) {
            ops.unpublish.execute()
          }
        }
      })
      .catch((err) => {
        props.onComplete()
        console.error(err)
        toast.push({
          status: 'error',
          title: `Document promotion failed`,
        })
      })
  }

  const currentStateIndex = states.findIndex((s) => s.id === currentState?.id)
  const nextState = states[currentStateIndex + 1]

  return {
    icon: ArrowRightIcon,
    disabled: loading || error || !currentState || !nextState,
    title: nextState?.title ? `Promote State to "${nextState.title}"` : `Promote`,
    label: nextState?.title ? nextState.title : `Promote`,
    onHandle: () => onHandle(id, nextState),
  }
}
