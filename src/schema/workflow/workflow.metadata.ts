import {defineField, defineType} from 'sanity'

import Field from '../../components/DocumentCard/Field'
import UserAssignmentInput from '../../components/UserAssignmentInput'
import {API_VERSION} from '../../constants'
import initialRank from '../../helpers/initialRank'
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
        name: 'orderRank',
        description: 'Used to maintain order position of cards in the Tool.',
        type: 'string',
        readOnly: true,
        initialValue: async (p, {getClient}) => {
          const lastDocOrderRank = await getClient({
            apiVersion: API_VERSION,
          }).fetch(`*[_type == $type]|order(@[$order] desc)[0][$order]`, {
            order: `orderRank`,
            type: `workflow.metadata`,
          })

          return initialRank(lastDocOrderRank)
        },
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
