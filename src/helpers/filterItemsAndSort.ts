import {SanityDocumentWithMetadata} from '../types'

export function filterItemsAndSort(
  items: SanityDocumentWithMetadata[],
  stateId: string,
  selectedUsers: string[] = [],
  selectedSchemaTypes: null | string[] = []
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
      .filter((item) => {
        if (!selectedSchemaTypes) {
          return true
        }

        return selectedSchemaTypes.length
          ? selectedSchemaTypes.includes(item._type)
          : false
      })
      // Sort by metadata orderRank, a string field
      .sort((a, b) => {
        const aOrderRank = a._metadata?.orderRank || '0'
        const bOrderRank = b._metadata?.orderRank || '0'

        return aOrderRank.localeCompare(bOrderRank)
      })
  )
}
