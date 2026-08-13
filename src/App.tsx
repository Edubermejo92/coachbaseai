import { useMemo } from 'react'
import { teams } from './data/seed'
import type { Confirmation, Player, PlayerCompletion, Role } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { IdentityBar, type Identity } from './components/IdentityBar'
import { DocumentCard } from './components/DocumentCard'
import { ChecklistCard } from './components/ChecklistCard'
import { PendingPlayersBanner } from './components/PendingPlayersBanner'
import { PlayersChecklist } from './components/PlayersChecklist'

const team = teams[0]

export default function App() {
  const [identity, setIdentity] = useLocalStorage<Identity>('coachbase.identity', {
    role: 'delegado',
    name: '',
  })

  const [confirmationsByTask, setConfirmationsByTask] = useLocalStorage<
    Record<string, Confirmation[]>
  >('coachbase.confirmations', {})

  const [players, setPlayers] = useLocalStorage<Player[]>(
    `coachbase.roster.${team.id}`,
    team.players,
  )

  const [playerCompletions, setPlayerCompletions] = useLocalStorage<
    Record<string, PlayerCompletion>
  >(`coachbase.playerCompletions.${team.id}`, {})

  const handleConfirm = (taskId: string) => (role: Role, name: string) => {
    setConfirmationsByTask((prev) => {
      const existing = prev[taskId] ?? []
      const withoutRole = existing.filter((c) => c.role !== role)
      const next: Confirmation = { role, name: name.trim(), confirmedAt: new Date().toISOString() }
      return { ...prev, [taskId]: [...withoutRole, next] }
    })
  }

  const handleUndo = (taskId: string) => (role: Role) => {
    setConfirmationsByTask((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).filter((c) => c.role !== role),
    }))
  }

  const handleAddPlayer = (name: string) => {
    setPlayers((prev) => [...prev, { id: crypto.randomUUID(), name }])
  }

  const handleRemovePlayer = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId))
    setPlayerCompletions((prev) => {
      const { [playerId]: _removed, ...rest } = prev
      return rest
    })
  }

  const handleTogglePlayerCompletion = (playerId: string) => {
    setPlayerCompletions((prev) => {
      if (prev[playerId]) {
        const { [playerId]: _removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [playerId]: {
          role: identity.role,
          name: identity.name.trim(),
          confirmedAt: new Date().toISOString(),
        },
      }
    })
  }

  const pendingPlayers = useMemo(
    () => players.filter((p) => !playerCompletions[p.id]),
    [players, playerCompletions],
  )

  const overallStatus = useMemo(() => {
    const totalRequired = team.tasks.reduce((sum, t) => sum + t.requiredRoles.length, 0)
    const totalConfirmed = team.tasks.reduce((sum, t) => {
      const confirmations = confirmationsByTask[t.id] ?? []
      return sum + t.requiredRoles.filter((role) => confirmations.some((c) => c.role === role)).length
    }, 0)
    return { totalRequired, totalConfirmed }
  }, [confirmationsByTask])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              CB
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-900">CoachBase AI</p>
              <p className="text-xs leading-tight text-slate-500">Gestión de equipos</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {overallStatus.totalConfirmed}/{overallStatus.totalRequired} verificaciones completadas
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <PendingPlayersBanner players={players} pendingPlayers={pendingPlayers} />

        <div>
          <p className="text-sm font-medium text-emerald-700">{team.club}</p>
          <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
          <p className="text-sm text-slate-500">{team.category}</p>
        </div>

        <IdentityBar identity={identity} onChange={setIdentity} />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Documentos
          </h2>
          <div className="space-y-3">
            {team.documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tareas de pretemporada
          </h2>
          <div className="space-y-3">
            {team.tasks.map((task) => (
              <ChecklistCard
                key={task.id}
                task={task}
                confirmations={confirmationsByTask[task.id] ?? []}
                identity={identity}
                onConfirm={handleConfirm(task.id)}
                onUndo={handleUndo(task.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Jugadores
          </h2>
          <PlayersChecklist
            players={players}
            completions={playerCompletions}
            identity={identity}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onToggleCompletion={handleTogglePlayerCompletion}
          />
        </section>
      </main>
    </div>
  )
}
