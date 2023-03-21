import {definePlugin, DocumentActionProps} from 'sanity'

import {AssignWorkflow} from './actions/AssignWorkflow'
import {BeginWorkflow} from './actions/BeginWorkflow'
import {CompleteWorkflow} from './actions/CompleteWorkflow'
import {UpdateWorkflow} from './actions/UpdateWorkflow'
import {AssigneesBadge} from './badges/AssigneesBadge'
import {StateBadge} from './badges/StateBadge'
import {DEFAULT_CONFIG} from './constants'
import metadata from './schema/workflow/workflow.metadata'
import {workflowTool} from './tools'
import {WorkflowConfig} from './types'

export const workflow = definePlugin<WorkflowConfig>(
  (config = DEFAULT_CONFIG) => {
    const {schemaTypes, states} = {...DEFAULT_CONFIG, ...config}

    if (!states?.length) {
      throw new Error(`Workflow: Missing states in config`)
    }

    return {
      name: 'sanity-plugin-workflow',
      schema: {
        types: [metadata(states)],
      },
      // TODO: Remove 'workflow.metadata' from list of new document types
      // ...
      document: {
        actions: (prev, context) => {
          if (!schemaTypes.includes(context.schemaType)) {
            return prev
          }

          // TODO: Augment 'publish' and 'unpublish' to be disabled if a document IS in Workflow
          // This would be best done with a listening query here, but we don't have access to documentStore

          // TODO: Performance improvements:
          // Each of these actions registers their own listener!
          // One should probably be responsible for listening and storing the response in context

          return [
            (props) => BeginWorkflow(props, states),
            (props) => AssignWorkflow(props, states),
            ...states.map(
              (state) => (props: DocumentActionProps) =>
                UpdateWorkflow(props, states, state)
            ),
            (props) => CompleteWorkflow(props, states),
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
            () => StateBadge(states, documentId),
            () => AssigneesBadge(states, documentId, currentUser),
            ...prev,
          ]
        },
      },
      tools: [workflowTool({schemaTypes, states})],
    }
  }
)
