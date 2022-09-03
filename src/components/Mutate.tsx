import React from 'react'
import {Card, useToast} from '@sanity/ui'
import {useDocumentOperation} from 'sanity'
import {State} from '../types'

type MutateProps = {
  _id: string
  _type: string
  state: State
  documentId: string
  onComplete: (id: string) => void
}

export default function Mutate(props: MutateProps) {
  const {_id, _type, documentId, state, onComplete} = props
  const ops = useDocumentOperation(documentId, _type)
  const isDraft = _id.startsWith('drafts.')

  const toast = useToast()

  if (isDraft && state.publish && !ops.publish.disabled) {
    ops.publish.execute()
    onComplete(_id)
    toast.push({
      title: 'Published Document',
      description: documentId,
      status: 'success',
    })
  } else if (!isDraft && state.unpublish && !ops.unpublish.disabled) {
    ops.unpublish.execute()
    onComplete(_id)
    toast.push({
      title: 'Unpublished Document',
      description: documentId,
      status: 'success',
    })
  }

  return null

  //   return (
  //     <Card padding={3} shadow={2} tone="primary">
  //       Mutating: {_id} to {state.title}
  //     </Card>
  //   )
}
