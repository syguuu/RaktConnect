const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL is not configured. Set it in frontend/.env')
}

export const API_URL = `${API_BASE_URL}/api`
export const SOCKET_URL = API_BASE_URL