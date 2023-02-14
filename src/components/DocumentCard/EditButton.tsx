import {Button} from '@sanity/ui'
import {EditIcon} from '@sanity/icons'
import {useRouter} from 'sanity/router'

type EditButtonProps = {
  id: string
  type: string
  disabled?: boolean
}

export default function EditButton(props: EditButtonProps) {
  const {id, type, disabled = false} = props
  const {navigateIntent} = useRouter()

  return (
    <Button
      // eslint-disable-next-line react/jsx-no-bind
      onClick={() => navigateIntent('edit', {id, type})}
      mode="ghost"
      fontSize={1}
      padding={2}
      tabIndex={-1}
      icon={EditIcon}
      text="Edit"
      disabled={disabled}
    />
  )
}
