import { withLoggedInSession } from '@/src/server/session'
import ClientRoute, { Redirect } from '@/src/common/clientRoute'
import Button from '@/components/button'
import { ReactNode, useState } from 'react'

export const getServerSideProps = withLoggedInSession(async ({ user }) =>
  user.didCompleteOnboarding ? Redirect(ClientRoute.Home) : { props: {} }
)

type OnboardingResponse = {
  useCase: {
    iteration: boolean
    testing: boolean
    collaboration: boolean
    monitoring: boolean
    deploying: boolean
    feedback: boolean
  }
  role?: 'executive' | 'manager' | 'individual' | 'contractor'
  area: {
    product: boolean
    engineering: boolean
    marketing: boolean
    content: boolean
    design: boolean
    sales: boolean
  }
}

const emptyUseCase: OnboardingResponse['useCase'] = {
  iteration: false,
  testing: false,
  collaboration: false,
  monitoring: false,
  deploying: false,
  feedback: false,
}

const emptyArea: OnboardingResponse['area'] = {
  product: false,
  engineering: false,
  marketing: false,
  content: false,
  design: false,
  sales: false,
}

export default function Onboarding() {
  const [response, setResponse] = useState<OnboardingResponse>({ useCase: emptyUseCase, area: emptyArea })

  const [step, setStep] = useState<'useCase' | 'role' | 'area'>('useCase')

  return (
    <main className='flex items-center justify-center h-screen p-10 text-gray-700 bg-gray-25'>
      {step === 'useCase' && (
        <UseCaseStep response={response} setResponse={setResponse} onNextStep={() => setStep('role')} />
      )}
      {step === 'role' && <RoleStep response={response} setResponse={setResponse} onNextStep={() => setStep('area')} />}
      {step === 'area' && <AreaStep response={response} setResponse={setResponse} onNextStep={() => {}} />}
    </main>
  )
}

const OnboardingStep = ({
  title,
  subtitle = 'Help us personalise your experience',
  isValid,
  onNextStep,
  children,
}: {
  title: string
  subtitle?: string
  isValid: boolean
  onNextStep: () => void
  children: ReactNode
}) => (
  <div className='flex flex-col w-full gap-1 p-6 bg-white shadow rounded-lg border border-gray-200 max-w-[536px]'>
    <span className='text-2xl font-bold tracking-tight'>{title}</span>
    <span className='text-xl pb-7'>{subtitle}</span>
    <div className='flex flex-col gap-4 text-base'>{children}</div>
    <div className='self-end pt-4'>
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
  const [otherUseCase, setOtherUseCase] = useState<string>('')
  const useCase = response.useCase
  const setUseCase = (useCase: OnboardingResponse['useCase']) => setResponse({ ...response, useCase })
  const isValidUseCase = Object.values(useCase).some(u => u) || otherUseCase.trim() !== ''

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
      <OptionCheckbox title='Deploying LLM API endpoints' value={useCase} setValue={setUseCase} valueKey='deploying' />
      <OptionCheckbox
        title='Create a feedback loop to improve my prompt'
        value={useCase}
        setValue={setUseCase}
        valueKey='feedback'
      />
    </OnboardingStep>
  )
}

const RoleStep = ({
  response,
  setResponse,
  onNextStep,
}: {
  response: OnboardingResponse
  setResponse: (response: OnboardingResponse) => void
  onNextStep: () => void
}) => {
  const role = response.role
  const setRole = (role: OnboardingResponse['role']) => setResponse({ ...response, role })
  const isValidRole = role !== undefined

  return (
    <OnboardingStep title='What is your role?' isValid={isValidRole} onNextStep={onNextStep}>
      <RoleOption title='Executive' value={role} setValue={setRole} role='executive' />
      <RoleOption title='Management' value={role} setValue={setRole} role='manager' />
      <RoleOption title='Individual Contributor' value={role} setValue={setRole} role='individual' />
      <RoleOption title='Freelance or Contractor' value={role} setValue={setRole} role='contractor' />
    </OnboardingStep>
  )
}

const AreaStep = ({
  response,
  setResponse,
  onNextStep,
}: {
  response: OnboardingResponse
  setResponse: (response: OnboardingResponse) => void
  onNextStep: () => void
}) => {
  const [otherArea, setOtherArea] = useState<string>('')
  const area = response.area
  const setArea = (area: OnboardingResponse['area']) => setResponse({ ...response, area })
  const isValidArea = Object.values(area).some(a => a) || otherArea.trim() !== ''

  return (
    <OnboardingStep title='What kind of work do you do?' isValid={isValidArea} onNextStep={onNextStep}>
      <OptionCheckbox title='Product' value={area} setValue={setArea} valueKey='product' />
      <OptionCheckbox title='Engineering' value={area} setValue={setArea} valueKey='engineering' />
      <OptionCheckbox title='Marketing' value={area} setValue={setArea} valueKey='marketing' />
      <OptionCheckbox title='Content Strategy' value={area} setValue={setArea} valueKey='content' />
      <OptionCheckbox title='Design' value={area} setValue={setArea} valueKey='design' />
      <OptionCheckbox title='Sales' value={area} setValue={setArea} valueKey='sales' />
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
}) => {
  return (
    <div className='flex items-center gap-3'>
      <input
        type='checkbox'
        className='w-5 h-5 cursor-pointer'
        id={valueKey?.toString()}
        checked={value[valueKey]}
        onChange={() => setValue({ ...value, [valueKey]: !value[valueKey] })}
      />
      <label className='font-medium cursor-pointer' htmlFor={valueKey?.toString()}>
        {title}
      </label>
    </div>
  )
}

const RoleOption = ({
  title,
  value,
  setValue,
  role,
}: {
  title: string
  value: OnboardingResponse['role']
  setValue: (value: OnboardingResponse['role']) => void
  role: OnboardingResponse['role']
}) => {
  return (
    <div className='flex items-center gap-3'>
      <input
        type='radio'
        className='w-5 h-5 cursor-pointer'
        id={value?.toString()}
        checked={role === value}
        onChange={() => setValue(role)}
      />
      <label className='font-medium cursor-pointer' htmlFor={value?.toString()}>
        {title}
      </label>
    </div>
  )
}
