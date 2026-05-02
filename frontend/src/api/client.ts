import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'house-meal-system-token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    const validationMessages = data?.errors ? Object.values(data.errors).flat() : []

    if (validationMessages.length) {
      return validationMessages.join('\n')
    }

    return data?.message ?? 'Something went wrong.'
  }

  return 'Something went wrong.'
}
