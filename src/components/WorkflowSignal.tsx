import {useEffect} from 'react'
import {ObjectInputProps} from 'sanity'

import {useWorkflowContext} from './WorkflowContext'

// This component is loaded at the root level of the Document Form
// It is used to signal the document ID to the WorkflowProvider
export default function WorkflowSignal(props: ObjectInputProps) {
  const documentId = props?.value?._id
    ? props.value._id.replace(`drafts.`, ``)
    : null

  const {addId, removeId} = useWorkflowContext()

  useEffect(() => {
    // On mount, add  to the query of listening documents
    if (documentId) {
      addId(documentId)
    }

    // On unmount, remove from the query of listening documents
    return () => {
      if (documentId) {
        removeId(documentId)
      }
    }
  }, [documentId, addId, removeId])

  return props.renderDefault(props)
}
