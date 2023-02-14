import {Box, Flex, Card, Button} from '@sanity/ui'
import {UserAvatar, useSchema} from 'sanity'
import {ResetIcon} from '@sanity/icons'

type FiltersProps = {
  uniqueAssignedUsers: any[]
  selectedUsers: string[]
  schemaTypes: string[]
  selectedSchemaTypes: string[]
  toggleSelectedUser: (userId: string) => void
  resetSelectedUsers: () => void
  toggleSelectedSchemaType: (schemaType: string) => void
}

export default function Filters(props: FiltersProps) {
  const {
    uniqueAssignedUsers,
    selectedUsers,
    schemaTypes,
    selectedSchemaTypes,
    toggleSelectedUser,
    resetSelectedUsers,
    toggleSelectedSchemaType,
  } = props

  const schema = useSchema()

  return (
    <Card tone="primary" padding={2} borderBottom style={{overflowX: 'hidden'}}>
      <Flex justify="space-between">
        {uniqueAssignedUsers.length > 0 ? (
          <Flex align="center" gap={1}>
            {uniqueAssignedUsers.map((user) => (
              <Button
                key={user.id}
                padding={1}
                mode={selectedUsers.includes(user.id) ? `default` : `bleed`}
                onClick={() => toggleSelectedUser(user.id)}
              >
                <UserAvatar user={user} size={1} />
              </Button>
            ))}

            {selectedUsers.length > 0 ? (
              <Card borderLeft marginLeft={2} paddingLeft={3} tone="inherit">
                <Button text="Clear" onClick={resetSelectedUsers} mode="ghost" icon={ResetIcon} />
              </Card>
            ) : null}
          </Flex>
        ) : (
          <Box flex={1} />
        )}
        {schemaTypes.length > 0 ? (
          <Flex align="center" gap={1}>
            {schemaTypes.map((type) => (
              <Button
                key={type}
                text={schema.get(type)?.title ?? type}
                icon={schema.get(type)?.icon ?? undefined}
                mode={selectedSchemaTypes.includes(type) ? `default` : `ghost`}
                onClick={() => toggleSelectedSchemaType(type)}
              />
            ))}
          </Flex>
        ) : null}
      </Flex>
    </Card>
  )
}
