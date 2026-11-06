const CATALOG_URL = 'https://webisso.github.io/minecraft-item-icons/api.json'
const THUMBNAIL_BASE_URL = 'https://webisso.github.io/minecraft-item-icons/thumbnails'
const ITEM_ICON_OVERRIDES = {
  spawner: `${THUMBNAIL_BASE_URL}/20-blocks/39-admin/spawner.png`,
  monsterspawner: `${THUMBNAIL_BASE_URL}/20-blocks/39-admin/spawner.png`
}

let catalogRequest

function keyOf (value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function iconUrl (entry) {
  const parts = [entry.category_slug, entry.subcategory_slug, entry.file_slug].filter(Boolean)
  return `${THUMBNAIL_BASE_URL}/${parts.map(encodeURIComponent).join('/')}`
}

export function loadMinecraftItemIcons () {
  if (!catalogRequest) {
    catalogRequest = fetch(CATALOG_URL)
      .then(response => {
        if (!response.ok) throw new Error(`Icon catalog request failed (${response.status}).`)
        return response.json()
      })
      .then(catalog => {
        if (!Array.isArray(catalog)) throw new Error('The icon catalog returned an unexpected response.')

        const files = catalog.flatMap(category => Array.isArray(category.files) ? category.files : [])
        if (files.length === 0) throw new Error('The icon catalog contains no items.')

        const icons = new Map()

        for (const entry of files) {
          if (entry.category_slug !== '10-items') continue

          const url = iconUrl(entry)
          for (const key of [entry.file, entry.file_slug]) {
            const normalized = keyOf(key?.replace(/\.png$/i, ''))
            if (normalized && !icons.has(normalized)) icons.set(normalized, url)
          }
        }

        if (icons.size === 0) throw new Error('The icon catalog contains no item icons.')
        return icons
      })
      .catch(error => {
        catalogRequest = null
        throw error
      })
  }

  return catalogRequest
}

export function itemIcon (icons, item) {
  if (!icons || !item) return null
  const itemName = keyOf(item.itemName)
  const displayName = keyOf(item.name)
  return ITEM_ICON_OVERRIDES[itemName] ?? ITEM_ICON_OVERRIDES[displayName] ?? icons.get(itemName) ?? icons.get(displayName) ?? null
}
