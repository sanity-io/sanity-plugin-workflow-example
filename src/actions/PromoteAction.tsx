import {CheckmarkIcon} from '@sanity/icons'
import {DocumentActionProps} from 'sanity'
// import {inferMetadataState, useWorkflowMetadata} from '../../lib/workflow'

export function PromoteAction(props: DocumentActionProps) {
  console.log(props)
  // const metadata = useWorkflowMetadata(props.id, inferMetadataState(props))

  // if (metadata.data.state !== 'inReview') {
  //   return null
  // }

  const onHandle = () => {
    // metadata.setState('approved')
    props.onComplete()
  }

  return {
    icon: CheckmarkIcon,
    label: 'Promote',
    onHandle,
  }
}
