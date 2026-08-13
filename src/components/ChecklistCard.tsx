import { ROLE_LABELS, type ChecklistTask, type Confirmation, type Role } from '../types'
import { StatusBadge } from './StatusBadge'
import type { Identity } from './IdentityBar'

interface ChecklistCardProps {
  task: ChecklistTask
  confirmations: Confirmation[]
  identity: Identity
  onConfirm: (role: Role, name: string) => void
  onUndo: (role: Role) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChecklistCard({ task, confirmations, identity, onConfirm, onUndo }: ChecklistCardProps) {
  const confirmedCount = task.requiredRoles.filter((role) =>
    confirmations.some((c) => c.role === role),
  ).length

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{task.title}</p>
          <p className="mt-1 text-sm text-slate-600">{task.description}</p>
        </div>
        <StatusBadge confirmedCount={confirmedCount} totalCount={task.requiredRoles.length} />
      </div>

      <ul className="mt-4 divide-y divide-slate-100">
        {task.requiredRoles.map((role) => {
          const confirmation = confirmations.find((c) => c.role === role)
          const isMe = identity.role === role
          return (
            <li key={role} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{ROLE_LABELS[role]}</p>
                {confirmation ? (
                  <p className="text-xs text-emerald-700">
                    Confirmado por {confirmation.name || ROLE_LABELS[role]} · {formatDate(confirmation.confirmedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">Sin confirmar</p>
                )}
              </div>

              {confirmation ? (
                isMe && (
                  <button
                    onClick={() => onUndo(role)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Deshacer
                  </button>
                )
              ) : isMe ? (
                <button
                  onClick={() => onConfirm(role, identity.name)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Marcar como revisado
                </button>
              ) : (
                <span className="text-xs text-slate-300">Pendiente de {ROLE_LABELS[role]}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
