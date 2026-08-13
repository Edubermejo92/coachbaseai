import { useMemo } from 'react'
import { teams } from './data/seed'
import type { Confirmation, Role } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { IdentityBar, type Identity } from './components/IdentityBar'
import { DocumentCard } from './components/DocumentCard'
import { ChecklistCard } from './components/ChecklistCard'

const team = teams[0]

export default function App() {
  const [identity, setIdentity] = useLocalStorage<Identity>('coachbase.identity', {
    role: 'delegado',
    name: '',
  })

  const [confirmationsByTask, setConfirmationsByTask] = useLocalStorage<
    Record<string, Confirmation[]>
  >('coachbase.confirmations', {})

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
      </main>
    </div>
  )
}
