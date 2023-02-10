import React from 'react'
import {Flex, Card, Grid, Spinner, Label, useToast, Container, useTheme, Button} from '@sanity/ui'
import {Feedback, useProjectUsers} from 'sanity-plugin-utils'
import {Tool, useClient} from 'sanity'
import {DragDropContext, Droppable, Draggable, DropResult} from 'react-beautiful-dnd'

import {SanityDocumentWithMetadata, State, WorkflowConfig} from '../types'
import {DocumentCard} from './DocumentCard'
import {useWorkflowDocuments} from '../hooks/useWorkflowDocuments'
import {API_VERSION} from '../constants'
import FloatingCard from './FloatingCard'

function filterItemsByState(items: SanityDocumentWithMetadata[], stateId: string) {
  return items.filter((item) => item?._metadata?.state === stateId)
}

type WorkflowToolProps = {
  tool: Tool<WorkflowConfig>
}

export default function WorkflowTool(props: WorkflowToolProps) {
  const {schemaTypes = [], states = []} = props?.tool?.options ?? {}

  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'default' : 'transparent'

  const userList = useProjectUsers({apiVersion: API_VERSION}) || []
  const {workflowData, operations} = useWorkflowDocuments(schemaTypes)

  // Data to display in cards
  const {data, loading, error} = workflowData

  // Operations to perform on cards
  const {move} = operations
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
        title: 'Correcting documents',
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

  const handleDragEnd = React.useCallback(
    (result: DropResult) => {
      const {draggableId, source, destination} = result

      if (!destination || destination.droppableId === source.droppableId) {
        return
      }

      move(draggableId, destination, states)
    },
    [move, states]
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
        {documentsWithoutMetadataIds.length > 0 && (
          <Card tone="caution">
            <Flex align="center" justify="center">
              <Button onClick={() => importDocuments(documentsWithoutMetadataIds)}>
                Import {documentsWithoutMetadataIds.length} Missing{' '}
                {documentsWithoutMetadataIds.length === 1 ? `Document` : `Documents`} into Workflow
              </Button>
            </Flex>
          </Card>
        )}
        {documentsWithoutValidMetadataIds.length > 0 && (
          <Card tone="caution">
            <Flex align="center" justify="center">
              <Button onClick={() => correctDocuments(documentsWithoutValidMetadataIds)}>
                Correct {documentsWithoutValidMetadataIds.length}
                {` `}
                {documentsWithoutValidMetadataIds.length === 1 ? `Document` : `Documents`} States
              </Button>
            </Flex>
          </Card>
        )}
      </FloatingCard>
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
                      filterItemsByState(data, state.id).map((item, itemIndex) => (
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
