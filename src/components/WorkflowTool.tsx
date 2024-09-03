import {
  DragDropContext,
  DraggableChildrenFn,
  DragStart,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd'
import {
  Box,
  Card,
  Container,
  Flex,
  Grid,
  Spinner,
  useTheme,
  useToast,
} from '@sanity/ui'
import {LexoRank} from 'lexorank'
import React from 'react'
import {Tool, useCurrentUser} from 'sanity'
import {Feedback, useProjectUsers} from 'sanity-plugin-utils'

import {API_VERSION} from '../constants'
import {arraysContainMatchingString} from '../helpers/arraysContainMatchingString'
import {filterItemsAndSort} from '../helpers/filterItemsAndSort'
import {useWorkflowDocuments} from '../hooks/useWorkflowDocuments'
import {State, WorkflowConfig} from '../types'
import {DocumentCard} from './DocumentCard'
import DocumentList from './DocumentList'
import Filters from './Filters'
import StateTitle from './StateTitle'
import Verify from './Verify'

type WorkflowToolProps = {
  tool: Tool<WorkflowConfig>
}

export default function WorkflowTool(props: WorkflowToolProps) {
  const {
    schemaTypes = [],
    states = [],
    filters = null,
  } = props?.tool?.options ?? {}

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'default' : 'transparent'
  const toast = useToast()

  const userList = useProjectUsers({apiVersion: API_VERSION})

  const user = useCurrentUser()
  const userRoleNames = user?.roles?.length
    ? user?.roles.map((r) => r.name)
    : []

  const filterOptions = filters?.(user)

  const {workflowData, operations} = useWorkflowDocuments(
    schemaTypes,
    filterOptions
  )
  const [patchingIds, setPatchingIds] = React.useState<string[]>([])

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
    async (result: DropResult) => {
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
      const destinationStateIndex = states.findIndex(
        (s) => s.id === destination.droppableId
      )
      const globalStateMinimumRank = data[0]._metadata.orderRank
      const globalStateMaximumRank = data[data.length - 1]._metadata.orderRank

      let newOrder

      if (!destinationStateItems.length) {
        // Only item in state
        // New minimum rank
        if (destinationStateIndex === 0) {
          // Only the first state should generate an absolute minimum rank
          newOrder = LexoRank.min().toString()
        } else {
          // Otherwise create one rank above the minimum
          newOrder = LexoRank.min().genNext().toString()
        }
      } else if (destination.index === 0) {
        // Now first item in order
        const firstItemOrderRank = [...destinationStateItems].shift()?._metadata
          ?.orderRank

        if (firstItemOrderRank && typeof firstItemOrderRank === 'string') {
          newOrder = LexoRank.parse(firstItemOrderRank).genPrev().toString()
        } else if (destinationStateIndex === 0) {
          // Only the first state should generate an absolute minimum rank
          newOrder = LexoRank.min().toString()
        } else {
          // Otherwise create the next rank between min and the globally minimum rank
          newOrder = LexoRank.parse(globalStateMinimumRank)
            .between(LexoRank.min())
            .toString()
        }
      } else if (destination.index + 1 === destinationStateItems.length) {
        // Now last item in order
        const lastItemOrderRank = [...destinationStateItems].pop()?._metadata
          ?.orderRank

        if (lastItemOrderRank && typeof lastItemOrderRank === 'string') {
          newOrder = LexoRank.parse(lastItemOrderRank).genNext().toString()
        } else if (destinationStateIndex === states.length - 1) {
          // Only the last state should generate an absolute maximum rank
          newOrder = LexoRank.max().toString()
        } else {
          // Otherwise create the next rank between max and the globally maximum rank
          newOrder = LexoRank.parse(globalStateMaximumRank)
            .between(LexoRank.min())
            .toString()
        }
      } else {
        // Must be between two items
        const itemBefore = destinationStateItems[destination.index - 1]
        const itemBeforeRank = itemBefore?._metadata?.orderRank
        let itemBeforeRankParsed
        if (itemBeforeRank) {
          itemBeforeRankParsed = LexoRank.parse(itemBeforeRank)
        } else if (destinationStateIndex === 0) {
          itemBeforeRankParsed = LexoRank.min()
        } else {
          itemBeforeRankParsed = LexoRank.parse(globalStateMinimumRank)
        }

        const itemAfter = destinationStateItems[destination.index]
        const itemAfterRank = itemAfter?._metadata?.orderRank
        let itemAfterRankParsed
        if (itemAfterRank) {
          itemAfterRankParsed = LexoRank.parse(itemAfterRank)
        } else if (destinationStateIndex === states.length - 1) {
          itemAfterRankParsed = LexoRank.max()
        } else {
          itemAfterRankParsed = LexoRank.parse(globalStateMaximumRank)
        }

        newOrder = itemBeforeRankParsed.between(itemAfterRankParsed).toString()
      }

      setPatchingIds([...patchingIds, draggableId])
      toast.push({
        status: 'info',
        title: 'Updating document state...',
      })
      await move(draggableId, destination, states, newOrder)
      setPatchingIds((ids: string[]) => ids.filter((id) => id !== draggableId))
    },
    [data, patchingIds, toast, move, states]
  )

  // Used for the user filter UI
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

  // Selected user IDs filter the visible workflow documents
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

  // Selected schema types filter the visible workflow documents
  const [selectedSchemaTypes, setSelectedSchemaTypes] =
    React.useState<string[]>(schemaTypes)
  const toggleSelectedSchemaType = React.useCallback((schemaType: string) => {
    setSelectedSchemaTypes((prev) =>
      prev.includes(schemaType)
        ? prev.filter((u) => u !== schemaType)
        : [...prev, schemaType]
    )
  }, [])

  // Document IDs that have validation errors
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

  const Clone: DraggableChildrenFn = React.useCallback(
    (provided, snapshot, rubric) => {
      const item = data.find(
        (doc) => doc?._metadata?.documentId === rubric.draggableId
      )

      return (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
        >
          {item ? (
            <DocumentCard
              // Assumed false, if it's dragging it's not disabled
              isDragDisabled={false}
              // Assumed false, if it's dragging it's not patching
              isPatching={false}
              // Assumed true, if you can drag it you can drop it
              userRoleCanDrop
              isDragging={snapshot.isDragging}
              item={item}
              states={states}
              toggleInvalidDocumentId={toggleInvalidDocumentId}
              userList={userList}
            />
          ) : (
            <Feedback title="Item not found" tone="caution" />
          )}
        </div>
      )
    },
    [data, states, toggleInvalidDocumentId, userList]
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
    <Flex direction="column" height="fill" overflow="hidden">
      <Verify data={data} userList={userList} states={states} />

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
              >
                <Flex direction="column" height="fill">
                  <StateTitle
                    state={state}
                    requireAssignment={state.requireAssignment ?? false}
                    userRoleCanDrop={userRoleCanDrop}
                    isDropDisabled={isDropDisabled}
                    draggingFrom={draggingFrom}
                    documentCount={
                      filterItemsAndSort(
                        data,
                        state.id,
                        selectedUserIds,
                        selectedSchemaTypes
                      ).length
                    }
                  />
                  <Box flex={1}>
                    <Droppable
                      droppableId={state.id}
                      isDropDisabled={isDropDisabled}
                      // props required for virtualization
                      mode="virtual"
                      renderClone={Clone}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          tone={
                            snapshot.isDraggingOver
                              ? `primary`
                              : defaultCardTone
                          }
                          height="fill"
                        >
                          {loading ? (
                            <Flex padding={5} align="center" justify="center">
                              <Spinner muted />
                            </Flex>
                          ) : null}

                          <DocumentList
                            data={data}
                            invalidDocumentIds={invalidDocumentIds}
                            patchingIds={patchingIds}
                            selectedSchemaTypes={selectedSchemaTypes}
                            selectedUserIds={selectedUserIds}
                            state={state}
                            states={states}
                            toggleInvalidDocumentId={toggleInvalidDocumentId}
                            user={user}
                            userList={userList}
                            userRoleCanDrop={userRoleCanDrop}
                          />

                          {/* Not required for virtualized lists */}
                          {/* {provided.placeholder} */}
                        </Card>
                      )}
                    </Droppable>
                  </Box>
                </Flex>
              </Card>
            )
          })}
        </Grid>
      </DragDropContext>
    </Flex>
  )
}
