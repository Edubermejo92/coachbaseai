import { useState } from 'react'
import { TECHNICAL_ROLES, type Player, type PlayerCompletion } from '../types'
import type { Identity } from './IdentityBar'

interface PlayersChecklistProps {
  players: Player[]
  completions: Record<string, PlayerCompletion>
  identity: Identity
  onAddPlayer: (name: string) => void
  onRemovePlayer: (playerId: string) => void
  onToggleCompletion: (playerId: string) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PlayersChecklist({
  players,
  completions,
  identity,
  onAddPlayer,
  onRemovePlayer,
  onToggleCompletion,
}: PlayersChecklistProps) {
  const [newName, setNewName] = useState('')
  const isTechnicalStaff = TECHNICAL_ROLES.includes(identity.role)
  const completedCount = players.filter((p) => completions[p.id]).length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Ejercicios de pretemporada por jugador</p>
          <p className="mt-1 text-sm text-slate-600">
            El equipo técnico (entrenador/a y director/a deportivo/a) confirma si cada jugador ha
            realizado los ejercicios del Plan de Pretemporada.
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {completedCount}/{players.length}
        </span>
      </div>

      {players.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          Todavía no hay jugadores en la plantilla. Añade el primero abajo.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {players.map((player) => {
            const completion = completions[player.id]
            return (
              <li key={player.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{player.name}</p>
                  {completion ? (
                    <p className="text-xs text-emerald-700">
                      Confirmado por {completion.name || completion.role} · {formatDate(completion.confirmedAt)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Ejercicios no confirmados</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isTechnicalStaff ? (
                    <button
                      onClick={() => onToggleCompletion(player.id)}
                      className={
                        completion
                          ? 'rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
                          : 'rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500'
                      }
                    >
                      {completion ? 'Deshacer' : 'Confirmar realizado'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300">Solo el equipo técnico puede confirmar</span>
                  )}
                  <button
                    onClick={() => onRemovePlayer(player.id)}
                    aria-label={`Quitar a ${player.name} de la plantilla`}
                    className="rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          onAddPlayer(newName.trim())
          setNewName('')
        }}
        className="mt-4 flex gap-2"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del jugador/a"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Añadir jugador/a
        </button>
      </form>
    </div>
  )
}
