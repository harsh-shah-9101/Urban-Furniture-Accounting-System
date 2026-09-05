import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function PageHeader({
  title,
  description,
  actions,
  backTo,
}: {
  title: string
  description?: string
  actions?: ReactNode
  /** Shows a back button. Pass a path to navigate there, or `true` to go back in history. */
  backTo?: string | true
}) {
  const navigate = useNavigate()

  function handleBack() {
    if (backTo === true) {
      navigate(-1)
    } else if (backTo) {
      navigate(backTo)
    }
  }

  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {backTo && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="-ml-1.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
