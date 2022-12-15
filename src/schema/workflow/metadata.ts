import {
  defineType,
  defineField,
  // SchemaTypeDefinition
} from 'sanity'

// import UserSelectInput from '../../components/UserSelectInput'
import {State} from '../../types'

export default (states: State[]) =>
  defineType({
    type: 'document',
    name: 'workflow.metadata',
    title: 'Workflow metadata',
    liveEdit: true,
    fields: [
      defineField({
        name: 'state',
        type: 'string',
        options: {
          list: states.map((state) => ({
            value: state.id,
            title: state.title,
          })),
        },
      }),
      defineField({
        name: 'documentId',
        title: 'Document ID',
        type: 'string',
        readOnly: true,
      }),
      defineField({
        type: 'array',
        name: 'assignees',
        description: 'The people who are assigned to move this further in the workflow.',
        of: [{type: 'string'}],
        // components: {input: UserSelectInput},
      }),
    ],
  })
