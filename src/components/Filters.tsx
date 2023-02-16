import {Flex, Card, Button} from '@sanity/ui'
import {useCurrentUser, UserAvatar, useSchema} from 'sanity'
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
  const me = useCurrentUser()

  const schema = useSchema()

  return (
    <Card tone="primary" padding={2} borderBottom style={{overflowX: 'hidden'}}>
      <Flex align="center">
        <Flex align="center" gap={1} flex={1}>
          {me?.id ? (
            <>
              <Button
                padding={0}
                mode={selectedUsers.includes(me.id) ? `default` : `bleed`}
                onClick={() => toggleSelectedUser(me.id)}
              >
                <Flex padding={1} align="center" justify="center">
                  <UserAvatar user={me.id} size={1} withTooltip />
                </Flex>
              </Button>
              <Card borderRight style={{height: 30}} tone="inherit" />
            </>
          ) : null}
          {uniqueAssignedUsers.length > 0 &&
            uniqueAssignedUsers
              .filter((user) => (me?.id ? user.id !== me.id : true))
              .map((user) => (
                <Button
                  key={user.id}
                  padding={0}
                  mode={selectedUsers.includes(user.id) ? `default` : `bleed`}
                  onClick={() => toggleSelectedUser(user.id)}
                >
                  <Flex padding={1} align="center" justify="center">
                    <UserAvatar user={user} size={1} withTooltip />
                  </Flex>
                </Button>
              ))}

          {selectedUsers.length > 0 ? (
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
