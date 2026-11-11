/*
  Keeps track of who is logged in. Any component can call useAuth() to get
  the current user, or to log in / register / log out.
*/
import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  function saveSession(data) {
    localStorage.setItem('access', data.access)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login/', { email, password })
    return saveSession(data)
  }

  async function register(form) {
    const { data } = await api.post('/auth/register/', form)
    // Return API response data directly without triggering saveSession
    return data
  }

  function updateUser(newUser) {
    localStorage.setItem('user', JSON.stringify(newUser))
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('access')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Where each role goes after logging in
export function homePath(role) {
  if (role === 'donor') return '/donor'
  if (role === 'hospital_manager') return '/hospital'
  if (role === 'admin') return '/admin'
  return '/login'
}