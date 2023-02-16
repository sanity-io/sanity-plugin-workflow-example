/* eslint-disable react/prop-types */
import {useMemo} from 'react'
import {Box, Card, CardTone, Flex, Stack, useTheme, useToast} from '@sanity/ui'
import {DragHandleIcon} from '@sanity/icons'
import {useSchema, SchemaType, useDocumentOperation, useValidationStatus} from 'sanity'
import {Preview} from 'sanity'

import EditButton from './EditButton'
import {SanityDocumentWithMetadata, State, User} from '../../types'
import UserDisplay from '../UserDisplay'
import {DraftStatus} from './core/DraftStatus'
import {PublishedStatus} from './core/PublishedStatus'
import {ValidationStatus} from './ValidationStatus'

type DocumentCardProps = {
  isDragDisabled: boolean
  userRoleCanDrop: boolean
  isDragging: boolean
  item: SanityDocumentWithMetadata
  states: State[]
  toggleInvalidDocumentId: (documentId: string, action: 'ADD' | 'REMOVE') => void
  userList: User[]
}

export function DocumentCard(props: DocumentCardProps) {
  const {
    isDragDisabled,
    userRoleCanDrop,
    isDragging,
    item,
    states,
    toggleInvalidDocumentId,
    userList,
  } = props
  const {assignees = [], documentId} = item._metadata ?? {}
  const schema = useSchema()
  const currentState = useMemo(
    () => states.find((state) => state.id === item._metadata?.state),
    [states, item._metadata?.state]
  )

  // Perform operation
  // If state has changed and the document needs to be un/published
  const ops = useDocumentOperation(documentId ?? ``, item._type)
  const isDraft = item._id.startsWith('drafts.')

  const toast = useToast()

  // Perform document operations after state changes
  if (isDraft && currentState?.operation === 'publish' && !item?._metadata?.optimistic) {
    if (!ops.publish.disabled) {
      ops.publish.execute()
      toast.push({
        title: 'Published Document',
        description: documentId,
        status: 'success',
      })
    }
  } else if (!isDraft && currentState?.operation === 'unpublish' && !item?._metadata?.optimistic) {
    if (!ops.unpublish.disabled) {
      ops.unpublish.execute()
      toast.push({
        title: 'Unpublished Document',
        description: documentId,
        status: 'success',
      })
    }
  }

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? `transparent` : `default`
  const validation = useValidationStatus(documentId ?? ``, item._type)
  const cardTone = useMemo(() => {
    let tone: CardTone = defaultCardTone

    if (!userRoleCanDrop) return isDarkMode ? `default` : `transparent`
    if (!documentId) return tone
    if (isDragging) tone = `positive`

    if (validation.validation.length > 0) {
      if (validation.validation.some((v) => v.level === 'error')) {
        tone = `critical`
        toggleInvalidDocumentId(documentId, 'ADD')
      } else {
        tone = `caution`
        toggleInvalidDocumentId(documentId, 'REMOVE')
      }
    } else {
      toggleInvalidDocumentId(documentId, 'REMOVE')
    }

    return tone
  }, [
    isDarkMode,
    userRoleCanDrop,
    defaultCardTone,
    documentId,
    isDragging,
    toggleInvalidDocumentId,
    validation.validation,
  ])

  const hasError = validation.isValidating
    ? false
    : validation.validation.some((v) => v.level === 'error')

  return (
    <Box paddingBottom={3} paddingX={3}>
      <Card radius={2} shadow={isDragging ? 3 : 1} tone={cardTone}>
        <Stack>
          <Card
            borderBottom
            radius={2}
            padding={3}
            paddingLeft={2}
            tone={cardTone}
            style={{pointerEvents: 'none'}}
          >
            <Flex align="center" justify="space-between" gap={1}>
              <Preview
                layout="default"
                value={item}
                schemaType={schema.get(item._type) as SchemaType}
              />

              <Box style={{flexShrink: 0}}>
                {hasError || isDragDisabled ? null : <DragHandleIcon />}
              </Box>
            </Flex>
          </Card>

          <Card padding={2} radius={2} tone="inherit">
            <Flex align="center" justify="space-between" gap={3}>
              <Box flex={1}>
                {documentId && (
                  <UserDisplay
                    userList={userList}
                    assignees={assignees}
                    documentId={documentId}
                    disabled={!userRoleCanDrop}
                  />
                )}
              </Box>
              <ValidationStatus validation={validation.validation} />

              <DraftStatus document={item} />
              <PublishedStatus document={item} />
              <EditButton id={item._id} type={item._type} disabled={!userRoleCanDrop} />
            </Flex>
          </Card>
        </Stack>
      </Card>
    </Box>
  )
}
