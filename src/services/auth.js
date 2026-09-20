import { supabase } from '../lib/supabase.js'

/**
 * Valid LIFE-LINK user roles
 */
export const VALID_ROLES = ['hospital', 'blood_bank', 'donor', 'admin']

/**
 * Format auth errors with actionable descriptions
 * @param {any} error
 * @returns {Error}
 */
function formatAuthError(error) {
  if (!error) return null

  if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
    return new Error(
      'Email rate limit exceeded by Supabase. In development, please disable "Confirm email" in Supabase Dashboard (Authentication > Providers > Email).'
    )
  }

  if (error.code === 'email_not_confirmed') {
    return new Error(
      'Email not confirmed yet. Please verify your email or disable "Confirm email" in your Supabase project settings.'
    )
  }

  if (error.code === 'invalid_credentials') {
    return new Error('Invalid email or password. Please check your credentials.')
  }

  return error instanceof Error ? error : new Error(error.message || 'Authentication error')
}

/**
 * Sign up a new user with email, password, and role
 * Stores user metadata and creates a record in the `profiles` table.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {'hospital'|'blood_bank'|'donor'|'admin'} params.role
 * @param {string} [params.fullName]
 * @returns {Promise<{data: {user: any, session: any, profile: any}|null, error: any}>}
 */
export async function signUp({ email, password, role, fullName = '' }) {
  if (!email || !password || !role) {
    return {
      data: null,
      error: new Error('Email, password, and role are required for registration.'),
    }
  }

  if (!VALID_ROLES.includes(role)) {
    return {
      data: null,
      error: new Error(
        `Invalid role: "${role}". Must be one of: ${VALID_ROLES.join(', ')}`
      ),
    }
  }

  // 1. Register with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
      },
    },
  })

  if (authError) {
    return { data: null, error: formatAuthError(authError) }
  }

  const user = authData?.user
  let profile = null

  // 2. If immediate session exists (e.g. auto-confirm enabled), save to profiles table
  if (user && authData?.session) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || email,
        role,
        full_name: fullName,
      })
      .select()
      .maybeSingle()

    if (profileError) {
      console.error('Failed to create profile row during signup:', profileError)
    } else {
      profile = profileData
    }
  }

  return {
    data: {
      user,
      session: authData?.session || null,
      profile,
    },
    error: null,
  }
}

/**
 * Sign in user with email and password
 * Retrieves user session and matching profile with role
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{data: {user: any, session: any, profile: any}|null, error: any}>}
 */
export async function signIn({ email, password }) {
  if (!email || !password) {
    return {
      data: null,
      error: new Error('Email and password are required to sign in.'),
    }
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (authError) {
    return { data: null, error: formatAuthError(authError) }
  }

  const user = authData?.user
  let profile = null

  if (user) {
    // Retrieve profile from profiles table
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (existingProfile) {
      profile = existingProfile
    } else if (!fetchError) {
      // Ensure profile exists in profiles table using user metadata if not yet created
      const role = user.user_metadata?.role || 'donor'
      const fullName = user.user_metadata?.full_name || ''

      const { data: newProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || email,
          role,
          full_name: fullName,
        })
        .select()
        .maybeSingle()

      if (!upsertError) {
        profile = newProfile
      }
    }
  }

  return {
    data: {
      user,
      session: authData?.session || null,
      profile,
    },
    error: null,
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{data: {success: boolean}|null, error: any}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    return { data: null, error: formatAuthError(error) }
  }
  return { data: { success: true }, error: null }
}

/**
 * Get current authenticated user
 * @returns {Promise<{data: any, error: any}>}
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return { data: null, error: formatAuthError(error) }
  }
  return { data: user, error: null }
}

/**
 * Get current session and tokens
 * @returns {Promise<{data: any, error: any}>}
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    return { data: null, error: formatAuthError(error) }
  }
  return { data: session, error: null }
}

/**
 * Get profile for a specific user ID or current user
 * @param {string} [userId]
 * @returns {Promise<{data: any, error: any}>}
 */
export async function getUserProfile(userId) {
  let targetId = userId

  if (!targetId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: new Error('User is not authenticated.') }
    }
    targetId = user.id
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .maybeSingle()

  if (error) {
    return { data: null, error: formatAuthError(error) }
  }
  return { data, error: null }
}

/**
 * Get user role from profiles table
 * @param {string} [userId]
 * @returns {Promise<{data: 'hospital'|'blood_bank'|'donor'|'admin'|null, error: any}>}
 */
export async function getUserRole(userId) {
  const { data: profile, error } = await getUserProfile(userId)
  if (error) {
    return { data: null, error }
  }
  return { data: profile?.role || null, error: null }
}

/**
 * Check if the user has one of the allowed roles
 * @param {string|string[]} allowedRoles
 * @param {string} [userId]
 * @returns {Promise<{data: boolean, error: any}>}
 */
export async function hasRole(allowedRoles, userId) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const { data: currentRole, error } = await getUserRole(userId)

  if (error) {
    return { data: false, error }
  }

  return {
    data: !!currentRole && roles.includes(currentRole),
    error: null,
  }
}

/**
 * Update user profile
 * @param {string} userId
 * @param {Object} updates
 * @returns {Promise<{data: any, error: any}>}
 */
export async function updateProfile(userId, updates) {
  if (!userId) {
    return { data: null, error: new Error('User ID is required.') }
  }

  if (updates.role && !VALID_ROLES.includes(updates.role)) {
    return {
      data: null,
      error: new Error(
        `Invalid role: "${updates.role}". Must be one of: ${VALID_ROLES.join(', ')}`
      ),
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) {
    return { data: null, error: formatAuthError(error) }
  }

  return { data, error: null }
}

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<{data: any, error: any}>}
 */
export async function resetPassword(email) {
  if (!email) {
    return { data: null, error: new Error('Email is required.') }
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) {
    return { data: null, error: formatAuthError(error) }
  }
  return { data, error: null }
}

/**
 * Listen to auth state changes and fetch profile
 * @param {Function} callback (event, session, profile)
 * @returns {{ unsubscribe: Function }}
 */
export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    let profile = null
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      profile = data
    }
    callback(event, session, profile)
  })

  return subscription
}
