export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getRole() {
  return getStoredUser()?.role || localStorage.getItem('role') || null
}

export function setStoredUser(user) {
  localStorage.setItem('user', JSON.stringify(user))
  if (user?.role) localStorage.setItem('role', user.role)
}

export function clearAuth() {
  localStorage.removeItem('user')
  localStorage.removeItem('role')
  localStorage.removeItem('token')
}

/** Pages each role may open */
export const ROLE_PAGES = {
  admin: ['/dashboard', '/deliveries', '/history', '/admin'],
  manager: ['/dashboard', '/deliveries', '/history'],
  driver: ['/dashboard', '/history'],
}

export function canAccessPath(role, path) {
  const pages = ROLE_PAGES[role] || []
  return pages.some((p) => path === p || path.startsWith(`${p}/`))
}

export function homeForRole(role) {
  if (role === 'driver') return '/dashboard'
  if (role === 'admin') return '/dashboard'
  return '/dashboard'
}

export function canManageUsers(role) {
  return role === 'admin'
}

export function canEditOperations(role) {
  return role === 'admin' || role === 'manager'
}
