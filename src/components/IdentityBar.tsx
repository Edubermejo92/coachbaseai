import { ROLE_LABELS, ROLES, type Role } from '../types'

export interface Identity {
  role: Role
  name: string
}

interface IdentityBarProps {
  identity: Identity
  onChange: (identity: Identity) => void
}

export function IdentityBar({ identity, onChange }: IdentityBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-slate-500">Estás viendo la app como</span>
      <select
        value={identity.role}
        onChange={(e) => onChange({ ...identity, role: e.target.value as Role })}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Tu nombre"
        value={identity.name}
        onChange={(e) => onChange({ ...identity, name: e.target.value })}
        className="w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  )
}
