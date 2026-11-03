/*
  Small reusable building blocks (buttons, inputs, badges...).
  Pages import these so every screen looks the same.
*/

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-blood text-white hover:bg-blood-dark',
    secondary: 'border border-line bg-white text-ink hover:bg-canvas',
    danger: 'border border-blood bg-white text-blood hover:bg-blood-soft',
  }
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood/40 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const Input = (props) => <input className="field" {...props} />
export const Textarea = (props) => <textarea className="field" rows={3} {...props} />
export const Select = ({ children, ...props }) => (
  <select className="field" {...props}>
    {children}
  </select>
)

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-md border border-line bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null
  const styles = {
    error: 'border-blood/30 bg-blood-soft text-blood-dark',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-line bg-canvas text-ink',
  }
  return <div className={`mb-4 rounded-md border px-4 py-3 text-sm ${styles[kind]}`}>{children}</div>
}

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-sky-50 text-sky-800 border-sky-200',
  scheduled: 'bg-sky-50 text-sky-800 border-sky-200',
  reschedule_requested: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-green-50 text-green-800 border-green-200',
  completed: 'bg-green-100 text-green-900 border-green-300',
  declined: 'bg-gray-100 text-gray-700 border-gray-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  verified: 'bg-green-50 text-green-800 border-green-200',
  rejected: 'bg-blood-soft text-blood-dark border-blood/30',
}

export function StatusBadge({ status, label }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.declined}`}>
      {label || status}
    </span>
  )
}

export function UrgencyBadge({ level, label }) {
  if (!level || level === 'normal') return null
  const style = level === 'critical' ? 'bg-blood text-white border-blood' : 'bg-blood-soft text-blood-dark border-blood/30'
  return <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${style}`}>{label || level}</span>
}

// The blood group "tag" used across the app, e.g. [ O+ ]
export function BloodGroup({ group, size = 'sm' }) {
  const sizes = {
    sm: 'h-9 min-w-9 px-1.5 text-sm',
    lg: 'h-24 min-w-24 px-4 text-5xl',
  }
  return (
    <span className={`inline-flex items-center justify-center rounded-md border-2 border-blood font-bold text-blood ${sizes[size]}`}>
      {group || '?'}
    </span>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-white px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  )
}

export function Loading() {
  return <p className="py-8 text-center text-sm text-muted">Loading...</p>
}

export function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-line bg-white px-5 py-4">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}
