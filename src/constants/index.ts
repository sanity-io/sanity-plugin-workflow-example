import {defineStates, WorkflowConfig} from '../types'

export const API_VERSION = `2023-01-01`

export const DEFAULT_CONFIG: Required<WorkflowConfig> = {
  schemaTypes: [],
  states: defineStates([
    {
      id: 'inReview',
      title: 'In review',
      color: 'primary',
      roles: ['editor', 'administrator'],
      transitions: ['changesRequested', 'approved'],
    },
    {
      id: 'changesRequested',
      title: 'Changes requested',
      color: 'warning',
      roles: ['editor', 'administrator'],
      transitions: ['approved'],
    },
    {
      id: 'approved',
      title: 'Approved',
      color: 'success',
      roles: ['administrator'],
      transitions: ['changesRequested'],
      requireAssignment: true,
    },
  ]),
}
