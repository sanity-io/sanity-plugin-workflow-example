import React from 'react'
import {Flex, Card, Grid, Spinner, Container, useTheme} from '@sanity/ui'
import {Feedback, useProjectUsers} from 'sanity-plugin-utils'
import {Tool, useCurrentUser} from 'sanity'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DragStart,
} from 'react-beautiful-dnd'

import {State, WorkflowConfig} from '../types'
import {DocumentCard} from './DocumentCard'
import {useWorkflowDocuments} from '../hooks/useWorkflowDocuments'
import {API_VERSION} from '../constants'

import Validators from './Validators'
import Filters from './Filters'
import {filterItemsAndSort} from '../helpers/filterItemsAndSort'
import {arraysContainMatchingString} from '../helpers/arraysContainMatchingString'
import StateTitle from './StateTitle'
import {LexoRank} from 'lexorank'

type WorkflowToolProps = {
  tool: Tool<WorkflowConfig>
}

export default function WorkflowTool(props: WorkflowToolProps) {
  const {schemaTypes = [], states = []} = props?.tool?.options ?? {}

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'default' : 'transparent'

  const userList = useProjectUsers({apiVersion: API_VERSION})

  const user = useCurrentUser()
  const userRoleNames = user?.roles?.length
    ? user?.roles.map((r) => r.name)
    : []

  const {workflowData, operations} = useWorkflowDocuments(schemaTypes)

  // Data to display in cards
  const {data, loading, error} = workflowData

  // Operations to perform on cards
  const {move} = operations

  const [undroppableStates, setUndroppableStates] = React.useState<string[]>([])
  const [draggingFrom, setDraggingFrom] = React.useState(``)

  // When drag starts, check for any States we should not allow dropping on
  // Because of either:
  // 1. The "destination" State requires user assignment and the user is not assigned to the dragged document
  // 2. The "source" State State has a list of transitions and the "destination" State is not in that list
  const handleDragStart = React.useCallback(
    (start: DragStart) => {
      const {draggableId, source} = start
      const {droppableId: currentStateId} = source
      setDraggingFrom(currentStateId)

      const document = data.find(
        (item) => item._metadata?.documentId === draggableId
      )
      const state = states.find((s) => s.id === currentStateId)

      // This shouldn't happen but TypeScript
      if (!document || !state) return

      const undroppableStateIds = []
      const statesThatRequireAssignmentIds = states
        .filter((s) => s.requireAssignment)
        .map((s) => s.id)

      if (statesThatRequireAssignmentIds.length) {
        const documentAssignees = document._metadata?.assignees ?? []
        const userIsAssignedToDocument = user?.id
          ? documentAssignees.includes(user.id)
          : false

        if (!userIsAssignedToDocument) {
          undroppableStateIds.push(...statesThatRequireAssignmentIds)
        }
      }

      const statesThatCannotBeTransitionedToIds =
        state.transitions && state.transitions.length
          ? states
              .filter((s) => !state.transitions?.includes(s.id))
              .map((s) => s.id)
          : []

      if (statesThatCannotBeTransitionedToIds.length) {
        undroppableStateIds.push(...statesThatCannotBeTransitionedToIds)
      }

      // Remove currentStateId from undroppableStates
      const undroppableExceptSelf = undroppableStateIds.filter(
        (id) => id !== currentStateId
      )

      if (undroppableExceptSelf.length) {
        setUndroppableStates(undroppableExceptSelf)
      }
    },
    [data, states, user]
  )

  const handleDragEnd = React.useCallback(
    (result: DropResult) => {
      // Reset undroppable states
      setUndroppableStates([])
      setDraggingFrom(``)

      const {draggableId, source, destination} = result

      if (
        // No destination?
        !destination ||
        // No change in position?
        (destination.droppableId === source.droppableId &&
          destination.index === source.index)
      ) {
        return
      }

      // Find all items in current state
      const destinationStateItems = [
        ...filterItemsAndSort(data, destination.droppableId, [], null),
      ]

      let newOrder

      if (!destinationStateItems.length) {
        // Only item in state
        // New minimum rank
        newOrder = LexoRank.min().toString()
      } else if (destination.index === 0) {
        // Now first item in order
        const firstItemOrderRank = [...destinationStateItems].shift()?._metadata
          ?.orderRank
        newOrder =
          firstItemOrderRank && typeof firstItemOrderRank === 'string'
            ? LexoRank.parse(firstItemOrderRank).genPrev().toString()
            : LexoRank.min().toString()
      } else if (destination.index + 1 === destinationStateItems.length) {
        // Now last item in order
        const lastItemOrderRank = [...destinationStateItems].pop()?._metadata
          ?.orderRank
        newOrder =
          lastItemOrderRank && typeof lastItemOrderRank === 'string'
            ? LexoRank.parse(lastItemOrderRank).genNext().toString()
            : LexoRank.min().toString()
      } else {
        // Must be between two items
        const itemBefore = destinationStateItems[destination.index]
        const itemBeforeRank = itemBefore?._metadata?.orderRank
        const itemBeforeRankParsed = itemBefore._metadata.orderRank
          ? LexoRank.parse(itemBeforeRank)
          : LexoRank.min()
        const itemAfter = destinationStateItems[destination.index + 1]
        const itemAfterRank = itemAfter?._metadata?.orderRank
        const itemAfterRankParsed = itemAfter._metadata.orderRank
          ? LexoRank.parse(itemAfterRank)
          : LexoRank.max()

        newOrder = itemBeforeRankParsed.between(itemAfterRankParsed).toString()
      }

      move(draggableId, destination, states, newOrder)
    },
    [data, move, states]
  )

  const uniqueAssignedUsers = React.useMemo(() => {
    const uniqueUserIds = data.reduce((acc, item) => {
      const {assignees = []} = item._metadata ?? {}
      const newAssignees = assignees?.length
        ? assignees.filter((a) => !acc.includes(a))
        : []
      return newAssignees.length ? [...acc, ...newAssignees] : acc
    }, [] as string[])

    return userList.filter((u) => uniqueUserIds.includes(u.id))
  }, [data, userList])

  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>(
    uniqueAssignedUsers.map((u) => u.id)
  )
  const toggleSelectedUser = React.useCallback((userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((u) => u !== userId)
        : [...prev, userId]
    )
  }, [])
  const resetSelectedUsers = React.useCallback(() => {
    setSelectedUserIds([])
  }, [])

  const [selectedSchemaTypes, setSelectedSchemaTypes] =
    React.useState<string[]>(schemaTypes)
  const toggleSelectedSchemaType = React.useCallback((schemaType: string) => {
    setSelectedSchemaTypes((prev) =>
      prev.includes(schemaType)
        ? prev.filter((u) => u !== schemaType)
        : [...prev, schemaType]
    )
  }, [])

  const [invalidDocumentIds, setInvalidDocumentIds] = React.useState<string[]>(
    []
  )
  const toggleInvalidDocumentId = React.useCallback(
    (docId: string, action: 'ADD' | 'REMOVE') => {
      setInvalidDocumentIds((prev) =>
        action === 'ADD' ? [...prev, docId] : prev.filter((id) => id !== docId)
      )
    },
    []
  )

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

  if (error && !data.length) {
    return (
      <Container width={1} padding={5}>
        <Feedback
          tone="critical"
          title="Error querying for Workflow documents"
        />
      </Container>
    )
  }

  return (
    <Card height="fill" overflow="hidden">
      <Validators data={data} userList={userList} states={states} />
      <Filters
        uniqueAssignedUsers={uniqueAssignedUsers}
        selectedUserIds={selectedUserIds}
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
            const isDropDisabled =
              !userRoleCanDrop || undroppableStates.includes(state.id)

            return (
              <Card
                key={state.id}
                borderLeft={stateIndex > 0}
                tone={defaultCardTone}
                height="fill"
                overflow="auto"
              >
                <StateTitle
                  state={state}
                  requireAssignment={state.requireAssignment ?? false}
                  userRoleCanDrop={userRoleCanDrop}
                  // operation={state.operation}
                  isDropDisabled={isDropDisabled}
                  draggingFrom={draggingFrom}
                />
                <Droppable
                  droppableId={state.id}
                  isDropDisabled={isDropDisabled}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      tone={
                        snapshot.isDraggingOver ? `primary` : defaultCardTone
                      }
                      height="fill"
                      paddingTop={1}
                    >
                      {loading ? (
                        <Flex padding={5} align="center" justify="center">
                          <Spinner muted />
                        </Flex>
                      ) : null}

                      {data.length > 0 &&
                        filterItemsAndSort(
                          data,
                          state.id,
                          selectedUserIds,
                          selectedSchemaTypes
                        ).map((item, itemIndex) => {
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
                          const {documentId} = item._metadata ?? {}

                          if (!documentId) {
                            return null
                          }

                          return (
                            <Draggable
                              // The metadata's documentId is always the published one to avoid rerendering
                              key={documentId}
                              draggableId={documentId}
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
                                    toggleInvalidDocumentId={
                                      toggleInvalidDocumentId
                                    }
                                    userList={userList}
                                    states={states}
                                  />
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                      {provided.placeholder}
                    </Card>
                  )}
                </Droppable>
              </Card>
            )
          })}
        </Grid>
      </DragDropContext>
    </Card>
  )
}