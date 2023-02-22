import React from 'react'
import {Button, useToast} from '@sanity/ui'
import {CheckmarkIcon} from '@sanity/icons'
import {useClient} from 'sanity'

import {API_VERSION} from '../../constants'

type CompleteButtonProps = {
  documentId: string
  disabled: boolean
}

export default function CompleteButton(props: CompleteButtonProps) {
  const {documentId, disabled = false} = props
  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  const handleComplete = React.useCallback(
    (id: string) => {
      client
        .delete(`workflow-metadata.${id}`)
        .then(() => {
          toast.push({
            status: 'success',
            title: 'Workflow completed',
            description: id,
          })
        })
        .catch(() => {
          toast.push({
            status: 'error',
            title: 'Could not complete Workflow',
            description: id,
          })
        })
    },
    [client, toast]
  )

  return (
    <Button
      onClick={() => handleComplete(documentId)}
      text="Complete"
      icon={CheckmarkIcon}
      tone="positive"
      mode="ghost"
      fontSize={1}
      padding={2}
      tabIndex={-1}
      disabled={disabled}
    />
  )
}
