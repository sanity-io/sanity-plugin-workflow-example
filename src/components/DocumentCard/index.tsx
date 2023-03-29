/* eslint-disable react/prop-types */
import {DragHandleIcon} from '@sanity/icons'
import {Box, Card, CardTone, Flex, Stack, useTheme} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  SchemaType,
  useSchema,
  ValidationStatus as ValidationStatusType,
} from 'sanity'
import {Preview} from 'sanity'

import {SanityDocumentWithMetadata, State, User} from '../../types'
import UserDisplay from '../UserDisplay'
import CompleteButton from './CompleteButton'
import {DraftStatus} from './core/DraftStatus'
import {PublishedStatus} from './core/PublishedStatus'
import EditButton from './EditButton'
import Validate from './Validate'
import {ValidationStatus} from './ValidationStatus'

type DocumentCardProps = {
  isDragDisabled: boolean
  userRoleCanDrop: boolean
  isDragging: boolean
  item: SanityDocumentWithMetadata
  states: State[]
  toggleInvalidDocumentId: (
    documentId: string,
    action: 'ADD' | 'REMOVE'
  ) => void
  userList: User[]
}

export function DocumentCard(props: DocumentCardProps) {
  const {
    isDragDisabled,
    userRoleCanDrop,
    isDragging,
    item,
    states,
    toggleInvalidDocumentId,
    userList,
  } = props
  const {assignees = [], documentId} = item._metadata ?? {}
  const schema = useSchema()
  const state = states.find((s) => s.id === item._metadata?.state)

  // Perform document operations after State changes
  // If State has changed and the document needs to be un/published
  // This functionality was deemed too dangerous / unexpected
  // Revisit with improved UX
  // const currentState = useMemo(
  //   () => states.find((state) => state.id === item._metadata?.state),
  //   [states, item]
  // )
  // const ops = useDocumentOperation(documentId ?? ``, item._type)
  // const toast = useToast()

  // useEffect(() => {
  //   const isDraft = item._id.startsWith('drafts.')

  //   if (isDraft && currentState?.operation === 'publish' && !item?._metadata?.optimistic) {
  //     if (!ops.publish.disabled) {
  //       ops.publish.execute()
  //       toast.push({
  //         title: 'Published Document',
  //         description: documentId,
  //         status: 'success',
  //       })
  //     }
  //   } else if (
  //     !isDraft &&
  //     currentState?.operation === 'unpublish' &&
  //     !item?._metadata?.optimistic
  //   ) {
  //     if (!ops.unpublish.disabled) {
  //       ops.unpublish.execute()
  //       toast.push({
  //         title: 'Unpublished Document',
  //         description: documentId,
  //         status: 'success',
  //       })
  //     }
  //   }
  // }, [currentState, documentId, item, ops, toast])

  const isDarkMode = useTheme().sanity.color.dark
  const defaultCardTone = isDarkMode ? `transparent` : `default`

  // Validation only runs if the state requests it
  // Because it's not performant to run it on many documents simultaneously
  // So we fake it here, and maybe set it inside <Validate />
  const [optimisticValidation, setOptimisticValidation] =
    useState<ValidationStatusType>({
      isValidating: state?.requireValidation ?? false,
      validation: [],
    })

  const {isValidating, validation} = optimisticValidation

  const handleValidation = useCallback((updates: ValidationStatusType) => {
    setOptimisticValidation(updates)
  }, [])

  const cardTone = useMemo(() => {
    let tone: CardTone = defaultCardTone

    if (!userRoleCanDrop) return isDarkMode ? `default` : `transparent`
    if (!documentId) return tone
    if (isDragging) tone = `positive`

    if (state?.requireValidation && !isValidating && validation.length > 0) {
      if (validation.some((v) => v.level === 'error')) {
        tone = `critical`
      } else {
        tone = `caution`
      }
    }

    return tone
  }, [
    defaultCardTone,
    userRoleCanDrop,
    isDarkMode,
    documentId,
    isDragging,
    isValidating,
    validation,
    state?.requireValidation,
  ])

  // Update validation status
  // Cannot be done in the above memo because it would set state during render
  useEffect(() => {
    if (!isValidating && validation.length > 0) {
      if (validation.some((v) => v.level === 'error')) {
        toggleInvalidDocumentId(documentId, 'ADD')
      } else {
        toggleInvalidDocumentId(documentId, 'REMOVE')
      }
    } else {
      toggleInvalidDocumentId(documentId, 'REMOVE')
    }
  }, [documentId, isValidating, toggleInvalidDocumentId, validation])

  const hasError = useMemo(
    () => (isValidating ? false : validation.some((v) => v.level === 'error')),
    [isValidating, validation]
  )

  const isLastState = useMemo(
    () => states[states.length - 1].id === item._metadata?.state,
    [states, item._metadata.state]
  )

  return (
    <>
      {state?.requireValidation ? (
        <Validate
          documentId={documentId}
          type={item._type}
          onChange={handleValidation}
        />
      ) : null}
      <Box paddingBottom={3} paddingX={3}>
        <Card radius={2} shadow={isDragging ? 3 : 1} tone={cardTone}>
          <Stack>
            <Card
              borderBottom
              radius={2}
              padding={3}
              paddingLeft={2}
              tone={cardTone}
              style={{pointerEvents: 'none'}}
            >
              <Flex align="center" justify="space-between" gap={1}>
                <Box flex={1}>
                  <Preview
                    layout="default"
                    value={item}
                    schemaType={schema.get(item._type) as SchemaType}
                  />
                </Box>
                <Box style={{flexShrink: 0}}>
                  {hasError || isDragDisabled ? null : <DragHandleIcon />}
                </Box>
              </Flex>
            </Card>

            <Card padding={2} radius={2} tone="inherit">
              <Flex align="center" justify="space-between" gap={3}>
                <Box flex={1}>
                  {documentId && (
                    <UserDisplay
                      userList={userList}
                      assignees={assignees}
                      documentId={documentId}
                      disabled={!userRoleCanDrop}
                    />
                  )}
                </Box>
                {validation.length > 0 ? (
                  <ValidationStatus validation={validation} />
                ) : null}
                <DraftStatus document={item} />
                <PublishedStatus document={item} />
                <EditButton
                  id={item._id}
                  type={item._type}
                  disabled={!userRoleCanDrop}
                />
                {isLastState ? (
                  <CompleteButton
                    documentId={documentId}
                    disabled={!userRoleCanDrop}
                  />
                ) : null}
              </Flex>
            </Card>
          </Stack>
        </Card>
      </Box>
    </>
  )
}
