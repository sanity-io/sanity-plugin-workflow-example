import React from 'react'
import {Box, Flex, Text} from '@sanity/ui'
import {UserAvatar} from 'sanity/_unstable'

import {User} from '../../types'

type AvatarGroupProps = {
  userList: User[]
  assignees: string[]
}

export default function AvatarGroup(props: AvatarGroupProps) {
  const {userList, assignees} = props

  const max = 3
  const len = assignees?.length
  const visibleUsers = React.useMemo(
    () =>
      assignees
        .map((id) => userList.find((user) => user?.id === id))
        .filter(Boolean)
        .slice(0, max),
    [userList, assignees]
  ) as User[]

  if (!assignees?.length || !userList?.length) {
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
