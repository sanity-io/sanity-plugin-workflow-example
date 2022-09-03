import React from 'react'
import {
  Flex,
  Card,
  Box,
  Stack,
  Grid,
  Spinner,
  Label,
  useToast,
  Container,
  useTheme,
} from '@sanity/ui'
import {Feedback, useProjectUsers} from 'sanity-plugin-utils'
import {useDrag} from 'react-use-gesture'

import {Tool, useClient} from 'sanity'
import {DragData, SanityDocumentWithMetadata, State} from '../types'
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

  const [dragData, setDragData] = React.useState<DragData>({})
  const [targetState, setTargetState] = React.useState<string | null>(null)
  const client = useClient()
  const toast = useToast()

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'default' : 'transparent'

  const userList = useProjectUsers() || []
  const {workflowData} = useWorkflowDocuments(schemaTypes)
  const {data, loading, error} = workflowData

  // const documentIds = documents.map((item) => item.documentId)
  // const metadataDocumentIds = metadata.map((d) => d.documentId)
  // const documentIdsWithoutMetadata = documentIds.filter((id) => !metadataDocumentIds.includes(id))

  const move = React.useCallback(
    (document: SanityDocumentWithMetadata, newStateId: string) => {
      const newState = states.find((s) => s.id === newStateId)

      if (!newState?.id) {
        return toast.push({
          title: `Could not find target state ${newStateId}`,
          status: 'error',
        })
      }

      // We need to know if it's a draft or not
      const {_id, _type} = document

      // Metadata + useDocumentOperation always uses Published id
      const {_rev, documentId} = document._metadata

      setMutatingDocs((current) => [...current, {_id, _type, documentId, state: newState as State}])

      return client
        .patch(`workflow-metadata.${documentId}`)
        .ifRevisionId(_rev)
        .set({state: newStateId})
        .commit()
        .then(() => {
          return toast.push({
            title: `Moved to "${newState?.title ?? newStateId}"`,
            description: documentId,
            status: 'success',
          })
        })
        .catch(() => {
          return toast.push({
            title: `Failed to move to "${newState?.title ?? newStateId}"`,
            description: documentId,
            status: 'error',
          })
        })
    },
    [client, states, toast]
  )

  const addAssignee = React.useCallback(
    (documentId: string, userId: string) => {
      client
        .patch(`workflow-metadata.${documentId}`)
        .setIfMissing({assignees: []})
        .insert(`after`, `assignees[-1]`, [userId])
        .commit()
        .then((res) => res)
        .catch((err) => {
          console.error(err)

          return toast.push({
            title: `Failed to add assignee`,
            description: documentId,
            status: 'error',
          })
        })
    },
    [client, toast]
  )

  const removeAssignee = React.useCallback(
    (documentId: string, userId: string) => {
      client
        .patch(`workflow-metadata.${documentId}`)
        .unset([`assignees[@ == "${userId}"]`])
        .commit()
        .then((res) => res)
        .catch((err) => {
          console.error(err)

          return toast.push({
            title: `Failed to remove assignee`,
            description: documentId,
            status: 'error',
          })
        })
    },
    [client, toast]
  )

  const clearAssignees = React.useCallback(
    (documentId: string) => {
      client
        .patch(`workflow-metadata.${documentId}`)
        .unset([`assignees`])
        .commit()
        .then((res) => res)
        .catch((err) => {
          console.error(err)

          return toast.push({
            title: `Failed to clear assignees`,
            description: documentId,
            status: 'error',
          })
        })
    },
    [client, toast]
  )

  const bindDrag = useDrag(({args, down, xy, movement}) => {
    const [document] = args

    // Card distance from initial location
    const [x, y] = movement

    // Cursor travel distance
    const [cursorX] = xy

    const columnWidth = window.innerWidth / states.length
    const currentColumn = Math.trunc(cursorX / columnWidth)
    const newTargetState = states[currentColumn]?.id ?? ``
    if (targetState !== newTargetState) {
      setTargetState(newTargetState)
    }

    const documentId = document._metadata.documentId

    if (down) {
      setDragData({
        documentId,
        x,
        y,
        state: document._metadata.state,
      })
    } else {
      if (newTargetState && document._metadata.state !== newTargetState) {
        move(document, newTargetState)
      }

      setDragData({})
      setTargetState(null)
    }
  })

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
      {/* {documentIdsWithoutMetadata.length > 0 && (
          <Box paddingY={5} paddingX={3}>
            <Card shadow={1} padding={4} style={{textAlign: 'center'}}>
              <Button
                tone="primary"
                onClick={() => metadataList.importDocuments(documentIdsWithoutMetadata)}
              >
                Import {documentIdsWithoutMetadata.length}{' '}
                {documentIdsWithoutMetadata.length === 1 ? `Document` : `Documents`}
              </Button>
            </Card>
          </Box>
        )} */}
      <Grid columns={states.length} height="fill">
        {states.map((state: State, stateIndex: number) => (
          <Card
            borderLeft={stateIndex > 0}
            key={state.id}
            tone={targetState && targetState === state.id ? `primary` : defaultCardTone}
          >
            <Box>
              <Stack>
                <Box paddingX={3} paddingTop={4} paddingBottom={2} style={{pointerEvents: `none`}}>
                  <Label>{state.title}</Label>
                </Box>
                <Grid columns={1} gap={3} padding={3}>
                  {loading ? (
                    <Flex height="fill" align="center" justify="center">
                      <Spinner muted />
                    </Flex>
                  ) : null}
                  {data.length > 0 &&
                    filterItemsByState(data, state.id).map((item) => (
                      // The metadata's documentId is always published
                      // It doesn't change and force a rerender
                      <div key={item._metadata.documentId}>
                        <DocumentCard
                          bindDrag={bindDrag}
                          dragData={dragData}
                          item={item}
                          userList={userList}
                          onAssigneeAdd={(userId) => addAssignee(item._metadata.documentId, userId)}
                          onAssigneeRemove={(userId) =>
                            removeAssignee(item._metadata.documentId, userId)
                          }
                          onAssigneesClear={() => clearAssignees(item._metadata.documentId)}
                        />
                      </div>
                    ))}
                </Grid>
              </Stack>
            </Box>
          </Card>
        ))}
      </Grid>
    </>
  )
}
