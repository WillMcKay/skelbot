import { useState } from 'react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useAnonymous } from '@/hooks/use-anonymous'
import { navigate } from '@/hooks/use-hash-route'
import { useLiveData } from '@/hooks/use-live-data'
import { botsApi } from '@/lib/api'
import { toast } from '@/lib/toast'
import { BotDialog, BotIdentity, DIALOG_BUTTON, DialogStep, FormError } from './bot-dialog'
import { BotModuleSelector } from './bot-module-selector'
import { isStopped } from './bot-model'
import { ServerFields, serverFrom, serverProblem, serverRequest } from './server-settings'
import { AddOnList, initialSettings, settingsProblem, settingsRequest } from './add-ons'

const STEPS = 3

const sameModules = (a, b) => a.length === b.length && a.every(id => b.includes(id))

export function EditBotDialog ({ bot, rawBot }) {
  const { modules } = useLiveData()
  const { anonymous } = useAnonymous()
  const [step, setStep] = useState(1)
  const [server, setServer] = useState(() => serverFrom(rawBot))
  const [selectedModules, setSelectedModules] = useState(bot.modules ?? [])
  const [initialValues] = useState(() => initialSettings(modules, bot, rawBot))
  const [addOnValues, setAddOnValues] = useState(initialValues)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const stopped = isStopped(bot)

  const changed = JSON.stringify(serverRequest(server)) !== JSON.stringify(serverRequest(serverFrom(rawBot))) ||
    !sameModules(selectedModules, bot.modules ?? []) ||
    JSON.stringify(settingsRequest(addOnValues)) !== JSON.stringify(settingsRequest(initialValues))
  const invalid = settingsProblem(modules, selectedModules, addOnValues)
  const restarts = changed && !stopped

  async function save (e) {
    e.preventDefault()

    if (step < STEPS) return setStep(step + 1)

    setSaving(true)
    setError(null)
    try {
      await botsApi.update(bot.id, { ...serverRequest(server), ...settingsRequest(addOnValues), modules: selectedModules })
      if (restarts) await botsApi.restart(bot.id)
      toast.success(restarts ? 'Restarting' : 'Saved')
      navigate(`bots/${bot.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await botsApi.remove(bot.id)
      navigate('')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <BotDialog closeTo={`bots/${bot.id}`} step={step} steps={STEPS}>
      <form onSubmit={save} noValidate className='flex min-h-[25rem] flex-col gap-5 px-6 pt-3 pb-6'>
        {step === 1 && (
          <>
            <BotIdentity name={bot.name} detail={bot.auth ? 'Sign-in needed' : 'Choose where this bot plays'} />
            <ServerFields value={server} onChange={setServer} />
          </>
        )}
        {step === 2 && (
          <>
            <DialogStep title='Job' detail='Choose what this bot does.' />
            <BotModuleSelector modules={modules} selected={selectedModules} onChange={setSelectedModules} values={addOnValues} onValuesChange={setAddOnValues} />
          </>
        )}
        {step === 3 && (
          <>
            <DialogStep title='Add-ons' detail='Extras that run alongside the job.' />
            <AddOnList modules={modules} selected={selectedModules} onSelectedChange={setSelectedModules} values={addOnValues} onValuesChange={setAddOnValues} masked={anonymous} />
          </>
        )}

        {error && <FormError>{error}</FormError>}

        <div className='mt-auto flex items-center justify-between gap-2'>
          {step === 1
            ? (
              <ConfirmDialog
                title={`Remove ${bot.name}?`}
                description={`Its stats stay on disk in data/bots/${bot.id}.`}
                confirmLabel='Remove'
                onConfirm={remove}
                trigger={(
                  <Button type='button' variant='ghost' className='-ms-3 h-10 rounded-xl text-muted-foreground hover:text-destructive-foreground' disabled={!stopped} title={stopped ? undefined : 'Stop the bot first'}>
                    Remove
                  </Button>
                )}
              />
              )
            : <span />}
          <div className='flex gap-2'>
            {step === 1
              ? <Button type='button' variant='secondary' className={DIALOG_BUTTON} onClick={() => navigate(`bots/${bot.id}`)}>Cancel</Button>
              : <Button type='button' variant='secondary' className={DIALOG_BUTTON} onClick={() => setStep(step - 1)}>Back</Button>}
            {step < STEPS
              ? <Button type='submit' className={DIALOG_BUTTON} disabled={Boolean(serverProblem(server)) || (step === 2 && invalid)}>Next</Button>
              : <Button type='submit' className={DIALOG_BUTTON} loading={saving} disabled={!changed || invalid}>{restarts ? 'Save & restart' : 'Save'}</Button>}
          </div>
        </div>
      </form>
    </BotDialog>
  )
}
