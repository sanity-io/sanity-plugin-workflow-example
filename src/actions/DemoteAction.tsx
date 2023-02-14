import {ArrowLeftIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useDocumentOperation} from 'sanity'
import {DocumentActionProps, useClient} from 'sanity'

import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {API_VERSION} from '../constants'
import {State} from '../types'

export function DemoteAction(props: DocumentActionProps, states: State[]) {
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
          title: `Document demoted to ${newState.title}`,
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
          title: `Document demotion failed`,
        })
      })
  }

  const currentStateIndex = states.findIndex((s) => s.id === currentState?.id)
  const prevState = states[currentStateIndex - 1]

  return {
    icon: ArrowLeftIcon,
    disabled: loading || error || !currentState || !prevState,
    title: prevState?.title ? `Demote State to "${prevState.title}"` : `Demote`,
    label: prevState?.title ? prevState.title : `Demote`,
    onHandle: () => onHandle(id, prevState),
  }
}
