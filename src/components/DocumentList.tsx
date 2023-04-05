import {Draggable} from '@hello-pangea/dnd'
import {useVirtualizer} from '@tanstack/react-virtual'
import {useMemo, useRef} from 'react'
import {CurrentUser} from 'sanity'
import {UserExtended} from 'sanity-plugin-utils'

import {filterItemsAndSort} from '../helpers/filterItemsAndSort'
import {SanityDocumentWithMetadata, State} from '../types'
import {DocumentCard} from './DocumentCard'

type DocumentListProps = {
  data: SanityDocumentWithMetadata[]
  invalidDocumentIds: string[]
  patchingIds: string[]
  selectedSchemaTypes: string[]
  selectedUserIds: string[]
  state: State
  states: State[]
  toggleInvalidDocumentId: (
    documentId: string,
    action: 'ADD' | 'REMOVE'
  ) => void
  user: CurrentUser | null
  userList: UserExtended[]
  userRoleCanDrop: boolean
}

export default function DocumentList(props: DocumentListProps) {
  const {
    data = [],
    invalidDocumentIds,
    patchingIds,
    selectedSchemaTypes,
    selectedUserIds,
    state,
    states,
    toggleInvalidDocumentId,
    user,
    userList,
    userRoleCanDrop,
  } = props

  const dataFiltered = useMemo(() => {
    return data.length
      ? filterItemsAndSort(data, state.id, selectedUserIds, selectedSchemaTypes)
      : []
  }, [data, selectedSchemaTypes, selectedUserIds, state.id])

  const parentRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    getItemKey: (index) => dataFiltered[index]?._metadata?.documentId ?? index,
    estimateSize: () => 113,
    overscan: 10,
  })

  if (!data.length) {
    return null
  }

  return (
    <div
      ref={parentRef}
      style={{
        height: `100%`,
        overflow: 'auto',
        paddingTop: 1,
        // Smooths scrollbar behaviour
        overflowAnchor: 'none',
        scrollBehavior: 'auto',
      }}
    >
      {/* {dataFiltered.map((item, itemIndex) => { */}
      {rowVirtualizer.getVirtualItems().map((virtualItem) => {
        const item = dataFiltered[virtualItem.index]

        const {documentId, assignees} = item?._metadata ?? {}

        if (!documentId) {
          return null
        }

        const isInvalid = invalidDocumentIds.includes(documentId)
        const meInAssignees = user?.id ? assignees?.includes(user.id) : false
        const isDragDisabled =
          !userRoleCanDrop ||
          isInvalid ||
          !(state.requireAssignment
            ? state.requireAssignment && meInAssignees
            : true)

        return (
          <Draggable
            // The metadata's documentId is always the published one to avoid rerendering
            key={documentId}
            draggableId={documentId}
            index={virtualItem.index}
            isDragDisabled={isDragDisabled}
          >
            {(draggableProvided, draggableSnapshot) => (
              <div
                ref={draggableProvided.innerRef}
                {...draggableProvided.draggableProps}
                {...draggableProvided.dragHandleProps}
              >
                <DocumentCard
                  userRoleCanDrop={userRoleCanDrop}
                  isDragDisabled={isDragDisabled}
                  isPatching={patchingIds.includes(documentId)}
                  isDragging={draggableSnapshot.isDragging}
                  item={item}
                  toggleInvalidDocumentId={toggleInvalidDocumentId}
                  userList={userList}
                  states={states}
                />
              </div>
            )}
          </Draggable>
        )
      })}
    </div>
  )
}
