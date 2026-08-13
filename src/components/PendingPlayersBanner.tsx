import type { Player } from '../types'

interface PendingPlayersBannerProps {
  players: Player[]
  pendingPlayers: Player[]
}

export function PendingPlayersBanner({ players, pendingPlayers }: PendingPlayersBannerProps) {
  if (players.length === 0) return null

  const allDone = pendingPlayers.length === 0

  if (allDone) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <p className="text-sm font-medium text-emerald-900">
          Todos los jugadores ({players.length}) han completado los ejercicios de pretemporada.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-3.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </span>
        <p className="text-sm font-semibold text-amber-900">
          Faltan {pendingPlayers.length} de {players.length} jugadores por completar los ejercicios de pretemporada
        </p>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2 pl-11">
        {pendingPlayers.map((player) => (
          <li
            key={player.id}
            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800 shadow-sm"
          >
            {player.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
