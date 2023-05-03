import {ArrowLeftIcon, ArrowRightIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCurrentUser, useValidationStatus} from 'sanity'
import {DocumentActionProps, useClient} from 'sanity'

import {useWorkflowContext} from '../components/WorkflowContext'
import {API_VERSION} from '../constants'
import {arraysContainMatchingString} from '../helpers/arraysContainMatchingString'
import {State} from '../types'

// eslint-disable-next-line complexity
export function UpdateWorkflow(props: DocumentActionProps, actionState: State) {
  const {id, type} = props

  const user = useCurrentUser()
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const currentUser = useCurrentUser()

  const {metadata, loading, error, states} = useWorkflowContext(id)
  const currentState = states.find((s) => s.id === metadata?.state)
  const {assignees = []} = metadata ?? {}

  // TODO: Shouldn't the document action props contain this?
  const {validation, isValidating} = useValidationStatus(id, type)
  const hasValidationErrors =
    currentState?.requireValidation &&
    !isValidating &&
    validation?.length > 0 &&
    validation.find((v) => v.level === 'error')

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
  if (!metadata || (currentState && currentState.id === actionState.id)) {
    return null
  }

  const currentStateIndex = states.findIndex((s) => s.id === currentState?.id)
  const actionStateIndex = states.findIndex((s) => s.id === actionState.id)
  const direction = actionStateIndex > currentStateIndex ? 'promote' : 'demote'
  const DirectionIcon = direction === 'promote' ? ArrowRightIcon : ArrowLeftIcon
  const directionLabel = direction === 'promote' ? 'Promote' : 'Demote'

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

  const actionStateIsAValidTransition =
    currentState?.id && currentState?.transitions?.length
      ? // If the Current State limits transitions to specific States
        // Check that the Action State is in Current State's transitions array
        currentState.transitions.includes(actionState.id)
      : // Otherwise this isn't a problem
        true

  const userAssignmentCanUpdateState = actionState.requireAssignment
    ? // If the Action State requires assigned users
      // Check the current user ID is in the assignees array
      currentUser && assignees?.length && assignees.includes(currentUser.id)
    : // Otherwise this isn't a problem
      true

  let title = `${directionLabel} State to "${actionState.title}"`

  if (!userRoleCanUpdateState) {
    title = `Your User role cannot ${directionLabel} State to "${actionState.title}"`
  } else if (!actionStateIsAValidTransition) {
    title = `You cannot ${directionLabel} State to "${actionState.title}" from "${currentState?.title}"`
  } else if (!userAssignmentCanUpdateState) {
    title = `You must be assigned to the document to ${directionLabel} State to "${actionState.title}"`
  } else if (currentState?.requireValidation && isValidating) {
    title = `Document is validating, cannot ${directionLabel} State to "${actionState.title}"`
  } else if (hasValidationErrors) {
    title = `Document has validation errors, cannot ${directionLabel} State to "${actionState.title}"`
  }

  return {
    icon: DirectionIcon,
    disabled:
      loading ||
      error ||
      (currentState?.requireValidation && isValidating) ||
      hasValidationErrors ||
      !currentState ||
      !userRoleCanUpdateState ||
      !actionStateIsAValidTransition ||
      !userAssignmentCanUpdateState,
    title,
    label: actionState.title,
    onHandle: () => onHandle(id, actionState),
  }
}
