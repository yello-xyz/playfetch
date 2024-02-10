import { withLoggedInSession } from '@/src/server/session'
import ClientRoute, { Redirect } from '@/src/common/clientRoute'
import Button from '@/src/client/components/button'
import { ReactNode, useState } from 'react'
import TextInput from '@/src/client/components/textInput'
import { OnboardingResponse } from '@/types'
import api from '@/src/client/api'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

export const getServerSideProps = withLoggedInSession(async ({ user }) =>
  user.didCompleteOnboarding ? Redirect(ClientRoute.Home) : { props: {} }
)

const emptyUseCase: OnboardingResponse['useCase'] = {
  iteration: false,
  testing: false,
  collaboration: false,
  monitoring: false,
  deployment: false,
  feedback: false,
}

export default function Onboarding() {
  const [response, setResponse] = useState<OnboardingResponse>({ useCase: emptyUseCase })
  const [step, setStep] = useState<'useCase' | 'role' | 'area'>('useCase')

  return (
    <main className='flex items-center justify-center h-screen p-10 text-gray-700 bg-gray-25'>
      {step === 'useCase' && (
        <UseCaseStep response={response} setResponse={setResponse} onNextStep={() => setStep('role')} />
      )}
      {step === 'role' && (
        <RoleStep
          response={response}
          setResponse={setResponse}
          onNextStep={() => setStep('area')}
          onPreviousStep={() => setStep('useCase')}
        />
      )}
      {step === 'area' && (
        <AreaStep response={response} setResponse={setResponse} onPreviousStep={() => setStep('role')} />
      )}
    </main>
  )
}

const OnboardingStep = ({
  title,
  subtitle = 'Help us personalise your experience',
  isValid,
  onNextStep,
  onPreviousStep,
  children,
}: {
  title: string
  subtitle?: string
  isValid: boolean
  onNextStep: () => void
  onPreviousStep?: () => void
  children: ReactNode
}) => (
  <div className='flex flex-col w-full gap-1 p-6 bg-white shadow rounded-lg border border-gray-200 max-w-[536px]'>
    <span className='text-2xl font-bold tracking-tight'>{title}</span>
    <span className='text-xl pb-7'>{subtitle}</span>
    <div className='flex flex-col gap-4 text-base'>{children}</div>
    <div className='flex self-end gap-4 pt-4'>
      {onPreviousStep && (
        <Button type='secondary' onClick={onPreviousStep}>
          Back
        </Button>
      )}
      <Button disabled={!isValid} onClick={onNextStep}>
        Next
      </Button>
    </div>
  </div>
)

const UseCaseStep = ({
  response,
  setResponse,
  onNextStep,
}: {
  response: OnboardingResponse
  setResponse: (response: OnboardingResponse) => void
  onNextStep: () => void
}) => {
  const useCase = response.useCase
  const setUseCase = (useCase: OnboardingResponse['useCase']) => setResponse({ ...response, useCase })
  const otherUseCase = response.otherUseCase
  const setOtherUseCase = (otherUseCase: string | undefined) => setResponse({ ...response, otherUseCase })
  const hasOtherUseCase = otherUseCase !== undefined
  const isValidUseCase = Object.values(useCase).some(u => u) || (hasOtherUseCase && otherUseCase.trim().length > 0)

  return (
    <OnboardingStep
      title='What are you looking to use PlayFetch for?'
      subtitle='Select all that apply.'
      isValid={isValidUseCase}
      onNextStep={onNextStep}>
      <OptionCheckbox title='Prompt iteration' value={useCase} setValue={setUseCase} valueKey='iteration' />
      <OptionCheckbox title='Prompt testing' value={useCase} setValue={setUseCase} valueKey='testing' />
      <OptionCheckbox
        title='Collaborating on prompts with my team'
        value={useCase}
        setValue={setUseCase}
        valueKey='collaboration'
      />
      <OptionCheckbox title='Monitoring LLM requests' value={useCase} setValue={setUseCase} valueKey='monitoring' />
      <OptionCheckbox title='Deploying LLM API endpoints' value={useCase} setValue={setUseCase} valueKey='deployment' />
      <OptionCheckbox
        title='Create a feedback loop to improve my prompt'
        value={useCase}
        setValue={setUseCase}
        valueKey='feedback'
      />
      <Checkbox title='Other' value={hasOtherUseCase} setValue={val => setOtherUseCase(val ? '' : undefined)} />
      {hasOtherUseCase && (
        <TextInput
          value={otherUseCase}
          setValue={setOtherUseCase}
          placeholder='Briefly explain your use case if it’s not listed above.'
        />
      )}
    </OnboardingStep>
  )
}

const RoleStep = ({
  response,
  setResponse,
  onNextStep,
  onPreviousStep,
}: {
  response: OnboardingResponse
  setResponse: (response: OnboardingResponse) => void
  onNextStep: () => void
  onPreviousStep: () => void
}) => {
  const role = response.role
  const setRole = (role: OnboardingResponse['role']) => setResponse({ ...response, role })
  const isValidRole = role !== undefined

  return (
    <OnboardingStep
      title='What is your role?'
      isValid={isValidRole}
      onNextStep={onNextStep}
      onPreviousStep={onPreviousStep}>
      <RadioOption title='Executive' value={role} setValue={setRole} activeValue='executive' />
      <RadioOption title='Management' value={role} setValue={setRole} activeValue='manager' />
      <RadioOption title='Individual Contributor' value={role} setValue={setRole} activeValue='individual' />
      <RadioOption title='Freelance or Contractor' value={role} setValue={setRole} activeValue='contractor' />
    </OnboardingStep>
  )
}

const AreaStep = ({
  response,
  setResponse,
  onPreviousStep,
}: {
  response: OnboardingResponse
  setResponse: (response: OnboardingResponse) => void
  onPreviousStep: () => void
}) => {
  const area = response.area
  const setArea = (area: OnboardingResponse['area']) => setResponse({ ...response, area })
  const setOther = () => setResponse({ ...response, area: undefined, otherArea: '' })
  const otherArea = response.otherArea
  const setOtherArea = (otherArea: string | undefined) => setResponse({ ...response, otherArea })
  const hasOtherArea = area === undefined && otherArea !== undefined
  const isValidArea = area !== undefined || (hasOtherArea && otherArea.trim().length > 0)

  const [isProcessing, setProcessing] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  const completeOnboarding = async () => {
    setProcessing(true)
    await api.completeOnboarding(response)
    await update()
    router.push(ClientRoute.Home)
  }

  return (
    <OnboardingStep
      title='What kind of work do you do?'
      isValid={isValidArea && !isProcessing}
      onNextStep={completeOnboarding}
      onPreviousStep={isProcessing ? undefined : onPreviousStep}>
      <RadioOption title='Product' value={area} setValue={setArea} activeValue='product' />
      <RadioOption title='Engineering' value={area} setValue={setArea} activeValue='engineering' />
      <RadioOption title='Marketing' value={area} setValue={setArea} activeValue='marketing' />
      <RadioOption title='Content Strategy' value={area} setValue={setArea} activeValue='content' />
      <RadioOption title='Design' value={area} setValue={setArea} activeValue='design' />
      <RadioOption title='Sales' value={area} setValue={setArea} activeValue='sales' />
      <RadioOption title='Other' value='other' setValue={setOther} activeValue={area ?? (hasOtherArea ? 'other' : 0)} />
      {hasOtherArea && (
        <TextInput
          value={otherArea}
          setValue={setOtherArea}
          placeholder='Briefly explain the kind of work you do if it’s not listed above.'
        />
      )}
    </OnboardingStep>
  )
}

const OptionCheckbox = <T extends Record<string, boolean>>({
  title,
  value,
  setValue,
  valueKey,
}: {
  title: string
  value: T
  setValue: (value: T) => void
  valueKey: keyof T
}) => <Checkbox title={title} value={value[valueKey]} setValue={val => setValue({ ...value, [valueKey]: val })} />

const appearanceClass =
  'appearance-none w-[17px] h-[17px] border-2 border-transparent outline outline-1 checked:border-white outline-gray-300 checked:bg-blue-500'

const Checkbox = ({
  title,
  value,
  setValue,
}: {
  title: string
  value: boolean
  setValue: (value: boolean) => void
}) => {
  return (
    <div className='flex items-center gap-3'>
      <input
        type='checkbox'
        className={`${appearanceClass} rounded cursor-pointer`}
        id={title}
        checked={value}
        onChange={() => setValue(!value)}
      />
      <label className='font-medium cursor-pointer' htmlFor={title}>
        {title}
      </label>
    </div>
  )
}

const RadioOption = <T,>({
  title,
  value,
  setValue,
  activeValue,
}: {
  title: string
  value: T
  setValue: (value: T) => void
  activeValue: T
}) => (
  <label className='flex items-center gap-3'>
    <input
      type='radio'
      className={`${appearanceClass} rounded-full cursor-pointer`}
      checked={value === activeValue}
      onChange={() => setValue(activeValue)}
    />
    <span className='font-medium cursor-pointer'>{title}</span>
  </label>
)
