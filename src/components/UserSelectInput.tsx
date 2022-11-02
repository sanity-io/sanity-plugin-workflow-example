import {Card} from '@sanity/ui'
import React, {useCallback} from 'react'
import type {ArrayOfPrimitivesInputProps} from 'sanity'
import {setIfMissing, insert, unset} from 'sanity'
import {UserSelectMenu, useProjectUsers} from 'sanity-plugin-utils'

export default function UserSelectInput(props: ArrayOfPrimitivesInputProps) {
  const {value = [], onChange} = props
  const userList = useProjectUsers()

  const onAssigneeAdd = useCallback(
    (userId: string) => {
      onChange([setIfMissing([]), insert([userId], `after`, [-1])])
    },
    [onChange]
  )

  const onAssigneeRemove = useCallback(
    (userId: string) => {
      const userIdIndex = value.findIndex((v) => v === userId)

      onChange(unset([userIdIndex]))
    },
    [onChange, value]
  )

  const onAssigneesClear = useCallback(() => {
    onChange(unset())
  }, [onChange])

  return (
    <Card border radius={3} padding={1}>
      <UserSelectMenu
        open
        value={value as string[]}
        userList={userList}
        onAdd={onAssigneeAdd}
        onClear={onAssigneesClear}
        onRemove={onAssigneeRemove}
      />
    </Card>
  )
}
