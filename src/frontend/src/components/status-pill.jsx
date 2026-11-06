import { StatusBadge } from '@/components/spaceui/status-badge'

const STATUS = { good: 'online', warning: 'away', critical: 'error', neutral: 'offline', info: 'info' }

export function StatusPill ({ tone, label, size = 'sm', className }) {
  return (
    <StatusBadge
      status={STATUS[tone] ?? 'offline'}
      primaryText={label}
      size={size}
      animated={tone === 'good' || tone === 'warning'}
      className={className}
    />
  )
}
