import {WorkflowConfig} from '../types'

export const API_VERSION = `2023-01-01`

export const ORDER_MAX = 100000
export const ORDER_MIN = 10000

export const DEFAULT_CONFIG: WorkflowConfig = {
  schemaTypes: [],
  states: [
    {
      id: 'staged',
      title: 'Staged',
      operation: 'unpublish',
      roles: ['editor', 'administrator'],
    },
    {
      id: 'inReview',
      title: 'In review',
      color: 'primary',
      roles: ['editor', 'administrator'],
    },
    {
      id: 'changesRequested',
      title: 'Changes requested',
      color: 'warning',
      roles: ['editor', 'administrator'],
    },
    {
      id: 'approved',
      title: 'Approved',
      color: 'success',
      roles: ['administrator'],
    },
    {
      id: 'released',
      title: 'Released',
      operation: 'publish',
      color: 'success',
      roles: ['administrator'],
      requireAssignment: true,
    },
  ],
}
