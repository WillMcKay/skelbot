import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useLiveData } from '@/hooks/use-live-data'
import { botsApi } from '@/lib/api'
import { BotDialog, BotIdentity, DIALOG_BUTTON, DialogStep, FormError, FULL_WIDTH } from './bot-dialog'
import { BotModuleSelector, jobIn } from './bot-module-selector'
import { AddOnList, initialSettings, settingsProblem, settingsRequest } from './add-ons'
import { NEW_SERVER, ServerFields, serverProblem, serverRequest } from './server-settings'
import { SignInBox, useSignIn } from './sign-in'

const STEPS = 4

function SignInStep ({ signIn, onDone }) {
  const { state, pending, starting, done, start } = signIn

  const submit = e => {
    e.preventDefault()
    if (done) onDone()
    else start()
  }

  return (
    <form onSubmit={submit} className='flex flex-col gap-4'>
      {state && <SignInBox state={state} />}
      <div className='flex flex-col gap-2'>
        <Button type='submit' className={FULL_WIDTH} disabled={pending} loading={starting}>
          {pending
            ? <><Spinner className='size-4' />Waiting for sign-in…</>
            : done ? 'Continue' : state?.status === 'error' ? 'Try again' : 'Sign in with Microsoft'}
        </Button>
        {done && <Button type='button' variant='ghost' className={FULL_WIDTH} onClick={start}>Use a different account</Button>}
      </div>
    </form>
  )
}

function ServerStep ({ value, onChange, onDone }) {
  function submit (e) {
    e.preventDefault()
    if (!serverProblem(value)) onDone()
  }

  return (
    <form onSubmit={submit} noValidate className='flex flex-col gap-4'>
      <ServerFields value={value} onChange={onChange} />
      <div className='flex justify-end'>
        <Button type='submit' className={DIALOG_BUTTON} disabled={Boolean(serverProblem(value))}>Next</Button>
      </div>
    </form>
  )
}

function SetupSteps ({ signInId, server, part, onPartChange, modules, selectedModules, onModulesChange, onBack, onCreated }) {
  const [addOnValues, setAddOnValues] = useState(() => initialSettings(modules))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit (e) {
    e.preventDefault()

    if (part === 1) return onPartChange(2)

    setBusy(true)
    setError(null)
    try {
      onCreated(await botsApi.create({
        signIn: signInId,
        ...serverRequest(server),
        ...settingsRequest(addOnValues),
        modules: selectedModules,
        start: false
      }))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className='flex min-h-[23rem] flex-col gap-5'>
      {part === 1
        ? (
          <>
            <DialogStep title='Choose a job' detail='Pick what this bot does.' />
            <BotModuleSelector modules={modules} selected={selectedModules} onChange={onModulesChange} values={addOnValues} onValuesChange={setAddOnValues} />
          </>
          )
        : (
          <>
            <DialogStep title='Add-ons' detail='Extras that run alongside the job.' />
            <AddOnList modules={modules} selected={selectedModules} onSelectedChange={onModulesChange} values={addOnValues} onValuesChange={setAddOnValues} />
          </>
          )}
      {error && <FormError>{error}</FormError>}
      <div className='mt-auto flex justify-end gap-2'>
        <Button type='button' variant='secondary' className={DIALOG_BUTTON} onClick={part === 1 ? onBack : () => onPartChange(1)}>Back</Button>
        <Button type='submit' className={DIALOG_BUTTON} loading={busy} disabled={settingsProblem(modules, selectedModules, addOnValues)}>{part === 1 ? 'Next' : 'Add bot'}</Button>
      </div>
    </form>
  )
}

function DoneStep ({ bot, modules, onAnother }) {
  const job = jobIn(modules, bot.modules ?? [])
  const payout = (bot.modules ?? []).includes('payout') ? bot.payoutTo : null

  return (
    <div className='flex flex-col gap-5'>
      <BotIdentity name={bot.name} detail='Ready to start' />
      <dl className='flex flex-col gap-2 text-sm'>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted-foreground'>Job</dt>
          <dd className='truncate'>{job?.name ?? 'No job'}</dd>
        </div>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted-foreground'>Auto payout</dt>
          <dd className='truncate'>{payout ?? 'Off'}</dd>
        </div>
      </dl>
      <div className='grid grid-cols-2 gap-2'>
        <Button type='button' variant='outline' className={FULL_WIDTH} onClick={onAnother}>Add another</Button>
        <Button className={FULL_WIDTH} render={<a href={`#/bots/${bot.id}`} />}>Open bot</Button>
      </div>
    </div>
  )
}

export function AddBotDialog () {
  const { rawBots, modules } = useLiveData()
  const signIn = useSignIn()
  const [step, setStep] = useState(0)
  const [part, setPart] = useState(1)
  const [server, setServer] = useState(NEW_SERVER)
  const [saved, setSaved] = useState(null)
  const [selectedModules, setSelectedModules] = useState(null)
  const defaultModules = modules.filter(module => module.enabledByDefault).map(module => module.id)
  const activeModules = selectedModules ?? defaultModules
  const created = saved && (rawBots[saved.id] ?? saved)

  const another = () => {
    setSaved(null)
    setSelectedModules(null)
    signIn.reset()
    setStep(0)
    setPart(1)
    setServer(NEW_SERVER)
  }

  const currentStep = created ? STEPS + 1 : step < 2 ? step + 1 : 2 + part

  return (
    <BotDialog closeTo='' step={currentStep} steps={STEPS}>
      <div className='flex flex-col gap-5 px-6 pt-3 pb-6'>
        {!created && step === 0 && <DialogStep title='Add a bot' detail='Choose where it plays.' />}
        {!created && step === 1 && <DialogStep title='Sign in' detail='Use its Microsoft account.' />}
        <div key={created ? 'done' : step} className='animate-in duration-200 fade-in slide-in-from-right-2'>
          {created
            ? <DoneStep bot={created} modules={modules} onAnother={another} />
            : step === 0
              ? <ServerStep value={server} onChange={setServer} onDone={() => setStep(1)} />
              : step === 1
                ? <SignInStep signIn={signIn} onDone={() => setStep(2)} />
                : <SetupSteps signInId={signIn.state.id} server={server} part={part} onPartChange={setPart} modules={modules} selectedModules={activeModules} onModulesChange={setSelectedModules} onBack={() => setStep(1)} onCreated={setSaved} />}
        </div>
      </div>
    </BotDialog>
  )
}
