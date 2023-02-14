import {definePlugin} from 'sanity'

import StateTimeline, {StateTimelineProps} from './components/StateTimeline'
import {DEFAULT_CONFIG} from './constants'
import {DemoteAction} from './actions/DemoteAction'
import {PromoteAction} from './actions/PromoteAction'
import {StateBadge} from './badges'
import {WorkflowConfig} from './types'
import {workflowTool} from './tools'
import metadata from './schema/workflow/workflow.metadata'
import {AssignAction} from './actions/AssignAction'

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
    form: {
      components: {
        input: (props) => {
          if (
            props?.schemaType?.type?.name === 'document' &&
            schemaTypes.includes(props.schemaType.name)
          ) {
            const newProps = {...props, states}

            // TODO: Fix this type
            return StateTimeline(newProps as StateTimelineProps)
          }
          return props.renderDefault(props)
        },
      },
    },
    document: {
      actions: (prev, context) => {
        if (!schemaTypes.includes(context.schemaType)) {
          return prev
        }

        let filtered = prev

        // If any workflow states make use of un/publish operations...
        if (states.some((state) => state.operation)) {
          // ...remove 'discard changes' and 'publish' actions
          filtered = prev.filter(({action}) => action && !['publish', 'unpublish'].includes(action))
        }

        return [
          (props) => AssignAction(props, states),
          (props) => PromoteAction(props, states),
          (props) => DemoteAction(props, states),
          ...filtered,
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
