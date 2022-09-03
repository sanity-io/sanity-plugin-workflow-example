/* eslint-disable react/prop-types */
import {Button, Card, Flex, Popover, Stack, useClickOutside} from '@sanity/ui'
import {AddIcon, DragHandleIcon} from '@sanity/icons'
import React, {useState, useMemo, CSSProperties} from 'react'
import {useSchema, SchemaType} from 'sanity'
import {UserSelectMenu} from 'sanity-plugin-utils'
import {SanityPreview as Preview} from 'sanity/_unstable'

import EditButton from './EditButton'
import {ItemWithMetadata, User} from '../../types'
import AvatarGroup from './AvatarGroup'

type DocumentCardProps = {
  userList: User[]
  bindDrag: any
  dragData: any
  item: ItemWithMetadata
  onAssigneeAdd?: (userId: string) => void
  onAssigneeRemove?: (userId: string) => void
  onAssigneesClear?: () => void
}

const inlineStyle = (x: string, y: string) =>
  ({
    transform: `translate3d(${x}px, ${y}px, 0)`,
    rotate: `-10deg !important`,
    position: 'relative',
    zIndex: 11,
    userSelect: 'none',
  } as CSSProperties)

export function DocumentCard(props: DocumentCardProps) {
  const {userList, bindDrag, dragData, onAssigneeAdd, onAssigneeRemove, onAssigneesClear, item} =
    props
  const {assignees, documentId} = item._metadata ?? {}
  const schema = useSchema()

  const isBeingDragged = useMemo(() => dragData?.documentId === documentId, [dragData, documentId])

  // Open/close handler
  const [popoverRef, setPopoverRef] = useState(null)
  const [openId, setOpenId] = useState<string | undefined>(``)

  useClickOutside(() => setOpenId(``), [popoverRef])

  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape') {
      setOpenId(``)
    }
  }, [])

  return (
    <div style={isBeingDragged ? inlineStyle(dragData.x, dragData.y) : undefined}>
      <Card
        radius={2}
        shadow={isBeingDragged ? 3 : 1}
        tone={isBeingDragged ? 'positive' : 'default'}
      >
        <Stack>
          <div {...bindDrag(item)} style={{cursor: isBeingDragged ? 'grabbing' : 'grab'}}>
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
          </div>

          <Card padding={2} radius={2} tone="inherit">
            <Flex align="center" justify="space-between" gap={1}>
              <Popover
                // @ts-ignore
                ref={setPopoverRef}
                onKeyDown={handleKeyDown}
                content={
                  <UserSelectMenu
                    style={{maxHeight: 300}}
                    value={assignees || []}
                    userList={userList}
                    onAdd={onAssigneeAdd}
                    onClear={onAssigneesClear}
                    onRemove={onAssigneeRemove}
                  />
                }
                portal
                open={openId === documentId}
              >
                {!assignees || assignees.length === 0 ? (
                  <Button
                    onClick={() => setOpenId(documentId)}
                    fontSize={1}
                    padding={2}
                    tabIndex={-1}
                    icon={AddIcon}
                    text="Assign"
                    tone="positive"
                  />
                ) : (
                  <Button
                    onClick={() => setOpenId(documentId)}
                    padding={0}
                    mode="bleed"
                    style={{width: `100%`}}
                  >
                    <AvatarGroup userList={userList} assignees={assignees} />
                  </Button>
                )}
              </Popover>

              <EditButton id={item._id} type={item._type} />
            </Flex>
          </Card>
        </Stack>
      </Card>
    </div>
  )
}
