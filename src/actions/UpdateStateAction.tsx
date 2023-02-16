// import {useState} from 'react'
import {ArrowRightIcon, ArrowLeftIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCurrentUser} from 'sanity'
import {DocumentActionProps, useClient} from 'sanity'

import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {API_VERSION} from '../constants'
import {State} from '../types'
import {arraysContainMatchingString} from '../helpers/arraysContainMatchingString'

type Direction = 'promote' | 'demote'

export function UpdateStateAction(
  props: DocumentActionProps,
  states: State[],
  direction: Direction
) {
  const {id} = props

  const DirectionIcon = direction === 'promote' ? ArrowRightIcon : ArrowLeftIcon
  const directionLabel = direction === 'promote' ? 'Promote' : 'Demote'
  const user = useCurrentUser()

  const {data, loading, error} = useWorkflowMetadata(id, states)
  const {state: currentState} = data
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  // const ops = useDocumentOperation(id, type)
  // const [isDialogOpen, setDialogOpen] = useState(false)

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
          title: `Document state now "${newState.title}"`,
        })
        // Perform document operations after State changes
        // If State has changed and the document needs to be un/published
        // This functionality was deemed too dangerous / unexpected
        // Revisit with improved UX
        // if (!ops.publish.disabled && nextOperation === 'publish') {
        //   ops.publish.execute()
        // } else if (!ops.unpublish.disabled && nextOperation === 'unpublish') {
        //   ops.unpublish.execute()
        // }
      })
      .catch((err) => {
        props.onComplete()
        console.error(err)
        toast.push({
          status: 'error',
          title: `Document state update failed`,
        })
      })
  }

  const currentStateIndex = states.findIndex((s) => s.id === currentState?.id)
  const nextState = states[direction === 'promote' ? currentStateIndex + 1 : currentStateIndex - 1]

  // let nextOperation: Operation | null = null
  let title = nextState?.title ? `${directionLabel} State to "${nextState.title}"` : directionLabel
  // let label = nextState?.title ? nextState.title : directionLabel
  // let message

  // if (draft && nextState?.operation === 'publish') {
  //   nextOperation = 'publish'
  //   message = `${title} and Publish`
  //   title = ``
  //   label += `...`
  // } else if (!draft && nextState?.operation === 'unpublish') {
  //   nextOperation = 'unpublish'
  //   message = `${title} and Unpublish`
  //   title = ``
  //   label += `...`
  // }

  const userCanUpdateState =
    user?.roles?.length && nextState?.roles?.length
      ? // If the next state is limited to specific roles
        // check that the current user has one of those roles
        arraysContainMatchingString(
          user.roles.map((r) => r.name),
          nextState.roles
        )
      : // No roles specified on the next state, so anyone can update
        nextState?.roles?.length !== 0

  if (!userCanUpdateState) {
    title = `Your User role cannot ${directionLabel} State`
  }

  return {
    icon: DirectionIcon,
    disabled: loading || error || !currentState || !nextState || !userCanUpdateState,
    title,
    // label,
    onHandle: () => onHandle(id, nextState),
    // onHandle: () => (nextOperation ? setDialogOpen(true) : onHandle(id, nextState)),
    // dialog: nextOperation &&
    //   isDialogOpen && {
    //     type: `confirm`,
    //     tone: nextOperation === `publish` ? `positive` : `caution`,
    //     message,
    //     onCancel: () => {
    //       setDialogOpen(false)
    //     },
    //     onConfirm: () => {
    //       if (nextOperation) {
    //         onHandle(id, nextState, nextOperation)
    //       }
    //     },
    //     cancelButtonIcon: CloseCircleIcon,
    //     confirmButtonIcon: DirectionIcon,
    //     confirmButtonText: directionLabel,
    //   },
  }
}
