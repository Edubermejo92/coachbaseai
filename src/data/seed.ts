import type { Team } from '../types'

export const teams: Team[] = [
  {
    id: 'chamartin-vergara-infantil-b',
    club: 'Chamartín Vergara',
    name: 'Infantil B',
    category: 'Infantil · nacidos en 2014',
    documents: [
      {
        id: 'plan-pretemporada-2026-27',
        title: 'Plan de Pretemporada 2026-27',
        description:
          'Trabajo previo de agosto 2026: 3 semanas de reactivación, desarrollo y aproximación antes del inicio de la pretemporada del equipo el 2 de septiembre.',
        fileUrl: '/documents/Plan_Pretemporada_Infantil_B_202627.pdf',
        uploadedAt: '2026-08-13',
      },
    ],
    tasks: [
      {
        id: 'revision-plan-pretemporada-2026-27',
        title: 'Revisión y difusión del Plan de Pretemporada',
        description:
          'Confirmar que el Plan de Pretemporada 2026-27 se ha revisado y compartido con las familias y jugadores del equipo antes del inicio de las sesiones (martes 11 de agosto).',
        documentId: 'plan-pretemporada-2026-27',
        requiredRoles: ['delegado', 'entrenador', 'director_deportivo'],
      },
    ],
  },
]
