// import {useState} from 'react'
import {ArrowRightIcon, ArrowLeftIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCurrentUser} from 'sanity'
import {DocumentActionProps, useClient} from 'sanity'

import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {API_VERSION} from '../constants'
import {State} from '../types'
import {arraysContainMatchingString} from '../helpers/arraysContainMatchingString'

export function UpdateWorkflow(props: DocumentActionProps, allStates: State[], actionState: State) {
  const {id} = props

  const user = useCurrentUser()
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const currentUser = useCurrentUser()

  const {data, loading, error} = useWorkflowMetadata(id, allStates)
  const {state: currentState} = data
  const {assignees = []} = data?.metadata ?? {}

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

  // Remove button if:
  // Document is not in Workflow OR
  // The current State is the same as this actions State
  if (!data.metadata || (currentState && currentState.id === actionState.id)) {
    return null
  }

  const currentStateIndex = allStates.findIndex((s) => s.id === currentState?.id)
  const actionStateIndex = allStates.findIndex((s) => s.id === actionState.id)
  const direction = actionStateIndex > currentStateIndex ? 'promote' : 'demote'
  const DirectionIcon = direction === 'promote' ? ArrowRightIcon : ArrowLeftIcon
  const directionLabel = direction === 'promote' ? 'Promote' : 'Demote'

  let title = `${directionLabel} State to "${actionState.title}"`

  const userRoleCanUpdateState =
    user?.roles?.length && actionState?.roles?.length
      ? // If the Action state is limited to specific roles
        // check that the current user has one of those roles
        arraysContainMatchingString(
          user.roles.map((r) => r.name),
          actionState.roles
        )
      : // No roles specified on the next state, so anyone can update
        actionState?.roles?.length !== 0

  if (!userRoleCanUpdateState) {
    title = `Your User role cannot ${directionLabel} State to "${actionState.title}"`
  }

  const actionStateIsAValidTransition =
    currentState?.id && currentState.transitions.length
      ? // If the Current State limits transitions to specific States
        // Check that the Action State is in Current State's transitions array
        currentState.transitions.includes(actionState.id)
      : // Otherwise this isn't a problem
        true

  if (!actionStateIsAValidTransition) {
    title = `You cannot ${directionLabel} State to "${actionState.title}" from "${currentState?.title}"`
  }

  const userAssignmentCanUpdateState = actionState.requireAssignment
    ? // If the Action State requires assigned users
      // Check the current user ID is in the assignees array
      currentUser && assignees.length && assignees.includes(currentUser.id)
    : // Otherwise this isn't a problem
      true

  if (!userAssignmentCanUpdateState) {
    title = `You must be assigned to the document to ${directionLabel} State to "${actionState.title}"`
  }

  return {
    icon: DirectionIcon,
    disabled:
      loading ||
      error ||
      !currentState ||
      !userRoleCanUpdateState ||
      !actionStateIsAValidTransition ||
      !userAssignmentCanUpdateState,
    title,
    label: actionState.title,
    onHandle: () => onHandle(id, actionState),
  }
}
