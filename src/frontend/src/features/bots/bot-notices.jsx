import { RotateCcwIcon, CopyIcon, KeyIcon } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { copyCode, signInLink } from './sign-in'

export function SignInNotice ({ code, url }) {
  return (
    <Alert variant='warning' className='rounded-2xl'>
      <KeyIcon aria-hidden='true' />
      <AlertTitle>Sign in with Microsoft to start this bot</AlertTitle>
      <AlertDescription>
        <p>
          Open <a href={signInLink({ url, code })} target='_blank' rel='noreferrer' className='font-medium text-foreground underline underline-offset-4'>{url.replace(/^https?:\/\//, '')}</a> and enter{' '}
          <code className='rounded-md bg-muted px-1.5 py-0.5 font-mono font-semibold text-base text-foreground tracking-widest'>{code}</code>
        </p>
      </AlertDescription>
      <AlertAction>
        <Button variant='outline' size='sm' onClick={() => copyCode(code)}><CopyIcon />Copy code</Button>
      </AlertAction>
    </Alert>
  )
}

export function RestartNotice ({ pending, onRestart }) {
  return (
    <Alert variant='info' className='rounded-2xl'>
      <RotateCcwIcon aria-hidden='true' />
      <AlertTitle>Restart to use the new settings</AlertTitle>
      <AlertDescription>The bot picks up its spawners before it restarts.</AlertDescription>
      <AlertAction>
        <Button variant='outline' size='sm' disabled={pending} onClick={onRestart}>Restart now</Button>
      </AlertAction>
    </Alert>
  )
}
