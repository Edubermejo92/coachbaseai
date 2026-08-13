export type Role = 'delegado' | 'entrenador' | 'director_deportivo'

export const ROLE_LABELS: Record<Role, string> = {
  delegado: 'Delegado/a',
  entrenador: 'Entrenador/a',
  director_deportivo: 'Director/a Deportivo/a',
}

export const ROLES: Role[] = ['delegado', 'entrenador', 'director_deportivo']

export interface Confirmation {
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
}
