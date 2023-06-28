import api from '@/client/api'
import Label from './label'
import TextInput from './textInput'

export default function TestDataPane({
  variables,
  inputValues,
  setInputValues,
}: {
  variables: string[]
  inputValues: { [key: string]: string[] }
  setInputValues: (inputValues: { [key: string]: string[] }) => void
}) {
  return (
    <>
      {variables.map((variable, index) => (
        <div key={index} className='flex gap-2'>
          <Label htmlFor={variable} className='flex-1'>
            {variable}
          </Label>
          {(inputValues[variable] ?? ['']).map((value, index) => (
            <TextInput
              value={value}
              setValue={value =>
                setInputValues({
                  ...inputValues,
                  [variable]: [
                    ...(inputValues[variable] ?? []).slice(0, index),
                    value,
                    ...(inputValues[variable] ?? []).slice(index + 1),
                  ],
                })
              }
              id={variable}
            />
          ))}
        </div>
      ))}
    </>
  )
}
