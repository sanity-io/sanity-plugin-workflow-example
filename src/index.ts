import {definePlugin} from 'sanity'

import {DEFAULT_CONFIG} from './constants'
import {StateBadge} from './badges'
import {WorkflowConfig} from './types'
import {workflowTool} from './tools'
import metadata from './schema/workflow/workflow.metadata'
import {AssignAction} from './actions/AssignAction'
import {BeginWorkflow} from './actions/BeginWorkflow'

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
    // Removed StateTimeline since the Document Actions can handle the same logic, may revisit
    // form: {
    //   components: {
    //     input: (props) => {
    //       if (
    //         props?.schemaType?.type?.name === 'document' &&
    //         schemaTypes.includes(props.schemaType.name)
    //       ) {
    //         const newProps = {...props, states}
    //         return StateTimeline(newProps as StateTimelineProps)
    //       }
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
          // (props) => UpdateStateAction(props, states, 'promote'),
          (props) => BeginWorkflow(props, states),
          (props) => AssignAction(props, states),
          // (props) => UpdateStateAction(props, states, 'demote'),
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
    tools: [workflowTool({schemaTypes, states})],
  }
})
