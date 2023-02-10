/* eslint-disable react/prop-types */
import {Box, Card, Flex, Stack, useTheme, useToast} from '@sanity/ui'
import {DragHandleIcon} from '@sanity/icons'
import {useSchema, SchemaType, useDocumentOperation} from 'sanity'
import {Preview} from 'sanity'

import EditButton from './EditButton'
import {SanityDocumentWithMetadata, State, User} from '../../types'
import UserAssignment from '../UserAssignment'
import {useMemo} from 'react'

type DocumentCardProps = {
  userList: User[]
  isDragging: boolean
  item: SanityDocumentWithMetadata
  states: State[]
}

export function DocumentCard(props: DocumentCardProps) {
  const {userList, isDragging, item, states} = props
  const {assignees = [], documentId} = item._metadata ?? {}
  const schema = useSchema()
  const currentState = useMemo(
    () => states.find((state) => state.id === item._metadata?.state),
    [states, item._metadata?.state]
  )

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'transparent' : 'default'

  // Perform operation
  // If state has changed and the document needs to be un/published
  const ops = useDocumentOperation(documentId ?? ``, item._type)
  const isDraft = item._id.startsWith('drafts.')

  const toast = useToast()

  if (isDraft && currentState?.operation === 'publish') {
    if (!ops.publish.disabled) {
      ops.publish.execute()
      toast.push({
        title: 'Published Document',
        description: documentId,
        status: 'success',
      })
    }
  } else if (!isDraft && currentState?.operation === 'unpublish') {
    if (!ops.unpublish.disabled) {
      ops.unpublish.execute()
      toast.push({
        title: 'Unpublished Document',
        description: documentId,
        status: 'success',
      })
    }
  }

  return (
    <Box paddingY={2} paddingX={3}>
      <Card radius={2} shadow={isDragging ? 3 : 1} tone={isDragging ? 'positive' : defaultCardTone}>
        <Stack>
          <Card
            borderBottom
            radius={2}
            padding={3}
            paddingLeft={2}
            tone="inherit"
            style={{pointerEvents: 'none'}}
          >
            <Flex align="center" justify="space-between" gap={1}>
              <Preview
                layout="default"
                value={item}
                schemaType={schema.get(item._type) as SchemaType}
              />
              <DragHandleIcon style={{flexShrink: 0}} />
            </Flex>
          </Card>

          <Card padding={2} radius={2} tone="inherit">
            <Flex align="center" justify="space-between" gap={1}>
              {documentId && (
                <UserAssignment userList={userList} assignees={assignees} documentId={documentId} />
              )}
              <EditButton id={item._id} type={item._type} />
            </Flex>
          </Card>
        </Stack>
      </Card>
    </Box>
  )
}
