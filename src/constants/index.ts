import {WorkflowConfig, defineStates} from '../types'

export const API_VERSION = `2023-01-01`

export const ORDER_MAX = 100000
export const ORDER_MIN = 10000

export const DEFAULT_CONFIG: WorkflowConfig = {
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
      requireAssignment: true,
      transitions: ['changesRequested'],
    },
  ]),
}
