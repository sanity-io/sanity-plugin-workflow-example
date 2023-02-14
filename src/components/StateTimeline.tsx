import {Button, Card, Text, Inline, Stack, useToast} from '@sanity/ui'
import React, {useEffect} from 'react'
import {ObjectInputProps, SanityDocument, useClient} from 'sanity'

import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {State} from '../types'
import {API_VERSION} from '../constants'

export type StateTimelineProps = ObjectInputProps<SanityDocument> & {
  states: State[]
}

export default function StateTimeline(props: StateTimelineProps) {
  const {value, states} = props

  const documentId = String(value?._id)

  const {data, loading, error} = useWorkflowMetadata(documentId, states)
  const {state} = data
  const [mutatingToState, setMutatingToState] = React.useState<string | null>(null)

  const client = useClient({apiVersion: API_VERSION})
  const toast = useToast()

  // Just because the document is patched ...
  // doesn't mean the latest data has been returned from the listener
  useEffect(() => {
    if (data) {
      setMutatingToState(null)
    }
  }, [data])

  const changeState = React.useCallback(
    (publishedId: string, newState: State) => {
      setMutatingToState(newState.id)

      client
        .patch(`workflow-metadata.${publishedId}`)
        .set({state: newState.id})
        .commit()
        .then(() => {
          toast.push({
            status: 'success',
            title: `Document moved to ${newState.title}`,
          })
        })
        .catch((err) => {
          console.error(err)
          toast.push({
            status: 'error',
            title: `Document moved failed`,
          })
        })
    },
    [client, toast]
  )

  return (
    <Stack space={5}>
      <Stack space={3}>
        <Text weight="medium" size={1}>
          Workflow State
        </Text>
        <Card padding={1} radius={3} border tone="primary">
          <Inline space={1}>
            {states.map((s) => (
              <Button
                disabled={loading || error || Boolean(mutatingToState)}
                fontSize={1}
                tone="primary"
                mode={
                  (!mutatingToState && s.id === state?.id) || s.id === mutatingToState
                    ? `default`
                    : `ghost`
                }
                key={s.id}
                text={s.title}
                radius={2}
                onClick={() => changeState(documentId, s)}
              />
            ))}
          </Inline>
        </Card>
      </Stack>
      {props.renderDefault(props)}
    </Stack>
  )
}
