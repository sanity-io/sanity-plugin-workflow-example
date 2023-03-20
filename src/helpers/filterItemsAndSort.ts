import {SanityDocumentWithMetadata} from '../types'

export function filterItemsAndSort(
  items: SanityDocumentWithMetadata[],
  stateId: string,
  selectedUsers: string[] = [],
  selectedSchemaTypes: string[] = []
): SanityDocumentWithMetadata[] {
  return (
    items
      // Only items of this state
      .filter((item) => item?._metadata?.state === stateId)
      // Only items with selected users, if the document has any assigned users
      .filter((item) =>
        selectedUsers.length && item._metadata?.assignees?.length
          ? item._metadata?.assignees.some((assignee) =>
              selectedUsers.includes(assignee)
            )
          : !selectedUsers.length
      )
      // Only items of selected schema types, if any are selected
      .filter((item) =>
        selectedSchemaTypes.length
          ? selectedSchemaTypes.includes(item._type)
          : false
      )
      // Sort by metadata order
      .sort((a, b) => {
        const aOrder = a?._metadata?.order ?? 0
        const bOrder = b?._metadata?.order ?? 0

        return aOrder - bOrder
      })
  )
}
