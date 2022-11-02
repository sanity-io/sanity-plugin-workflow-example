import React from 'react'
import {Box, Flex, Text} from '@sanity/ui'
import {UserAvatar} from 'sanity'

import {User} from '../../types'

type AvatarGroupProps = {
  users: User[]
  max?: number
}

export default function AvatarGroup(props: AvatarGroupProps) {
  const {users, max = 3} = props

  const len = users?.length
  const visibleUsers = React.useMemo(() => users.slice(0, max), [users]) as User[]

  if (!users?.length) {
    return null
  }

  return (
    <Flex align="center">
      {visibleUsers.map((user) => (
        <Box key={user.id} style={{marginRight: -5}}>
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
