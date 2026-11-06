import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LucideProvider } from 'lucide-react'
import '@fontsource-variable/inter'
import { CrashNotice, ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'
import { ToastProvider } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AnonymousProvider } from '@/hooks/use-anonymous'
import { LiveDataProvider } from '@/hooks/use-live-data'
import { followSystemTheme } from '@/lib/theme'
import { toastUncaughtErrors } from '@/lib/toast'
import { App } from './App'
import './index.css'

followSystemTheme()
toastUncaughtErrors()

function AppCrashed ({ error }) {
  return (
    <main className='grid min-h-dvh place-items-center p-4'>
      <CrashNotice title='skelbot hit an error' error={error}>
        <Button className='rounded-full' onClick={() => window.location.reload()}>Reload</Button>
      </CrashNotice>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LucideProvider size={18}>
      <ErrorBoundary fallback={props => <AppCrashed {...props} />}>
        <TooltipProvider>
          <ToastProvider position='bottom-right'>
            <AnonymousProvider>
              <LiveDataProvider>
                <App />
              </LiveDataProvider>
            </AnonymousProvider>
          </ToastProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </LucideProvider>
  </StrictMode>
)
