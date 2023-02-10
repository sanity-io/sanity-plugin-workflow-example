import {defineType, defineField, defineArrayMember} from 'sanity'
// import UserSelectInput from '../../components/UserSelectInput'
import {State} from '../../types'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
          list: states.length
            ? states.map((state) => ({
                value: state.id,
                title: state.title,
              }))
            : [],
        },
      }),
      defineField({
        name: 'documentId',
        title: 'Document ID',
        type: 'string',
        readOnly: true,
      }),
      defineField({
        name: 'order',
        type: 'number',
        readOnly: true,
      }),
      defineField({
        type: 'array',
        name: 'assignees',
        description: 'The people who are assigned to move this further in the workflow.',
        of: [defineArrayMember({type: 'string'})],
        // components: {input: UserSelectInput},
      }),
    ],
  })
