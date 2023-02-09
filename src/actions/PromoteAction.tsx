import {ArrowRightIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'

import {DocumentActionProps, useClient} from 'sanity'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {API_VERSION} from '../constants'
import {State} from '../types'

export function PromoteAction(props: DocumentActionProps, states: State[]) {
  const {id} = props
  const {data, loading, error} = useWorkflowMetadata(id, states)
  const {state} = data
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

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
          title: `Document promoted to ${newState.title}`,
        })
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

  const currentStateIndex = states.findIndex((s) => s.id === state?.id)
  const nextState = states[currentStateIndex + 1]

  return {
    icon: ArrowRightIcon,
    disabled: loading || error || !state || !nextState,
    label: `Promote`,
    title: nextState ? `Promote State to "${nextState.title}"` : `Promote`,
    onHandle: () => onHandle(id, nextState),
  }
}
