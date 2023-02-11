import React from 'react'
import {Box, Flex, Card, Grid, Spinner, Label, Container, useTheme, Button} from '@sanity/ui'
import {Feedback, useProjectUsers} from 'sanity-plugin-utils'
import {Tool, UserAvatar, useSchema} from 'sanity'
import {ResetIcon} from '@sanity/icons'
import {DragDropContext, Droppable, Draggable, DropResult} from 'react-beautiful-dnd'

import {SanityDocumentWithMetadata, State, WorkflowConfig} from '../types'
import {DocumentCard} from './DocumentCard'
import {useWorkflowDocuments} from '../hooks/useWorkflowDocuments'
import {API_VERSION, ORDER_MAX, ORDER_MIN} from '../constants'

import Validators from './Validators'

function filterItemsByStateAndUserAndSort(
  items: SanityDocumentWithMetadata[],
  stateId: string,
  selectedUsers: string[],
  selectedSchemaTypes: string[]
) {
  return items
    .filter((item) => item?._metadata?.state === stateId)
    .filter((item) =>
      selectedUsers.length && item._metadata?.assignees.length
        ? item._metadata?.assignees.some((assignee) => selectedUsers.includes(assignee))
        : !selectedUsers.length
    )
    .filter((item) =>
      selectedSchemaTypes.length
        ? selectedSchemaTypes.includes(item._type)
        : Boolean(selectedSchemaTypes.length)
    )
    .sort((a, b) => {
      const aOrder = a?._metadata?.order ?? 0
      const bOrder = b?._metadata?.order ?? 0

      return aOrder - bOrder
    })
}

type WorkflowToolProps = {
  tool: Tool<WorkflowConfig>
}

export default function WorkflowTool(props: WorkflowToolProps) {
  const {schemaTypes = [], states = []} = props?.tool?.options ?? {}

  const schema = useSchema()
  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'default' : 'transparent'

  const userList = useProjectUsers({apiVersion: API_VERSION})
  const {workflowData, operations} = useWorkflowDocuments(schemaTypes)

  // Data to display in cards
  const {data, loading, error} = workflowData

  // Operations to perform on cards
  const {move} = operations

  const handleDragEnd = React.useCallback(
    (result: DropResult) => {
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
      const destinationStateItems = [
        ...filterItemsByStateAndUserAndSort(data, destination.droppableId, [], []),
      ]
      let newOrder = ORDER_MIN

      if (!destinationStateItems.length) {
        // Only item in state
        newOrder = ORDER_MIN
      } else if (destination.index === 0) {
        // Now first item in order
        const firstItem = [...destinationStateItems].shift()
        newOrder = firstItem?._metadata?.order ? firstItem?._metadata?.order - 1000 : ORDER_MIN
      } else if (destination.index === destinationStateItems.length) {
        // Now last item in order
        const lastItem = [...destinationStateItems].pop()
        newOrder = lastItem?._metadata?.order ? lastItem?._metadata?.order + 1000 : ORDER_MAX
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

    return userList.filter((user) => uniqueUserIds.includes(user.id))
  }, [data, userList])

  const [selectedUsers, setSelectedUsers] = React.useState<any[]>(uniqueAssignedUsers)
  const toggleSelectedUser = React.useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((u) => u !== userId) : [...prev, userId]
    )
  }, [])

  const [selectedSchemaTypes, setSelectedSchemaTypes] = React.useState<string[]>(schemaTypes)
  const toggleSelectedSchemaType = React.useCallback((schemaType: string) => {
    setSelectedSchemaTypes((prev) =>
      prev.includes(schemaType) ? prev.filter((u) => u !== schemaType) : [...prev, schemaType]
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
      <Card tone="primary" padding={2} borderBottom style={{overflowX: 'hidden'}}>
        <Flex justify="space-between">
          {uniqueAssignedUsers.length > 0 ? (
            <Flex align="center" gap={1}>
              {uniqueAssignedUsers.map((user) => (
                <Button
                  key={user.id}
                  padding={1}
                  mode={selectedUsers.includes(user.id) ? `default` : `bleed`}
                  onClick={() => toggleSelectedUser(user.id)}
                >
                  <UserAvatar user={user} size={1} />
                </Button>
              ))}

              {selectedUsers.length > 0 ? (
                <Card borderLeft marginLeft={2} paddingLeft={3} tone="inherit">
                  <Button
                    text="Clear"
                    onClick={() => setSelectedUsers([])}
                    mode="ghost"
                    icon={ResetIcon}
                  />
                </Card>
              ) : null}
            </Flex>
          ) : (
            <Box flex={1} />
          )}
          {schemaTypes.length > 0 ? (
            <Flex align="center" gap={1}>
              {schemaTypes.map((type) => (
                <Button
                  key={type}
                  text={schema.get(type)?.title ?? type}
                  icon={schema.get(type)?.icon ?? undefined}
                  mode={selectedSchemaTypes.includes(type) ? `default` : `ghost`}
                  fontSize={2}
                  onClick={() => toggleSelectedSchemaType(type)}
                />
              ))}
            </Flex>
          ) : null}
        </Flex>
      </Card>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid columns={states.length} height="fill">
          {states.map((state: State, stateIndex: number) => (
            <Card key={state.id} borderLeft={stateIndex > 0}>
              <Card paddingY={4} padding={3} style={{pointerEvents: `none`}}>
                <Label>{state.title}</Label>
              </Card>
              <Droppable droppableId={state.id}>
                {(provided, snapshot) => (
                  <Card
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
                      filterItemsByStateAndUserAndSort(
                        data,
                        state.id,
                        selectedUsers,
                        selectedSchemaTypes
                      ).map((item, itemIndex) => (
                        // The metadata's documentId is always the published one
                        <Draggable
                          key={item?._metadata?.documentId as string}
                          draggableId={item?._metadata?.documentId as string}
                          index={itemIndex}
                        >
                          {(draggableProvided, draggableSnapshot) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                            >
                              <DocumentCard
                                isDragging={draggableSnapshot.isDragging}
                                item={item}
                                userList={userList}
                                states={states}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </Card>
                )}
              </Droppable>
            </Card>
          ))}
        </Grid>
      </DragDropContext>
    </>
  )
}
