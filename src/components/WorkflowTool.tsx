import React from 'react'
import {
  Flex,
  Card,
  Box,
  Grid,
  Spinner,
  Label,
  useToast,
  Container,
  useTheme,
  Button,
} from '@sanity/ui'
import {Feedback, useProjectUsers} from 'sanity-plugin-utils'
import {Tool, useClient} from 'sanity'
import {DragDropContext, Droppable, Draggable, DropResult} from 'react-beautiful-dnd'

import {SanityDocumentWithMetadata, State} from '../types'
import {DocumentCard} from './DocumentCard'
import Mutate from './Mutate'
import {useWorkflowDocuments} from '../hooks/useWorkflowDocuments'

function filterItemsByState(items: SanityDocumentWithMetadata[], stateId: string) {
  return items.filter((item) => item?._metadata?.state === stateId)
}

type WorkflowToolOptions = {
  schemaTypes: string[]
  states: State[]
}

type WorkflowToolProps = {
  tool: Tool<WorkflowToolOptions>
}

type MutateProps = {
  _id: string
  _type: string
  state: State
  documentId: string
}

export default function WorkflowTool(props: WorkflowToolProps) {
  const {schemaTypes = [], states = []} = props?.tool?.options ?? {}

  const [mutatingDocs, setMutatingDocs] = React.useState<MutateProps[]>([])
  const mutationFinished = React.useCallback((documentId: string) => {
    setMutatingDocs((docs) => docs.filter((doc) => doc._id !== documentId))
  }, [])

  const client = useClient()
  const toast = useToast()

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'default' : 'transparent'

  const userList = useProjectUsers() || []
  const {workflowData, operations} = useWorkflowDocuments(schemaTypes)

  // Data to display in cards
  const {data, loading, error} = workflowData

  // Operations to perform on cards
  const {move} = operations

  const documentsWithoutMetadataIds = data
    .filter((doc) => !doc._metadata)
    .map((d) => d._id.replace(`drafts.`, ``))

  const importDocuments = React.useCallback(async (ids: string[]) => {
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
      title: 'Imported documents',
      status: 'success',
    })
  }, [])

  const handleDragEnd = React.useCallback(
    (result: DropResult) => {
      const {draggableId, source, destination} = result
      console.log(
        `sending ${draggableId} from ${source.droppableId} to ${destination?.droppableId}`
      )

      if (!destination || destination.droppableId === source.droppableId) {
        return
      }

      // The list of mutating docs is how we un/publish documents
      const mutatingDoc = move(draggableId, destination, states)

      if (mutatingDoc) {
        // @ts-ignore
        // @todo not sure if these types should be updated. will documentId every be undefined here?
        setMutatingDocs((current) => [...current, mutatingDoc])
      }
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
      {mutatingDocs.length ? (
        <div style={{position: `absolute`, bottom: 0, background: 'red'}}>
          {mutatingDocs.map((mutate) => (
            <Mutate key={mutate._id} {...mutate} onComplete={mutationFinished} />
          ))}
        </div>
      ) : null}
      {documentsWithoutMetadataIds.length > 0 && (
        <Box padding={5}>
          <Card border padding={3} tone="caution">
            <Flex align="center" justify="center">
              <Button onClick={() => importDocuments(documentsWithoutMetadataIds)}>
                Import {documentsWithoutMetadataIds.length} Missing{' '}
                {documentsWithoutMetadataIds.length === 1 ? `Document` : `Documents`} into Workflow
              </Button>
            </Flex>
          </Card>
        </Box>
      )}
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
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
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
