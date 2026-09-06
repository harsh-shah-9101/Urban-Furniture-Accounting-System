const AVATAR_COLORS = [
  'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
  'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400',
  'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400',
]

export function getAvatarColor(name: string) {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0]]
  return letters.filter(Boolean).join('').toUpperCase()
}
