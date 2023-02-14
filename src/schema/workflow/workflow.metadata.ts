import {defineType, defineField} from 'sanity'
import Field from '../../components/DocumentCard/Field'
import UserAssignmentInput from '../../components/UserAssignmentInput'
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
        description: `The current "State" of the document. Field is read only as changing it would not fire the state's "operation" setting. These are fired in the Document Actions and in the custom Tool.`,
        readOnly: true,
        type: 'string',
        options: {
          list: states.length
            ? states.map((state) => ({
                value: state.id,
                title: state.title,
              }))
            : [],
          layout: 'radio',
        },
      }),
      defineField({
        name: 'documentId',
        title: 'Document ID',
        description:
          'Used to help identify the target document that this metadata is tracking state for.',
        type: 'string',
        readOnly: true,
        components: {
          input: Field,
        },
      }),
      defineField({
        name: 'order',
        description: 'Used to maintain order position of cards in the Tool.',
        type: 'number',
        readOnly: true,
      }),
      defineField({
        type: 'array',
        name: 'assignees',
        of: [{type: 'string'}],
        components: {
          input: UserAssignmentInput,
        },
      }),
    ],
  })
