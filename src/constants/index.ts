import {CheckmarkIcon} from '@sanity/icons'

import {WorkflowConfig} from '../types'

export const API_VERSION = `2023-01-01`

export const ORDER_MAX = 100000
export const ORDER_MIN = 10000

export const DEFAULT_CONFIG: WorkflowConfig = {
  schemaTypes: [],
  states: [
    {id: 'draft', title: 'Draft', operation: 'unpublish'},
    {id: 'inReview', title: 'In review', operation: null, color: 'primary'},
    {
      id: 'approved',
      title: 'Approved',
      operation: null,
      color: 'success',
      icon: CheckmarkIcon,
    },
    {
      id: 'changesRequested',
      title: 'Changes requested',
      operation: null,
      color: 'warning',
    },
    {
      id: 'live',
      title: 'Live',
      operation: 'publish',
      color: 'success',
    },
  ],
}
