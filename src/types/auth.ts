export type UserRole = 'hospital' | 'blood_bank' | 'donor' | 'admin'

export const ROLES: readonly UserRole[] = ['hospital', 'blood_bank', 'donor', 'admin'] as const

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name?: string | null
  created_at?: string
}

export interface SignUpParams {
  email: string
  password: string
  role: UserRole
  fullName?: string
}

export interface SignInParams {
  email: string
  password: string
}

export interface AuthSessionData {
  user: any
  session: any
  profile: UserProfile | null
}

export interface AuthResult<T = any> {
  data: T | null
  error: Error | { message: string; code?: string } | null
}
