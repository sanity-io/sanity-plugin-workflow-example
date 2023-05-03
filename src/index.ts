import {definePlugin, DocumentActionProps, isObjectInputProps} from 'sanity'

import {AssignWorkflow} from './actions/AssignWorkflow'
import {BeginWorkflow} from './actions/BeginWorkflow'
import {CompleteWorkflow} from './actions/CompleteWorkflow'
import {UpdateWorkflow} from './actions/UpdateWorkflow'
import {AssigneesBadge} from './badges/AssigneesBadge'
import {StateBadge} from './badges/StateBadge'
import {WorkflowProvider} from './components/WorkflowContext'
import WorkflowSignal from './components/WorkflowSignal'
import {DEFAULT_CONFIG} from './constants'
import metadata from './schema/workflow/workflow.metadata'
import {workflowTool} from './tools'
import {WorkflowConfig} from './types'

export const workflow = definePlugin<WorkflowConfig>(
  (config = DEFAULT_CONFIG) => {
    const {schemaTypes, states} = {...DEFAULT_CONFIG, ...config}

    if (!states?.length) {
      throw new Error(`Workflow plugin: Missing "states" in config`)
    }

    if (!schemaTypes?.length) {
      throw new Error(`Workflow plugin: Missing "schemaTypes" in config`)
    }

    return {
      name: 'sanity-plugin-workflow',
      schema: {
        types: [metadata(states)],
      },
      // TODO: Remove 'workflow.metadata' from list of new document types
      // ...
      studio: {
        components: {
          layout: (props) =>
            WorkflowProvider({...props, workflow: {schemaTypes, states}}),
        },
      },
      form: {
        components: {
          input: (props) => {
            if (
              props.id === `root` &&
              isObjectInputProps(props) &&
              schemaTypes.includes(props.schemaType.name)
            ) {
              return WorkflowSignal(props)
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

          return [
            (props) => BeginWorkflow(props),
            (props) => AssignWorkflow(props),
            ...states.map(
              (state) => (props: DocumentActionProps) =>
                UpdateWorkflow(props, state)
            ),
            (props) => CompleteWorkflow(props),
            ...prev,
          ]
        },
        badges: (prev, context) => {
          if (!schemaTypes.includes(context.schemaType)) {
            return prev
          }

          const {documentId, currentUser} = context

          if (!documentId) {
            return prev
          }

          return [
            () => StateBadge(documentId),
            () => AssigneesBadge(documentId, currentUser),
            ...prev,
          ]
        },
      },
      tools: [
        // TODO: These configs could be read from Context
        workflowTool({schemaTypes, states}),
      ],
    }
  }
)
