import {InfoOutlineIcon, UserIcon} from '@sanity/icons'
import {Badge, BadgeTone, Card, Flex} from '@sanity/ui'
import styled, {css} from 'styled-components'

import {State} from '../../types'
import {Status} from './Status'

type StateTitleProps = {
  state: State
  requireAssignment: boolean
  userRoleCanDrop: boolean
  isDropDisabled: boolean
  draggingFrom: string
}

const StyledStickyCard = styled(Card)(
  () => css`
    position: sticky;
    top: 0;
    z-index: 1;
  `
)

export default function StateTitle(props: StateTitleProps) {
  const {
    state,
    requireAssignment,
    userRoleCanDrop,
    isDropDisabled,
    draggingFrom,
  } = props

  let tone: BadgeTone = 'default'
  const isSource = draggingFrom === state.id

  if (draggingFrom) {
    tone = isDropDisabled || isSource ? 'default' : 'positive'
  }

  return (
    <StyledStickyCard paddingY={4} padding={3} tone="inherit">
      <Flex gap={3} align="center">
        <Badge
          mode={
            (draggingFrom && !isDropDisabled) || isSource
              ? 'default'
              : 'outline'
          }
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
      </Flex>
    </StyledStickyCard>
  )
}
