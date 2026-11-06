import { Component } from 'react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError (error) {
    return { error }
  }

  componentDidUpdate (previous) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.reset()
  }

  reset = () => this.setState({ error: null })

  render () {
    const { error } = this.state
    return error ? this.props.fallback({ error, reset: this.reset }) : this.props.children
  }
}

export function CrashNotice ({ title, error, children }) {
  return (
    <Empty className='rounded-3xl bg-card py-16'>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className='break-words font-mono text-xs'>{error.message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{children}</EmptyContent>
    </Empty>
  )
}
