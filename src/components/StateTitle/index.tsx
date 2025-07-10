import {InfoOutlineIcon, UserIcon} from '@sanity/icons'
import {Badge, BadgeTone, Box, Card, Flex, Text} from '@sanity/ui'
import {css, styled} from 'styled-components'

import {State} from '../../types'
import {Status} from './Status'

const StyledStickyCard = styled(Card)(
  () => css`
    position: sticky;
    top: 0;
    z-index: 1;
  `
)

type StateTitleProps = {
  state: State
  requireAssignment: boolean
  userRoleCanDrop: boolean
  isDropDisabled: boolean
  draggingFrom: string
  documentCount: number
}

export default function StateTitle(props: StateTitleProps) {
  const {
    state,
    requireAssignment,
    userRoleCanDrop,
    isDropDisabled,
    draggingFrom,
    documentCount,
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
        <Box flex={1}>
          {documentCount > 0 ? (
            <Text weight="semibold" align="right" size={1}>
              {documentCount}
            </Text>
          ) : null}
        </Box>
      </Flex>
    </StyledStickyCard>
  )
}
