import { BoxIcon, MoonIcon } from 'lucide-react'
import { money } from '@/lib/format'
import { earnedLast24h, ratePerHour } from '../bot-model'
import { bedScene } from '../bed-scene'
import { payoutAddOn } from '../payout-settings'
import { spawnerSettings } from '../spawner-settings'
import { spawnerScene } from '../spawner-scene'
import { stealthAddOn } from '../stealth-settings'
import { SpawnersPanels } from './spawners/panels'
import { SpawnersSummary } from './spawners/summary'

export const NO_JOB = { icon: MoonIcon, name: 'No job', hint: 'Stays online and does nothing', art: { scene: bedScene } }

const moduleViews = {
  spawners: {
    Summary: SpawnersSummary,
    Panels: SpawnersPanels,
    icon: BoxIcon,
    hint: 'Farm bones and sell them',
    art: { scene: spawnerScene },
    cardStats: state => [
      { label: 'Last 24h', value: money(earnedLast24h(state)) },
      { label: 'Per hour', value: money(ratePerHour(state)) }
    ]
  }
}

const moduleSettings = {
  spawners: spawnerSettings,
  payout: payoutAddOn,
  stealth: stealthAddOn
}

export function settingsFor (id) {
  return moduleSettings[id] ?? null
}

export function viewFor (id) {
  return moduleViews[id] ?? null
}

export function viewsForModules (ids = []) {
  return ids.filter(id => moduleViews[id]).map(id => ({ id, ...moduleViews[id] }))
}
