import {createPlugin} from 'sanity'
import {SplitVerticalIcon} from '@sanity/icons'

import WorkflowTool from './components/WorkflowTool'
import {WorkflowConfig} from './types'
import metadata from './schema/workflow/metadata'

const DEFAULT_CONFIG: WorkflowConfig = {
  schemaTypes: [],
  states: [
    {id: 'draft', title: 'Draft', unpublish: true},
    {id: 'inReview', title: 'In review', unpublish: true},
    {id: 'approved', title: 'Approved', unpublish: true},
    {
      id: 'changesRequested',
      title: 'Changes requested',
      unpublish: true,
    },
    {id: 'published', title: 'Published', publish: true, unpublish: false},
  ],
}

export const workflow = createPlugin<WorkflowConfig>((config = DEFAULT_CONFIG) => {
  const configAndDefaults = {...DEFAULT_CONFIG, ...config}

  return {
    name: 'sanity-plugin-workflow',
    schema: {
      // TODO: Fix the type so that it's conditional but will fallback to a default
      schemaTypes: [
        configAndDefaults?.states?.length ? metadata(configAndDefaults.states) : metadata([]),
      ],
    },
    document: {
      actions: (prev, context) => {
        if (!configAndDefaults.schemaTypes.includes(context.schemaType)) {
          return prev
        }

        return prev
      },
      // prev.map((previousAction) =>
      //   previousAction.action === 'publish' ? MyPublishAction : previousAction
      // ),
    },
    tools: [
      {
        name: 'workflow',
        title: 'Workflow',
        component: WorkflowTool,
        icon: SplitVerticalIcon,
        options: configAndDefaults,
      },
    ],
  }
})
