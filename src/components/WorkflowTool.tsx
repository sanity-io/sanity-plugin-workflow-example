import React from 'react'
import {Flex, Card, Grid, Spinner, Label, Container, useTheme} from '@sanity/ui'
import {Feedback, useProjectUsers} from 'sanity-plugin-utils'
import {Tool, useCurrentUser} from 'sanity'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DragStart,
  ResponderProvided,
} from 'react-beautiful-dnd'

import {State, WorkflowConfig} from '../types'
import {DocumentCard} from './DocumentCard'
import {useWorkflowDocuments} from '../hooks/useWorkflowDocuments'
import {API_VERSION, ORDER_MAX, ORDER_MIN} from '../constants'

import Validators from './Validators'
import Filters from './Filters'
import {filterItemsAndSort} from '../helpers/filterItemsAndSort'
import {arraysContainMatchingString} from '../helpers/arraysContainMatchingString'

type WorkflowToolProps = {
  tool: Tool<WorkflowConfig>
}

export default function WorkflowTool(props: WorkflowToolProps) {
  const {schemaTypes = [], states = []} = props?.tool?.options ?? {}

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'default' : 'transparent'

  const userList = useProjectUsers({apiVersion: API_VERSION})

  const user = useCurrentUser()
  const userRoleNames = user?.roles?.length ? user?.roles.map((r) => r.name) : []

  const {workflowData, operations} = useWorkflowDocuments(schemaTypes)

  // Data to display in cards
  const {data, loading, error} = workflowData

  // Operations to perform on cards
  const {move} = operations

  const [undroppableStates, setUndroppableStates] = React.useState<string[]>([])

  // When drag starts, check for any states that require user assignment
  // If so, block them if the currently dragged document is not assigned to the user
  const handleDragStart = React.useCallback(
    (start: DragStart, provided: ResponderProvided) => {
      const {draggableId} = start

      const document = data.find((item) => item._metadata?.documentId === draggableId)

      if (!document) return

      const statesThatRequireAssignmentIds = states
        .filter((state) => state.requireAssignment)
        .map((state) => state.id)

      if (!statesThatRequireAssignmentIds.length) return

      const documentAssignees = document._metadata?.assignees ?? []
      const userIsAssignedToDocument = user?.id ? documentAssignees.includes(user.id) : false

      if (!userIsAssignedToDocument) {
        setUndroppableStates(statesThatRequireAssignmentIds)
      }
    },
    [data, states, user]
  )

  const handleDragEnd = React.useCallback(
    (result: DropResult) => {
      // Reset undroppable states
      setUndroppableStates([])

      const {draggableId, source, destination} = result

      if (
        // No destination?
        !destination ||
        // No change in position?
        (destination.droppableId === source.droppableId && destination.index === source.index)
      ) {
        return
      }

      // Find all items in current state
      const destinationStateItems = [...filterItemsAndSort(data, destination.droppableId, [], [])]

      // TODO: This ordering logic is naive, and could be improved
      let newOrder = ORDER_MIN

      if (!destinationStateItems.length) {
        // Only item in state
        newOrder = ORDER_MIN
      } else if (destination.index === 0) {
        // Now first item in order
        const firstItem = [...destinationStateItems].shift()
        newOrder = firstItem?._metadata?.order
          ? firstItem?._metadata?.order - ORDER_MIN / 2
          : ORDER_MIN
      } else if (destination.index === destinationStateItems.length) {
        // Now last item in order
        const lastItem = [...destinationStateItems].pop()
        newOrder = lastItem?._metadata?.order
          ? lastItem?._metadata?.order + ORDER_MAX / 2
          : ORDER_MAX
      } else {
        // Must be between two items
        const itemBefore = destinationStateItems[destination.index - 1]
        const itemAfter = destinationStateItems[destination.index]

        newOrder =
          ((itemBefore?._metadata?.order ?? ORDER_MIN) +
            (itemAfter?._metadata?.order ?? ORDER_MAX)) /
          2
      }

      move(draggableId, destination, states, newOrder)
    },
    [data, move, states]
  )

  const uniqueAssignedUsers = React.useMemo(() => {
    const uniqueUserIds = data.reduce((acc, item) => {
      const {assignees} = item._metadata ?? {}
      return assignees?.length ? Array.from(new Set([...acc, ...assignees])) : acc
    }, [] as string[])

    return userList.filter((u) => uniqueUserIds.includes(u.id))
  }, [data, userList])

  const [selectedUsers, setSelectedUsers] = React.useState<any[]>(uniqueAssignedUsers)
  const toggleSelectedUser = React.useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((u) => u !== userId) : [...prev, userId]
    )
  }, [])
  const resetSelectedUsers = React.useCallback(() => {
    setSelectedUsers([])
  }, [])

  const [selectedSchemaTypes, setSelectedSchemaTypes] = React.useState<string[]>(schemaTypes)
  const toggleSelectedSchemaType = React.useCallback((schemaType: string) => {
    setSelectedSchemaTypes((prev) =>
      prev.includes(schemaType) ? prev.filter((u) => u !== schemaType) : [...prev, schemaType]
    )
  }, [])

  const [invalidDocumentIds, setInvalidDocumentIds] = React.useState<string[]>([])
  const toggleInvalidDocumentId = React.useCallback((docId: string, action: 'ADD' | 'REMOVE') => {
    setInvalidDocumentIds((prev) =>
      action === 'ADD' ? [...prev, docId] : prev.filter((id) => id !== docId)
    )
  }, [])

  if (!states?.length) {
    return (
      <Container width={1} padding={5}>
        <Feedback
          tone="caution"
          title="Plugin options error"
          description="No States defined in plugin config"
        />
      </Container>
    )
  }

  if (error) {
    return (
      <Container width={1} padding={5}>
        <Feedback tone="critical" title="Error with query" />
      </Container>
    )
  }

  return (
    <>
      <Validators data={data} userList={userList} states={states} />
      <Filters
        uniqueAssignedUsers={uniqueAssignedUsers}
        selectedUsers={selectedUsers}
        toggleSelectedUser={toggleSelectedUser}
        resetSelectedUsers={resetSelectedUsers}
        schemaTypes={schemaTypes}
        selectedSchemaTypes={selectedSchemaTypes}
        toggleSelectedSchemaType={toggleSelectedSchemaType}
      />
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Grid columns={states.length} height="fill">
          {states.map((state: State, stateIndex: number) => {
            const userRoleCanDrop = state?.roles?.length
              ? arraysContainMatchingString(state.roles, userRoleNames)
              : true
            // const stateTone = userRoleCanDrop ? defaultCardTone : `caution`

            return (
              <Card key={state.id} borderLeft={stateIndex > 0} tone={defaultCardTone}>
                <Card
                  // __unstable_checkered={!userRoleCanDrop}
                  padding={3}
                  style={{pointerEvents: `none`}}
                >
                  <Label muted={!userRoleCanDrop}>{state.title}</Label>
                </Card>
                <Droppable
                  droppableId={state.id}
                  isDropDisabled={!userRoleCanDrop || undroppableStates.includes(state.id)}
                >
                  {(provided, snapshot) => (
                    <Card
                      // __unstable_checkered={!userRoleCanDrop}
                      ref={provided.innerRef}
                      tone={snapshot.isDraggingOver ? `primary` : defaultCardTone}
                      height="fill"
                    >
                      {loading ? (
                        <Flex padding={5} align="center" justify="center">
                          <Spinner muted />
                        </Flex>
                      ) : null}

                      {data.length > 0 &&
                        filterItemsAndSort(data, state.id, selectedUsers, selectedSchemaTypes).map(
                          (item, itemIndex) => {
                            const isInvalid = invalidDocumentIds.includes(
                              String(item?._metadata?.documentId)
                            )
                            const meInAssignees = user?.id
                              ? item?._metadata?.assignees?.includes(user.id)
                              : false
                            const isDragDisabled =
                              !userRoleCanDrop ||
                              isInvalid ||
                              !(state.requireAssignment
                                ? state.requireAssignment && meInAssignees
                                : true)

                            return (
                              <Draggable
                                // The metadata's documentId is always the published one to avoid rerendering
                                key={String(item?._metadata?.documentId)}
                                draggableId={String(item?._metadata?.documentId)}
                                index={itemIndex}
                                isDragDisabled={isDragDisabled}
                              >
                                {(draggableProvided, draggableSnapshot) => (
                                  <div
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                    {...draggableProvided.dragHandleProps}
                                  >
                                    <DocumentCard
                                      userRoleCanDrop={userRoleCanDrop}
                                      isDragDisabled={isDragDisabled}
                                      isDragging={draggableSnapshot.isDragging}
                                      item={item}
                                      states={states}
                                      toggleInvalidDocumentId={toggleInvalidDocumentId}
                                      userList={userList}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            )
                          }
                        )}
                      {provided.placeholder}
                    </Card>
                  )}
                </Droppable>
              </Card>
            )
          })}
        </Grid>
      </DragDropContext>
    </>
  )
}
