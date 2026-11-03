export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// Same table as backend/donations/matching.py
export const COMPATIBLE_DONORS = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': BLOOD_GROUPS,
}

// "2026-10-15" -> "15 Oct 2026"
export function formatDate(value) {
  if (!value) return '-'
  const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// "14:30:00" -> "14:30"
export function formatTime(value) {
  return value ? String(value).slice(0, 5) : '-'
}

// Today's date as "YYYY-MM-DD" (local time), for date inputs
export function today() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function daysUntil(value) {
  if (!value) return 0
  const diff = new Date(`${value}T00:00:00`) - new Date(new Date().toDateString())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/*
  Turns an error from the API into one readable sentence.
  Django REST Framework sends either {"detail": "..."} or {"field": ["message"]}.
*/
export function errorMessage(error) {
  const data = error?.response?.data
  if (!data) return 'Cannot reach the server. Make sure the backend is running.'
  if (typeof data === 'string') return 'Something went wrong on the server.'
  if (data.detail) return data.detail
  const [field, messages] = Object.entries(data)[0] || []
  const text = Array.isArray(messages) ? messages[0] : messages
  if (!field) return 'Something went wrong.'
  return field === 'non_field_errors' ? text : `${field.replaceAll('_', ' ')}: ${text}`
}
