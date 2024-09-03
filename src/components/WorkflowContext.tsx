import {useCallback, useContext, useState} from 'react'
import {createContext} from 'react'
import {LayoutProps} from 'sanity'

import {DEFAULT_CONFIG} from '../constants'
import {useWorkflowMetadata} from '../hooks/useWorkflowMetadata'
import {KeyedMetadata, WorkflowConfig} from '../types'

export type WorkflowContextValue = Required<WorkflowConfig> & {
  data: KeyedMetadata
  loading: boolean
  error: boolean | unknown | ProgressEvent
  ids: string[]
  addId: (id: string) => void
  removeId: (id: string) => void
}

const WorkflowContext = createContext<WorkflowContextValue>({
  data: {},
  loading: false,
  error: false,
  ids: [],
  addId: () => null,
  removeId: () => null,
  ...DEFAULT_CONFIG,
})

export function useWorkflowContext(id?: string) {
  const current = useContext(WorkflowContext)

  return {...current, metadata: id ? current.data[id] : null}
}

type WorkflowProviderProps = LayoutProps & {workflow: Required<WorkflowConfig>}

/**
 * This Provider wraps the Studio and provides the workflow context to document actions and badges.
 * This is so individual actions and badges do not need to all register their own listeners.
 * Instead, each document "signals" its ID up to the provider, which then registers a single listener
 * This is performed inside of a component loaded at the root level of the Document Form
 */
export function WorkflowProvider(props: WorkflowProviderProps) {
  const [ids, setIds] = useState<string[]>([])
  const addId = useCallback(
    (id: string) =>
      setIds((current) => (current.includes(id) ? current : [...current, id])),
    []
  )
  const removeId = useCallback(
    (id: string) => setIds((current) => current.filter((i) => i !== id)),
    []
  )
  const {data, loading, error} = useWorkflowMetadata(ids)

  return (
    <WorkflowContext.Provider
      value={{
        data,
        loading,
        error,
        ids,
        addId,
        removeId,
        states: props.workflow.states,
        schemaTypes: props.workflow.schemaTypes,
        filters: props.workflow.filters,
      }}
    >
      {props.renderDefault(props)}
    </WorkflowContext.Provider>
  )
}
