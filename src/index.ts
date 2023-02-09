import {definePlugin} from 'sanity'

//import StateTimeline from './components/StateTimeline'
import {DEFAULT_CONFIG} from './constants'
import {DemoteAction} from './actions/DemoteAction'
import {PromoteAction} from './actions/PromoteAction'
import {StateBadge} from './badges'
import {WorkflowConfig} from './types'
import {workflowTool} from './tools'
import metadata from './schema/workflow/workflow.metadata'

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
    tools: [workflowTool({schemaTypes, states})],
  }
})
