/* eslint-disable react/prop-types */
import {Box, Button, Card, Flex, Popover, Stack, useClickOutside, useTheme} from '@sanity/ui'
import {AddIcon, DragHandleIcon} from '@sanity/icons'
import React, {useState} from 'react'
import {useSchema, SchemaType} from 'sanity'
import {UserSelectMenu} from 'sanity-plugin-utils'
import {SanityPreview as Preview} from 'sanity'

import EditButton from './EditButton'
import {SanityDocumentWithMetadata, User} from '../../types'
import AvatarGroup from './AvatarGroup'
import UserAssignment from '../UserAssignment'

type DocumentCardProps = {
  userList: User[]
  isDragging: boolean
  item: SanityDocumentWithMetadata
}

export function DocumentCard(props: DocumentCardProps) {
  const {userList, isDragging, item} = props
  const {assignees, documentId} = item._metadata ?? {}
  const schema = useSchema()

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? 'transparent' : 'default'

  // Open/close handler
  // const [popoverRef, setPopoverRef] = useState(null)
  // const [openId, setOpenId] = useState<string | undefined>(``)

  // useClickOutside(() => setOpenId(``), [popoverRef])

  // const handleKeyDown = React.useCallback((e) => {
  //   if (e.key === 'Escape') {
  //     setOpenId(``)
  //   }
  // }, [])

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
              <UserAssignment userList={userList} assignees={assignees} documentId={documentId} />

              <EditButton id={item._id} type={item._type} />
            </Flex>
          </Card>
        </Stack>
      </Card>
    </Box>
  )
}
