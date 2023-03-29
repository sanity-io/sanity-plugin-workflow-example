import {useEffect} from 'react'
import {useValidationStatus, ValidationStatus} from 'sanity'

type ValidateProps = {
  documentId: string
  type: string
  onChange: (validation: ValidationStatus) => void
}

// Document validation is siloed into its own component
// Because it's not performant to run on a lot of documents
export default function Validate(props: ValidateProps) {
  const {documentId, type, onChange} = props
  const {isValidating, validation = []} = useValidationStatus(documentId, type)

  useEffect(() => {
    onChange({isValidating, validation})
  }, [onChange, isValidating, validation])

  return null
}
