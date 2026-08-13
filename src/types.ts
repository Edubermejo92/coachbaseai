export type Role = 'delegado' | 'entrenador' | 'director_deportivo'

export const ROLE_LABELS: Record<Role, string> = {
  delegado: 'Delegado/a',
  entrenador: 'Entrenador/a',
  director_deportivo: 'Director/a Deportivo/a',
}

export const ROLES: Role[] = ['delegado', 'entrenador', 'director_deportivo']

// Roles con permiso para confirmar, jugador a jugador, si ha realizado los ejercicios de pretemporada.
export const TECHNICAL_ROLES: Role[] = ['entrenador', 'director_deportivo']

export interface Confirmation {
  role: Role
  name: string
  confirmedAt: string
}

export interface Player {
  id: string
  name: string
}

export interface PlayerCompletion {
  role: Role
  name: string
  confirmedAt: string
}

export interface TeamDocument {
  id: string
  title: string
  description: string
  fileUrl: string
  uploadedAt: string
}

export interface ChecklistTask {
  id: string
  title: string
  description: string
  documentId: string
  requiredRoles: Role[]
}

export interface Team {
  id: string
  club: string
  name: string
  category: string
  documents: TeamDocument[]
  tasks: ChecklistTask[]
  players: Player[]
}
