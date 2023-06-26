import ClientRoute, { ParseQuery, Redirect } from '@/client/clientRoute'
import { useState } from 'react'
import { Label, TextInput } from 'flowbite-react'
import { PendingButton } from '@/client/button'
import { withLoggedInSession } from '@/server/session'
import api from '@/client/api'
import { useRouter } from 'next/router'
import { getEndpointFromPath } from '@/server/datastore/endpoints'
import { ExtractPromptVariables } from '@/common/formatting'

export const getServerSideProps = withLoggedInSession(async ({ query }) => {
  const { token, project: projectURLPath, endpoint: urlPath } = ParseQuery(query)
  const endpoint = projectURLPath && urlPath ? await getEndpointFromPath(urlPath, projectURLPath, token) : undefined
  if (token && endpoint) {
    return { props: { inputVariables: ExtractPromptVariables(endpoint.prompt) } }
  }
  return Redirect(ClientRoute.Home)
})

export default function UI({ inputVariables }: { inputVariables: string[] }) {
  const router = useRouter()
  const { token, project: projectURLPath, endpoint: urlPath } = ParseQuery(router.query)

  const [output, setOutput] = useState<string>()
  const [inputState, setInputState] = useState<{ [key: string]: string }>({})
  const inputs = Object.fromEntries(inputVariables.map(variable => [variable, inputState[variable] ?? '']))

  const run = async () => {
    if (projectURLPath && urlPath && token) {
      setOutput(undefined)
      api.runTokenizedEndpoint(urlPath, projectURLPath, token, inputs).then(({ output }) => setOutput(output))
    }
  }

  return (
    <div className='flex flex-col gap-2 p-8 max-w-prose'>
      {inputVariables.map((variable, index) => (
        <div key={index} className='flex gap-2'>
          <Label className='flex-1' value={variable} htmlFor={variable} />
          <TextInput
            className='flex-1'
            sizing='sm'
            value={inputState[variable] ?? ''}
            onChange={event => setInputState({ ...inputState, [variable]: event.target.value })}
            id={variable}
            required
          />
        </div>
      ))}
      <div>
        <PendingButton onClick={run}>Test Prompt</PendingButton>
      </div>
      {output && <div className='font-bold text-black'>{output}</div>}
    </div>
  )
}
