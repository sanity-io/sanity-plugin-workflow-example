import {Flex, Card, Button} from '@sanity/ui'
import {useCurrentUser, UserAvatar, useSchema} from 'sanity'
import {ResetIcon} from '@sanity/icons'
import {UserExtended} from 'sanity-plugin-utils'

type FiltersProps = {
  uniqueAssignedUsers: UserExtended[]
  selectedUserIds: string[]
  schemaTypes: string[]
  selectedSchemaTypes: string[]
  toggleSelectedUser: (userId: string) => void
  resetSelectedUsers: () => void
  toggleSelectedSchemaType: (schemaType: string) => void
}

export default function Filters(props: FiltersProps) {
  const {
    uniqueAssignedUsers = [],
    selectedUserIds,
    schemaTypes,
    selectedSchemaTypes,
    toggleSelectedUser,
    resetSelectedUsers,
    toggleSelectedSchemaType,
  } = props
  const currentUser = useCurrentUser()

  const schema = useSchema()

  if (uniqueAssignedUsers.length === 0 && schemaTypes.length < 2) {
    return null
  }

  return (
    <Card tone="primary" padding={2} borderBottom style={{overflowX: 'hidden'}}>
      <Flex align="center">
        <Flex align="center" gap={1} flex={1}>
          {currentUser?.id && uniqueAssignedUsers.find((u) => u.id === currentUser.id) ? (
            <>
              <Button
                padding={0}
                mode={selectedUserIds.includes(currentUser.id) ? `default` : `bleed`}
                onClick={() => toggleSelectedUser(currentUser.id)}
              >
                <Flex padding={1} align="center" justify="center">
                  <UserAvatar user={currentUser.id} size={1} withTooltip />
                </Flex>
              </Button>
              <Card borderRight style={{height: 30}} tone="inherit" />
            </>
          ) : null}
          {uniqueAssignedUsers
            .filter((u) => (currentUser?.id ? u.id !== currentUser.id : true))
            .map((user) => (
              <Button
                key={user.id}
                padding={0}
                mode={selectedUserIds.includes(user.id) ? `default` : `bleed`}
                onClick={() => toggleSelectedUser(user.id)}
              >
                <Flex padding={1} align="center" justify="center">
                  <UserAvatar user={user} size={1} withTooltip />
                </Flex>
              </Button>
            ))}

          {selectedUserIds.length > 0 ? (
            <Button text="Clear" onClick={resetSelectedUsers} mode="ghost" icon={ResetIcon} />
          ) : null}
        </Flex>

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
