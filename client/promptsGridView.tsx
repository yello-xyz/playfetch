import { FormatRelativeDate } from '@/common/formatting'
import { Project, Prompt } from '@/types'
import starIcon from '@/public/star.svg'
import filledStarIcon from '@/public/filledStar.svg'
import dotsIcon from '@/public/dots.svg'
import api from './api'
import { useState } from 'react'
import PopupMenu, { PopupMenuItem } from './popupMenu'
import ModalDialog, { DialogPrompt } from './modalDialog'
import PickNameDialog, { PickNamePrompt } from './pickNameDialog'

export default function PromptsGridView({
  projects,
  prompts,
  onAddPrompt,
  onSelect,
  onRefresh,
}: {
  projects: Project[]
  prompts: Prompt[]
  onAddPrompt: () => void
  onSelect: (promptID: number) => void
  onRefresh: () => void
}) {
  const [dialogPrompt, setDialogPrompt] = useState<DialogPrompt>()
  const [pickNamePrompt, setPickNamePrompt] = useState<PickNamePrompt>()
  const [pickProjectPrompt, setPickProjectPrompt] = useState<PickProjectPrompt>()

  return prompts.length ? (
    <>
      <div className='flex flex-wrap gap-6 p-6'>
        {prompts.map((prompt, index) => (
          <PromptCell
            prompt={prompt}
            index={index}
            onSelect={onSelect}
            onRefresh={onRefresh}
            setDialogPrompt={setDialogPrompt}
            setPickNamePrompt={setPickNamePrompt}
            setPickProjectPrompt={projects.length ? setPickProjectPrompt : undefined}
          />
        ))}
      </div>
      <ModalDialog prompt={dialogPrompt} setPrompt={setDialogPrompt} />
      <PickNameDialog prompt={pickNamePrompt} setPrompt={setPickNamePrompt} />
      <PickProjectDialog
        key={pickProjectPrompt?.initialProjectID}
        projects={projects}
        prompt={pickProjectPrompt}
        setPrompt={setPickProjectPrompt}
      />
    </>
  ) : (
    <EmptyGrid onAddPrompt={onAddPrompt} />
  )
}

function EmptyGrid({ onAddPrompt }: { onAddPrompt: () => void }) {
  const AddPromptLink = ({ label }: { label: string }) => (
    <span className='text-gray-500 underline cursor-pointer' onClick={onAddPrompt}>
      {label}
    </span>
  )

  return (
    <div className='flex flex-col items-center justify-center h-full gap-2 p-6 m-6 bg-gray-100 rounded-lg'>
      <span className='text-sm font-medium'>No Prompts</span>
      <span className='text-xs text-center text-gray-400 '>
        Create a <AddPromptLink label={'New Prompt'} /> to get started.
      </span>
    </div>
  )
}

function PromptCell({
  prompt,
  index,
  onSelect,
  onRefresh,
  setDialogPrompt,
  setPickNamePrompt,
  setPickProjectPrompt,
}: {
  prompt: Prompt
  index: number
  onSelect: (promptID: number) => void
  onRefresh: () => void
  setDialogPrompt: (prompt: DialogPrompt) => void
  setPickNamePrompt: (prompt: PickNamePrompt) => void
  setPickProjectPrompt?: (prompt: PickProjectPrompt) => void
}) {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  const deletePrompt = () => {
    setDialogPrompt({
      message: 'Are you sure you want to delete this prompt? This action cannot be undone.',
      callback: () => api.deletePrompt(prompt.id).then(onRefresh),
      destructive: true,
    })
  }

  const renamePrompt = () => {
    setPickNamePrompt({
      title: 'Rename Prompt',
      label: 'Name',
      callback: (name: string) => api.renamePrompt(prompt.id, name).then(onRefresh),
      initialName: prompt.name,
    })
  }

  const movePrompt = () => {
    setPickProjectPrompt!({
      callback: (projectID: number) => api.movePrompt(prompt.id, projectID).then(onRefresh),
      initialProjectID: prompt.projectID,
    })
  }

  return (
    <div
      key={index}
      className={`flex flex-col gap-1 p-4 border border-gray-300 rounded-lg cursor-pointer w-96 h-60`}
      onClick={() => onSelect(prompt.id)}>
      <div className='flex items-start justify-between gap-2'>
        <span className='flex-1 text-sm font-medium line-clamp-2'>{prompt.name}</span>
        <div className='relative flex'>
          <IconButton
            icon={prompt.favorited ? filledStarIcon.src : starIcon.src}
            onClick={() => api.toggleFavorite(prompt.id, !prompt.favorited).then(onRefresh)}
          />
          <IconButton icon={dotsIcon.src} onClick={() => setIsMenuExpanded(!isMenuExpanded)} />
          {isMenuExpanded && (
            <div className='absolute right-0 top-7'>
              <PopupMenu expanded={isMenuExpanded} collapse={() => setIsMenuExpanded(false)}>
                <PopupMenuItem title='Rename' callback={renamePrompt} />
                {setPickProjectPrompt && <PopupMenuItem title='Move to Project' callback={movePrompt} />}
                <PopupMenuItem separated destructive title='Delete' callback={deletePrompt} />
              </PopupMenu>
            </div>
          )}
        </div>
      </div>
      <span className='text-xs text-gray-500'>Edited {FormatRelativeDate(prompt.timestamp)}</span>
      <span className='mt-3 text-xs text-gray-500 line-clamp-[9]'>{prompt.prompt}</span>
    </div>
  )
}

const IconButton = ({ icon, onClick }: { icon: string; onClick: () => void }) => (
  <img
    className='w-6 h-6 rounded cursor-pointer hover:bg-gray-100'
    src={icon}
    onClick={event => {
      event.stopPropagation()
      onClick()
    }}
  />
)

type PickProjectPrompt = {
  callback: (projectID: number) => void
  initialProjectID: number | null
}

function PickProjectDialog({
  projects,
  prompt,
  setPrompt,
}: {
  projects: Project[]
  prompt?: PickProjectPrompt
  setPrompt: (prompt?: PickProjectPrompt) => void
}) {
  const [projectID, setProjectID] = useState<number | null>(prompt?.initialProjectID ?? null)

  const dialogPrompt = prompt
    ? {
        message: 'Move Prompt to Project',
        callback: () => prompt.callback(projectID!),
        disabled: projectID === prompt.initialProjectID || projectID === null,
      }
    : undefined

  return (
    <ModalDialog prompt={dialogPrompt} setPrompt={() => setPrompt()}>
      <div className='text-sm text-gray-500'>
        <select
          className='w-full p-2 text-sm text-gray-500 border border-gray-300 rounded-md'
          value={projectID?.toString() ?? 0}
          onChange={event => setProjectID(Number(event.target.value))}>
          <option value={0} disabled>
            Select a project
          </option>
          {projects.map((project, index) => (
            <option key={index} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
    </ModalDialog>
  )
}
