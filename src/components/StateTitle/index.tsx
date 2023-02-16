import {Flex, Card, Label} from '@sanity/ui'
import {InfoOutlineIcon, UserIcon, PublishIcon, UnpublishIcon} from '@sanity/icons'

import {Status} from './Status'
import {Operation} from '../../types'

type StateTitleProps = {
  title: string
  requireAssignment: boolean
  userRoleCanDrop: boolean
  operation?: Operation
}

export default function StateTitle(props: StateTitleProps) {
  const {title, requireAssignment, userRoleCanDrop, operation} = props

  return (
    <Card padding={3} paddingTop={4} tone="inherit">
      <Flex gap={3}>
        <Label muted={!userRoleCanDrop}>{title}</Label>
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
