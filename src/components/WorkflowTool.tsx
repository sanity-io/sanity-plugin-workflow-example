import React from 'react'
import {Flex, Card, Grid, Spinner, Label, useToast, Container, useTheme, Button} from '@sanity/ui'
import {Feedback, useProjectUsers} from 'sanity-plugin-utils'
import {Tool, useClient, UserAvatar, useSchema} from 'sanity'
import {ResetIcon} from '@sanity/icons'
import {DragDropContext, Droppable, Draggable, DropResult} from 'react-beautiful-dnd'

import {SanityDocumentWithMetadata, State, WorkflowConfig} from '../types'
import {DocumentCard} from './DocumentCard'
import {useWorkflowDocuments} from '../hooks/useWorkflowDocuments'
import {API_VERSION, ORDER_MAX, ORDER_MIN} from '../constants'
import FloatingCard from './FloatingCard'

function filterItemsByStateAndUserAndSort(
  items: SanityDocumentWithMetadata[],
  stateId: string,
  selectedUsers: string[]
) {
  return items
    .filter((item) => item?._metadata?.state === stateId)
    .filter((item) =>
      selectedUsers.length && item._metadata?.assignees.length
        ? item._metadata?.assignees.some((assignee) => selectedUsers.includes(assignee))
        : !selectedUsers.length
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

  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()
  const schema = useSchema()

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'default' : 'transparent'

  const userList = useProjectUsers({apiVersion: API_VERSION})
  const {workflowData, operations} = useWorkflowDocuments(schemaTypes)

  // Data to display in cards
  const {data, loading, error} = workflowData

  // Operations to perform on cards
  const {move} = operations

  // A lot of error-checking
  const documentsWithoutMetadataIds = data?.length
    ? data.filter((doc) => !doc._metadata).map((d) => d._id.replace(`drafts.`, ``))
    : []
  const documentsWithoutValidMetadataIds = data?.length
    ? data.reduce((acc, cur) => {
        const {documentId, state} = cur._metadata ?? {}
        const stateExists = states.find((s) => s.id === state)

        return !stateExists && documentId ? [...acc, documentId] : acc
      }, [] as string[])
    : []
  const documentsWithoutValidUsersIds = data?.length
    ? data.reduce((acc, cur) => {
        const {documentId, assignees} = cur._metadata ?? {}
        const assigneesExist = assignees?.every((a) => userList.find((u) => u.id === a))

        return !assigneesExist && documentId ? [...acc, documentId] : acc
      }, [] as string[])
    : []
  const documentsWithoutOrderIds = data?.length
    ? data.reduce((acc, cur) => {
        const {documentId, order} = cur._metadata ?? {}

        return !order && documentId ? [...acc, documentId] : acc
      }, [] as string[])
    : []

  // Creates metadata documents for those that do not have them
  const importDocuments = React.useCallback(
    async (ids: string[]) => {
      toast.push({
        title: 'Importing documents',
        status: 'info',
      })

      const tx = ids.reduce((item, documentId) => {
        return item.createOrReplace({
          _id: `workflow-metadata.${documentId}`,
          _type: 'workflow.metadata',
          state: states[0].id,
          documentId,
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Imported ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, states, toast]
  )

  // Updates metadata documents to a valid, existing state
  const correctDocuments = React.useCallback(
    async (ids: string[]) => {
      toast.push({
        title: 'Correcting...',
        status: 'info',
      })

      const tx = ids.reduce((item, documentId) => {
        return item.patch(`workflow-metadata.${documentId}`, {
          set: {state: states[0].id},
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Corrected ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, states, toast]
  )

  // Remove users that are no longer in the project from documents
  const removeUsersFromDocuments = React.useCallback(
    async (ids: string[]) => {
      toast.push({
        title: 'Removing users...',
        status: 'info',
      })

      const tx = ids.reduce((item, documentId) => {
        const {assignees} = data.find((d) => d._id === documentId)?._metadata ?? {}
        const validAssignees = assignees?.length
          ? // eslint-disable-next-line max-nested-callbacks
            assignees.filter((a) => userList.find((u) => u.id === a)?.id)
          : []

        return item.patch(`workflow-metadata.${documentId}`, {
          set: {assignees: validAssignees},
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Corrected ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, data, toast]
  )

  // Add order value to metadata documents
  const addOrderToDocuments = React.useCallback(
    async (ids: string[]) => {
      toast.push({
        title: 'Adding ordering...',
        status: 'info',
      })

      // TODO: This doesn't consider the order of other documents
      const startingValue = 10000
      const tx = ids.reduce((item, documentId, itemIndex) => {
        return item.patch(`workflow-metadata.${documentId}`, {
          set: {order: startingValue + itemIndex * 1000},
        })
      }, client.transaction())

      await tx.commit()

      toast.push({
        title: `Added order to ${ids.length === 1 ? `1 Document` : `${ids.length} Documents`}`,
        status: 'success',
      })
    },
    [client, toast]
  )

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
        ...filterItemsByStateAndUserAndSort(data, destination.droppableId, []),
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
      <FloatingCard>
        {documentsWithoutMetadataIds.length > 0 ? (
          <Button
            tone="caution"
            onClick={() => importDocuments(documentsWithoutMetadataIds)}
            text={
              documentsWithoutMetadataIds.length === 1
                ? `Import 1 Missing Document into Workflow`
                : `Import ${documentsWithoutMetadataIds.length} Missing Documents into Workflow`
            }
          />
        ) : null}
        {documentsWithoutValidMetadataIds.length > 0 ? (
          <Button
            tone="caution"
            onClick={() => correctDocuments(documentsWithoutValidMetadataIds)}
            text={
              documentsWithoutValidMetadataIds.length === 1
                ? `Correct 1 Document State`
                : `Correct ${documentsWithoutValidMetadataIds.length} Document States`
            }
          />
        ) : null}
        {documentsWithoutValidUsersIds.length > 0 ? (
          <Button
            tone="caution"
            onClick={() => removeUsersFromDocuments(documentsWithoutValidUsersIds)}
            text={
              documentsWithoutValidUsersIds.length === 1
                ? `Remove Invalid Users from 1 Document`
                : `Remove Invalid Users from ${documentsWithoutValidUsersIds.length} Documents`
            }
          />
        ) : null}
        {documentsWithoutOrderIds.length > 0 ? (
          <Button
            tone="caution"
            onClick={() => addOrderToDocuments(documentsWithoutOrderIds)}
            text={
              documentsWithoutOrderIds.length === 1
                ? `Set Order for 1 Document`
                : `Set Order for ${documentsWithoutOrderIds.length} Documents`
            }
          />
        ) : null}
      </FloatingCard>
      <Card tone="primary" padding={2} borderBottom>
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
                <Card borderLeft marginLeft={2} paddingLeft={2} tone="inherit">
                  <Button
                    text="Clear"
                    onClick={() => setSelectedUsers([])}
                    // fontSize={1}
                    // padding={2}
                    mode="ghost"
                    icon={ResetIcon}
                  />
                </Card>
              ) : null}
            </Flex>
          ) : null}
          {schemaTypes.length > 0 ? (
            <Flex align="center" gap={1}>
              {schemaTypes.map((type) => (
                <Button
                  key={type}
                  text={schema.get(type)?.title ?? type}
                  icon={schema.get(type)?.icon ?? undefined}
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
                      filterItemsByStateAndUserAndSort(data, state.id, selectedUsers).map(
                        (item, itemIndex) => (
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
                        )
                      )}
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
