import {Card, Grid} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {PropsWithChildren} from 'react'
import {css, styled} from 'styled-components'

const StyledFloatingCard = styled(Card)(
  () => css`
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 1000;
  `
)

export default function FloatingCard({children}: PropsWithChildren) {
  const childrenHaveValues = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children)

  return (
    <AnimatePresence>
      {childrenHaveValues ? (
        <motion.div
          key="floater"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
        >
          <StyledFloatingCard shadow={3} padding={3} margin={3} radius={3}>
            <Grid gap={2}>{children}</Grid>
          </StyledFloatingCard>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
