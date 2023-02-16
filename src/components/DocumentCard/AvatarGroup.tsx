import React from 'react'
import {Box, Flex, Text} from '@sanity/ui'
import {useCurrentUser, UserAvatar} from 'sanity'

import {User} from '../../types'

type AvatarGroupProps = {
  users: User[]
  max?: number
}

export default function AvatarGroup(props: AvatarGroupProps) {
  const currentUser = useCurrentUser()
  const {users, max = 3} = props

  const len = users?.length
  const {me, visibleUsers} = React.useMemo(() => {
    return {
      me: currentUser?.id ? users.find((u) => u.id === currentUser.id) : undefined,
      visibleUsers: users.filter((u) => u.id !== currentUser?.id).slice(0, max - 1),
    }
  }, [users, max, currentUser])

  if (!users?.length) {
    return null
  }

  return (
    <Flex align="center" gap={1}>
      {me ? <UserAvatar user={me} /> : null}
      {visibleUsers.map((user) => (
        <Box key={user.id} style={{marginRight: -8}}>
          <UserAvatar user={user} />
        </Box>
      ))}
      {len > max && (
        <Box paddingLeft={2}>
          <Text size={1}>+{len - max}</Text>
        </Box>
      )}
    </Flex>
  )
}
