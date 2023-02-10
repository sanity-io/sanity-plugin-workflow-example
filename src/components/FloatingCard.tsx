import {PropsWithChildren} from 'react'
import styled, {css} from 'styled-components'
import {Card} from '@sanity/ui'
import {motion, AnimatePresence} from 'framer-motion'

const StyledFloatingCard = styled(Card)(
  () => css`
    position: fixed;
    bottom: 0;
    left: 0;
  `
)

export default function FloatingCard({children}: PropsWithChildren) {
  return (
    <AnimatePresence>
      {children ? (
        <motion.div key="floater" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
          <StyledFloatingCard shadow={3} padding={3} margin={3} radius={3}>
            {children}
          </StyledFloatingCard>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
