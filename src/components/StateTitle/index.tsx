import {Flex, Card, Badge, BadgeTone} from '@sanity/ui'
import {InfoOutlineIcon, UserIcon} from '@sanity/icons'
import styled, {css} from 'styled-components'

import {Status} from './Status'
import {
  // Operation,
  State,
} from '../../types'

type StateTitleProps = {
  state: State
  requireAssignment: boolean
  userRoleCanDrop: boolean
  isDropDisabled: boolean
  draggingFrom: string
  // operation?: Operation
}

const StyledStickyCard = styled(Card)(
  () => css`
    position: sticky;
    top: 0;
    z-index: 1;
  `
)

export default function StateTitle(props: StateTitleProps) {
  const {state, requireAssignment, userRoleCanDrop, isDropDisabled, draggingFrom} = props

  let tone: BadgeTone = 'default'
  const isSource = draggingFrom === state.id

  if (draggingFrom) {
    tone = isDropDisabled || isSource ? 'default' : 'positive'
  }

  return (
    <StyledStickyCard paddingY={4} padding={3} tone="inherit">
      <Flex gap={3} align="center">
        <Badge
          mode={(draggingFrom && !isDropDisabled) || isSource ? 'default' : 'outline'}
          tone={tone}
          muted={!userRoleCanDrop || isDropDisabled}
        >
          {state.title}
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
        {/* {operation ? (
          <Status
            text={
              operation === 'publish'
                ? `A document moved to this State will also publish the current Draft`
                : `A document moved to this State will also unpublish the current Published version`
            }
            icon={operation === 'publish' ? PublishIcon : UnpublishIcon}
          />
        ) : null} */}
      </Flex>
    </StyledStickyCard>
  )
}
