import type { TeamDocument } from '../types'

export function DocumentCard({ document }: { document: TeamDocument }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{document.title}</p>
        <p className="mt-1 text-sm text-slate-600">{document.description}</p>
        <p className="mt-2 text-xs text-slate-400">Subido el {document.uploadedAt}</p>
        <div className="mt-3 flex gap-2">
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Ver PDF
          </a>
          <a
            href={document.fileUrl}
            download
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Descargar
          </a>
        </div>
      </div>
    </div>
  )
}
