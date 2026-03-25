import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AUTH_TOKEN_KEY, clearAuthSession } from './services/api'

const originalFetch = window.fetch.bind(window)
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || ''
  const isApiRequest = url.includes('/api/') || url.startsWith('/api/')

  if (!isApiRequest) {
    return originalFetch(input, init)
  }

  const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined))
  const token = localStorage.getItem(AUTH_TOKEN_KEY)

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await originalFetch(input, { ...init, headers })

  if (response.status === 401 && !url.includes('/auth/login')) {
    clearAuthSession()
    window.dispatchEvent(new Event('auth:unauthorized'))
  }

  return response
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
