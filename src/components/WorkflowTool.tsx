import React from 'react'
import {Flex, Card, Box, Stack, Grid, Spinner, Label, useToast, Container} from '@sanity/ui'
import {Feedback, useProjectUsers, useListeningQuery} from 'sanity-plugin-utils'
import {useDrag} from 'react-use-gesture'

import {SanityDocumentLike, Tool, useClient} from 'sanity'
import {DragData, ItemWithMetadata, Metadata, State} from '../types'
import {DocumentCard} from './DocumentCard'
import Mutate from './Mutate'

function filterItemsByState(items: ItemWithMetadata[], stateId: string) {
  return items.filter((item) => item?._metadata?.state === stateId)
}

type WorkflowToolOptions = {
  schemaTypes: string[]
  states: State[]
}

type WorkflowToolProps = {
  tool: Tool<WorkflowToolOptions>
}

const DOCUMENT_LIST_QUERY = `*[_type in $schemaTypes]{ _id, _type, _rev }`
const METADATA_LIST_QUERY = `*[_type == "workflow.metadata"]{
  _rev,
  assignees,
  documentId,
  state
}`
// "reference": coalesce(
//   *[_id == "drafts." + ^.documentId] {_type} [0],
//   *[_id == ^.documentId] {_type} [0]
// ),

const COMBINED_QUERY = `{
  "documents": ${DOCUMENT_LIST_QUERY},
  "metadata": ${METADATA_LIST_QUERY}
}`

type DocumentsAndMetadata = {
  documents: SanityDocumentLike[]
  metadata: Metadata[]
}

const INITIAL_DATA: DocumentsAndMetadata = {
  documents: [],
  metadata: [],
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

  const userList = useProjectUsers() || []
  const {data, loading, error} = useListeningQuery<DocumentsAndMetadata>(
    COMBINED_QUERY,
    {schemaTypes},
    {},
    INITIAL_DATA
  )
  const {documents, metadata} = data

  // const documentIds = documents.map((item) => item.documentId)
  // const metadataDocumentIds = metadata.map((d) => d.documentId)
  // const documentIdsWithoutMetadata = documentIds.filter((id) => !metadataDocumentIds.includes(id))

  // Combine metadata data into document
  const documentsWithMetadata = React.useMemo(
    () =>
      documents.reduce((acc, cur) => {
        // Filter out documents without metadata
        const curMeta = metadata.find((d) => d.documentId === cur._id.replace(`drafts.`, ``))

        if (!curMeta) {
          return acc
        }

        const curWithMetadata: ItemWithMetadata = {_metadata: curMeta, ...cur}

        // Remove `published` from array if `draft` exists
        if (!cur._id.startsWith(`drafts.`)) {
          // eslint-disable-next-line max-nested-callbacks
          const alsoHasDraft = documents.some((doc) => doc._id === `drafts.${cur._id}`)

          return alsoHasDraft ? acc : [...acc, curWithMetadata]
        }

        return [...acc, curWithMetadata]
      }, [] as ItemWithMetadata[]),
    [documents, metadata]
  )

  const move = React.useCallback(
    (document: ItemWithMetadata, newStateId: string) => {
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
            tone={targetState && targetState === state.id ? `primary` : undefined}
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
                  {documentsWithMetadata.length > 0 &&
                    filterItemsByState(documentsWithMetadata, state.id).map((item) => (
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
