import {definePlugin} from 'sanity'
import {CheckmarkIcon, SplitVerticalIcon} from '@sanity/icons'

import WorkflowTool from './components/WorkflowTool'
import {WorkflowConfig} from './types'
import metadata from './schema/workflow/metadata'
import {StateBadge} from './badges'
import {PromoteAction} from './actions/PromoteAction'
import {DemoteAction} from './actions/DemoteAction'
import StateTimeline from './components/StateTimeline'

const DEFAULT_CONFIG: WorkflowConfig = {
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
      id: 'published',
      title: 'Published',
      operation: 'publish',
      color: 'success',
    },
  ],
}

export const workflow = definePlugin<WorkflowConfig>((config = DEFAULT_CONFIG) => {
  const {schemaTypes, states} = {...DEFAULT_CONFIG, ...config}

  if (!states?.length) {
    throw new Error(`Workflow: Missing states in config`)
  }

  return {
    name: 'sanity-plugin-workflow',
    schema: {
      types: [metadata(states)],
    },
    // form: {
    //   components: {
    //     item: (props) => {
    //       console.log(props)
    //       // if (props.id === `root` && schemaTypes.includes(props.schemaType.name)) {
    //       //   return StateTimeline(props)
    //       // }
    //       return props.renderDefault(props)
    //     },
    //   },
    // },
    document: {
      actions: (prev, context) => {
        if (!schemaTypes.includes(context.schemaType)) {
          return prev
        }

        return [
          (props) => PromoteAction(props, states),
          (props) => DemoteAction(props, states),
          ...prev,
        ]
      },
      badges: (prev, context) => {
        if (!schemaTypes.includes(context.schemaType)) {
          return prev
        }

        return [(props) => StateBadge(props, states), ...prev]
      },
    },
    tools: [
      {
        name: 'workflow',
        title: 'Workflow',
        component: WorkflowTool,
        icon: SplitVerticalIcon,
        options: {schemaTypes, states},
      },
    ],
  }
})
