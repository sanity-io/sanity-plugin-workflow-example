import {Flex, Card, Badge, BadgeTone} from '@sanity/ui'
import {InfoOutlineIcon, UserIcon, PublishIcon, UnpublishIcon} from '@sanity/icons'

import {Status} from './Status'
import {Operation} from '../../types'

type StateTitleProps = {
  title: string
  requireAssignment: boolean
  userRoleCanDrop: boolean
  isDropDisabled: boolean
  dragStarted: boolean
  operation?: Operation
}

export default function StateTitle(props: StateTitleProps) {
  const {title, requireAssignment, userRoleCanDrop, isDropDisabled, dragStarted, operation} = props

  let tone: BadgeTone = 'default'

  if (dragStarted) {
    tone = isDropDisabled ? 'default' : 'positive'
  }

  return (
    <Card paddingY={4} padding={3} tone="inherit">
      <Flex gap={3} align="center">
        <Badge
          mode={dragStarted && !isDropDisabled ? 'default' : 'outline'}
          tone={tone}
          muted={!userRoleCanDrop || isDropDisabled}
        >
          {title}
        </Badge>
        {userRoleCanDrop ? null : (
          <Status
            text="You do not have permissions to move documents to this State"
            icon={InfoOutlineIcon}
          />
        )}
        {requireAssignment ? (
          <Status
            text="You must be assigned to the document to move documents to this State"
            icon={UserIcon}
          />
        ) : null}
        {operation ? (
          <Status
            text={
              operation === 'publish'
                ? `A document moved to this State will also publish the current Draft`
                : `A document moved to this State will also unpublish the current Published version`
            }
            icon={operation === 'publish' ? PublishIcon : UnpublishIcon}
          />
        ) : null}
      </Flex>
    </Card>
  )
}
