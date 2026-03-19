import type { UserResponseDto } from '../../api/model'

const AUTH_STORAGE_KEY = 'silkworm.admin.auth'
const LEGACY_TOKEN_KEY = 'token'

export type AuthUser = Pick<UserResponseDto, 'Id' | 'Email' | 'Name'>

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  user?: AuthUser
}

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

export const getAuthSession = (): AuthSession | null => {
  if (!canUseStorage()) {
    return null
  }

  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed.accessToken) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export const setAuthSession = (session: AuthSession): void => {
  if (!canUseStorage()) {
    return
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  localStorage.setItem(LEGACY_TOKEN_KEY, session.accessToken)
}

export const clearAuthSession = (): void => {
  if (!canUseStorage()) {
    return
  }

  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}
