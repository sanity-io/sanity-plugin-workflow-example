import {ArrowLeftIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {DocumentActionProps, useClient} from 'sanity'

import {API_VERSION} from '../constants'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {State} from '../types'

export function DemoteAction(props: DocumentActionProps, states: State[]) {
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
          title: `Document demoted to ${newState.title}`,
        })
      })
      .catch((err) => {
        props.onComplete()
        console.error(err)
        toast.push({
          status: 'error',
          title: `Document demotion failed`,
        })
      })
  }

  const currentStateIndex = states.findIndex((s) => s.id === state?.id)
  const prevState = states[currentStateIndex - 1]

  return {
    icon: ArrowLeftIcon,
    disabled: loading || error || !state || !prevState,
    label: `Demote`,
    title: prevState ? `Demote State to "${prevState.title}"` : `Demote`,
    onHandle: () => onHandle(id, prevState),
  }
}
